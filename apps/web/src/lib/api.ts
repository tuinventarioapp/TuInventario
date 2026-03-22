import { useAuthStore } from '../store/auth-store'
import { useUiStore } from '../store/ui-store'
import type {
  AuditEntry,
  AuthResponse,
  Borrower,
  DashboardSummary,
  Item,
  Loan,
  LoanRequestItem,
  OptionItem,
  PageResponse,
  SettingsPayload,
  UserSummary,
  Movement,
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

type ErrorPayload = {
  code?: string
  message?: string
  details?: Record<string, string>
}

export class ApiError extends Error {
  code?: string
  details?: Record<string, string>
  status: number

  constructor(status: number, payload?: ErrorPayload) {
    super(payload?.message ?? 'No fue posible completar la solicitud.')
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.code
    this.details = payload?.details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken, clearSession } = useAuthStore.getState()
  const { language } = useUiStore.getState()
  const headers = new Headers(init?.headers)
  headers.set('Accept-Language', language)
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    clearSession()
  }

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorPayload | null
    throw new ApiError(response.status, errorPayload ?? undefined)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return (await response.text()) as T
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const { accessToken, clearSession } = useAuthStore.getState()
  const { language } = useUiStore.getState()
  const headers = new Headers(init?.headers)
  headers.set('Accept-Language', language)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    clearSession()
  }

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorPayload | null
    throw new ApiError(response.status, errorPayload ?? undefined)
  }

  return response.blob()
}

type ItemFilters = {
  query?: string
  categoryId?: string
  status?: string
  type?: string
  locationId?: string
  stockFilter?: string
  minAvailableStock?: number | string
  maxAvailableStock?: number | string
  page?: number
  size?: number
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { fullName: string; email: string; password: string; organizationName: string; timezone: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  dashboard: (locationId?: string) => request<DashboardSummary>(`/dashboard${buildQuery({ locationId })}`),
  items: (filters: ItemFilters = {}) =>
    request<PageResponse<Item>>(`/items${buildQuery({
      query: filters.query ?? '',
      categoryId: filters.categoryId,
      status: filters.status,
      type: filters.type,
      locationId: filters.locationId,
      stockFilter: filters.stockFilter,
      minAvailableStock: filters.minAvailableStock,
      maxAvailableStock: filters.maxAvailableStock,
      page: filters.page ?? 0,
      size: filters.size ?? 10,
    })}`),
  item: (id: string) => request<Item>(`/items/${id}`),
  createItem: (payload: unknown) => request<Item>('/items', { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (id: string, payload: unknown) => request<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  categories: () => request<OptionItem[]>('/categories'),
  createCategory: (payload: unknown) => request<OptionItem>('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: unknown) => request<OptionItem>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  units: () => request<OptionItem[]>('/units'),
  createUnit: (payload: unknown) => request<OptionItem>('/units', { method: 'POST', body: JSON.stringify(payload) }),
  updateUnit: (id: string, payload: unknown) => request<OptionItem>(`/units/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUnit: (id: string) => request<void>(`/units/${id}`, { method: 'DELETE' }),
  locations: () => request<OptionItem[]>('/locations'),
  createLocation: (payload: unknown) => request<OptionItem>('/locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateLocation: (id: string, payload: unknown) => request<OptionItem>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLocation: (id: string) => request<void>(`/locations/${id}`, { method: 'DELETE' }),
  publicItems: (organizationId: string) => request<OptionItem[]>(`/public-items?organizationId=${encodeURIComponent(organizationId)}`),
  borrowers: () => request<Borrower[]>('/borrowers'),
  createBorrower: (payload: unknown) => request<Borrower>('/borrowers', { method: 'POST', body: JSON.stringify(payload) }),
  updateBorrower: (id: string, payload: unknown) => request<Borrower>(`/borrowers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBorrower: (id: string) => request<void>(`/borrowers/${id}`, { method: 'DELETE' }),
  createMovement: (payload: unknown) => request<Movement>('/movements', { method: 'POST', body: JSON.stringify(payload) }),
  movements: (page = 0, size = 10, locationId?: string) => request<PageResponse<Movement>>(`/movements${buildQuery({ page, size, locationId })}`),
  loanRequests: (locationId?: string) => request<LoanRequestItem[]>(`/loan-requests${buildQuery({ locationId })}`),
  createLoanRequest: (payload: unknown) => request<LoanRequestItem>('/loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  publicLoanRequest: (payload: unknown) => request<LoanRequestItem>('/public-loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  approveLoanRequest: (id: string) => request<Loan>(`/loan-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({}) }),
  loans: (locationId?: string) => request<Loan[]>(`/loans${buildQuery({ locationId })}`),
  deliverLoan: (id: string, payload: unknown = {}) => request<Loan>(`/loans/${id}/deliver`, { method: 'POST', body: JSON.stringify(payload) }),
  returnLoan: (id: string, payload: unknown) => request<Loan>(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  users: () => request<UserSummary[]>('/users'),
  createUser: (payload: unknown) => request<UserSummary>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: unknown) => request<UserSummary>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetUserPassword: (id: string, payload: unknown) => request<void>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  settings: () => request<SettingsPayload>('/settings'),
  audit: (page = 0, size = 10) => request<PageResponse<AuditEntry>>(`/audit-log?page=${page}&size=${size}`),
  inventoryCsv: (locationId?: string) => requestBlob(`/reports/inventory.csv${buildQuery({ locationId })}`),
  inventoryAdminCsv: (locationId?: string) => requestBlob(`/reports/inventory-admin.csv${buildQuery({ locationId })}`),
  loansCsv: (locationId?: string) => requestBlob(`/reports/loans.csv${buildQuery({ locationId })}`),
  inventoryPdf: (locationId?: string) => requestBlob(`/reports/inventory.pdf${buildQuery({ locationId })}`),
  inventoryAdminPdf: (locationId?: string) => requestBlob(`/reports/inventory-admin.pdf${buildQuery({ locationId })}`),
}
