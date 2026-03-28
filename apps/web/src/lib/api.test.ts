import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError } from './api'
import { useAuthStore } from '../store/auth-store'
import { useUiStore } from '../store/ui-store'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('api refresh flow', () => {
  beforeEach(() => {
    useUiStore.setState({ language: 'es' })
    useAuthStore.setState({
      accessToken: 'expired-access-token',
      refreshToken: 'valid-refresh-token',
      user: {
        id: '1',
        fullName: 'Admin',
        email: 'admin@admin.com',
        role: 'ADMIN',
        assignedLocationId: null,
        assignedLocationName: null,
        organizationId: 'org-1',
        organizationName: 'TuInventario',
      },
    })
  })

  afterEach(() => {
    useAuthStore.getState().clearSession()
    vi.restoreAllMocks()
  })

  it('refreshes the access token and retries the original request once', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: 'TOKEN_EXPIRED', message: 'Expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: useAuthStore.getState().user,
      }))
      .mockResolvedValueOnce(jsonResponse({
        totalItems: 4,
        activeLoans: 1,
        overdueLoans: 0,
        recentMovements: 2,
        lowStockAlerts: [],
        hasOperationalData: true,
      }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await api.dashboard()

    expect(response.totalItems).toBe(4)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/auth/refresh')
    expect(fetchMock.mock.calls[2]?.[1]?.headers.get('Authorization')).toBe('Bearer new-access-token')
    expect(useAuthStore.getState().accessToken).toBe('new-access-token')
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token')
  })

  it('clears the session when the refresh token is no longer valid', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: 'TOKEN_EXPIRED', message: 'Expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({ code: 'INVALID_REFRESH_TOKEN', message: 'Refresh invalido' }, 401))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.dashboard()).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('shares a single refresh request across concurrent 401 responses', async () => {
    let dashboardAttempts = 0
    let refreshCalls = 0
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = input.toString()
      if (url.includes('/auth/refresh')) {
        refreshCalls += 1
        return Promise.resolve(jsonResponse({
          accessToken: 'concurrent-access-token',
          refreshToken: 'concurrent-refresh-token',
          user: useAuthStore.getState().user,
        }))
      }
      if (url.includes('/dashboard')) {
        dashboardAttempts += 1
        if (dashboardAttempts <= 2) {
          return Promise.resolve(jsonResponse({ code: 'TOKEN_EXPIRED', message: 'Expirado' }, 401))
        }
        return Promise.resolve(jsonResponse({
          totalItems: 2,
          activeLoans: 0,
          overdueLoans: 0,
          recentMovements: 0,
          lowStockAlerts: [],
          hasOperationalData: true,
        }))
      }
      return Promise.reject(new Error(`Unexpected URL ${url}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([api.dashboard(), api.dashboard()])

    expect(first.totalItems).toBe(2)
    expect(second.totalItems).toBe(2)
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().accessToken).toBe('concurrent-access-token')
  })
})
