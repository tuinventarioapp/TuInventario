import { useAuthStore } from '../store/auth-store'
import { useUiStore } from '../store/ui-store'
import type {
  ActionMessageResponse,
  AuditEntry,
  AuthResponse,
  Borrower,
  BorrowerLoanGroup,
  DashboardSummary,
  Item,
  ItemImportCommitResponse,
  ItemImportPreviewResponse,
  Loan,
  LoanRequestItem,
  OptionItem,
  PageResponse,
  SettingsPayload,
  UserSummary,
  Movement,
  RegistrationPendingResponse,
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

let refreshPromise: Promise<AuthResponse | null> | null = null

function shouldAttemptRefresh(path: string) {
  return ![
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
  ].includes(path)
}

function buildHeaders(init: RequestInit | undefined, accessToken: string | null) {
  const { language } = useUiStore.getState()
  const headers = new Headers(init?.headers)
  headers.set('Accept-Language', language)
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  return headers
}

async function performFetch(path: string, init: RequestInit | undefined, accessToken: string | null) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init, accessToken),
  })
}

async function refreshSession() {
  const { refreshToken, clearSession, setSession } = useAuthStore.getState()
  if (!refreshToken) {
    clearSession()
    return null
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await performFetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }, null)

      if (!response.ok) {
        clearSession()
        return null
      }

      const payload = await response.json() as AuthResponse
      setSession(payload)
      return payload
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function parseError(response: Response): Promise<never> {
  const errorPayload = (await response.json().catch(() => null)) as ErrorPayload | null
  throw new ApiError(response.status, errorPayload ?? undefined)
}

async function requestWithRetry<T>(
  path: string,
  init: RequestInit | undefined,
  parser: (response: Response) => Promise<T>,
  retried = false,
): Promise<T> {
  const { accessToken, clearSession } = useAuthStore.getState()
  const response = await performFetch(path, init, accessToken)

  if (response.status === 401 && !retried && shouldAttemptRefresh(path)) {
    const refreshedSession = await refreshSession()
    if (refreshedSession?.accessToken) {
      return requestWithRetry(path, init, parser, true)
    }
  }

  if (response.status === 401) {
    clearSession()
  }

  if (!response.ok) {
    return parseError(response)
  }

  return parser(response)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestWithRetry(path, init, async (response) => {
    if (response.status === 204) {
      return undefined as T
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json() as Promise<T>
    }

    return (await response.text()) as T
  })
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  return requestWithRetry(path, init, (response) => response.blob())
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

type AuditFilters = {
  entityType?: string
  action?: string
  actor?: string
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
}

type ReportFilters = {
  locationId?: string
  fromDate?: string
  toDate?: string
}

type MovementFilters = {
  query?: string
  movementType?: string
  locationId?: string
  minQuantity?: number | string
  maxQuantity?: number | string
  fromDate?: string
  toDate?: string
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
  register: (payload: { fullName: string; email: string; password: string; organizationName: string }) =>
    request<RegistrationPendingResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (payload: { email: string; code: string }) =>
    request<AuthResponse>('/auth/verify-email', { method: 'POST', body: JSON.stringify(payload) }),
  resendVerification: (payload: { email: string }) =>
    request<RegistrationPendingResponse>('/auth/resend-verification', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: { email: string }) =>
    request<ActionMessageResponse>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    request<ActionMessageResponse>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
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
  deleteItem: (id: string) => request<void>(`/items/${id}`, { method: 'DELETE' }),
  downloadItemImportTemplate: () => requestBlob('/items/import/template'),
  previewItemImport: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<ItemImportPreviewResponse>('/items/import/preview', { method: 'POST', body: formData })
  },
  commitItemImport: (file: File, updateSkus: string[]) => {
    const formData = new FormData()
    formData.append('file', file)
    updateSkus.forEach((sku) => formData.append('updateSkus', sku))
    return request<ItemImportCommitResponse>('/items/import/commit', { method: 'POST', body: formData })
  },
  categories: () => request<OptionItem[]>('/categories'),
  createCategory: (payload: unknown) => request<OptionItem>('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: unknown) => request<OptionItem>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  units: () => request<OptionItem[]>('/units'),
  createUnit: (payload: unknown) => request<OptionItem>('/units', { method: 'POST', body: JSON.stringify(payload) }),
  updateUnit: (id: string, payload: unknown) => request<OptionItem>(`/units/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUnit: (id: string) => request<void>(`/units/${id}`, { method: 'DELETE' }),
  locationCategories: () => request<OptionItem[]>('/location-categories'),
  createLocationCategory: (payload: unknown) => request<OptionItem>('/location-categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateLocationCategory: (id: string, payload: unknown) => request<OptionItem>(`/location-categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLocationCategory: (id: string) => request<void>(`/location-categories/${id}`, { method: 'DELETE' }),
  locations: () => request<OptionItem[]>('/locations'),
  createLocation: (payload: unknown) => request<OptionItem>('/locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateLocation: (id: string, payload: unknown) => request<OptionItem>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLocation: (id: string) => request<void>(`/locations/${id}`, { method: 'DELETE' }),
  publicItems: (organizationId: string) => request<OptionItem[]>(`/public-items?organizationId=${encodeURIComponent(organizationId)}`),
  borrowers: (query?: string) => request<Borrower[]>(`/borrowers${buildQuery({ query })}`),
  createBorrower: (payload: unknown) => request<Borrower>('/borrowers', { method: 'POST', body: JSON.stringify(payload) }),
  updateBorrower: (id: string, payload: unknown) => request<Borrower>(`/borrowers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBorrower: (id: string) => request<void>(`/borrowers/${id}`, { method: 'DELETE' }),
  createMovement: (payload: unknown) => request<Movement>('/movements', { method: 'POST', body: JSON.stringify(payload) }),
  movements: (filters: MovementFilters = {}) => request<PageResponse<Movement>>(`/movements${buildQuery({
    query: filters.query,
    movementType: filters.movementType,
    locationId: filters.locationId,
    minQuantity: filters.minQuantity,
    maxQuantity: filters.maxQuantity,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    page: filters.page ?? 0,
    size: filters.size ?? 10,
  })}`),
  loanRequests: (locationId?: string) => request<LoanRequestItem[]>(`/loan-requests${buildQuery({ locationId })}`),
  createLoanRequest: (payload: unknown) => request<LoanRequestItem>('/loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  publicLoanRequest: (payload: unknown) => request<LoanRequestItem>('/public-loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  createBorrowerLoanRequest: (payload: unknown) => request<BorrowerLoanGroup>('/borrower-loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  borrowerLoanRequests: (locationId?: string) => request<BorrowerLoanGroup[]>(`/borrower-loan-requests${buildQuery({ locationId })}`),
  myBorrowerLoanRequests: () => request<BorrowerLoanGroup[]>('/borrower-loan-requests/mine'),
  reviewBorrowerLoanRequest: (groupId: string, payload: unknown) => request<BorrowerLoanGroup>(`/borrower-loan-requests/${groupId}/review`, { method: 'POST', body: JSON.stringify(payload) }),
  deliverBorrowerLoanGroup: (groupId: string, payload: unknown = {}) => request<BorrowerLoanGroup>(`/borrower-loans/${groupId}/deliver`, { method: 'POST', body: JSON.stringify(payload) }),
  returnBorrowerLoanGroup: (groupId: string, payload: unknown) => request<BorrowerLoanGroup>(`/borrower-loans/${groupId}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  approveLoanRequest: (id: string) => request<Loan>(`/loan-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({}) }),
  rejectLoanRequest: (id: string, payload: unknown) => request<Loan>(`/loan-requests/${id}/reject`, { method: 'POST', body: JSON.stringify(payload) }),
  loans: (locationId?: string) => request<Loan[]>(`/loans${buildQuery({ locationId })}`),
  updateLoan: (id: string, payload: unknown) => request<Loan>(`/loans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deliverLoan: (id: string, payload: unknown = {}) => request<Loan>(`/loans/${id}/deliver`, { method: 'POST', body: JSON.stringify(payload) }),
  returnLoan: (id: string, payload: unknown) => request<Loan>(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  users: () => request<UserSummary[]>('/users'),
  createUser: (payload: unknown) => request<UserSummary>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: unknown) => request<UserSummary>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetUserPassword: (id: string, payload: unknown) => request<void>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  settings: () => request<SettingsPayload>('/settings'),
  userManualPdf: () => requestBlob('/manual/user.pdf'),
  audit: (filters: AuditFilters = {}) => request<PageResponse<AuditEntry>>(`/audit${buildQuery({
    entityType: filters.entityType,
    action: filters.action,
    actor: filters.actor,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    page: filters.page ?? 0,
    size: filters.size ?? 10,
  })}`),
  inventoryCsv: (filters: ReportFilters = {}) => requestBlob(`/reports/inventory.csv${buildQuery(filters)}`),
  inventoryAdminCsv: (filters: ReportFilters = {}) => requestBlob(`/reports/inventory-admin.csv${buildQuery(filters)}`),
  loansCsv: (filters: ReportFilters = {}) => requestBlob(`/reports/loans.csv${buildQuery(filters)}`),
  inventoryPdf: (filters: ReportFilters = {}) => requestBlob(`/reports/inventory.pdf${buildQuery(filters)}`),
  inventoryAdminPdf: (filters: ReportFilters = {}) => requestBlob(`/reports/inventory-admin.pdf${buildQuery(filters)}`),
}
