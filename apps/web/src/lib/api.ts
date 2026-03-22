import { useAuthStore } from '../store/auth-store'
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken, clearSession } = useAuthStore.getState()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    clearSession()
  }

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(errorPayload?.message ?? 'No fue posible completar la solicitud.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return (await response.text()) as T
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { fullName: string; email: string; password: string; organizationName: string; timezone: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  dashboard: () => request<DashboardSummary>('/dashboard'),
  items: (query = '', page = 0, size = 10) =>
    request<PageResponse<Item>>(`/items?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  item: (id: string) => request<Item>(`/items/${id}`),
  createItem: (payload: unknown) => request<Item>('/items', { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (id: string, payload: unknown) => request<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  categories: () => request<OptionItem[]>('/categories'),
  units: () => request<OptionItem[]>('/units'),
  locations: () => request<OptionItem[]>('/locations'),
  borrowers: () => request<Borrower[]>('/borrowers'),
  createBorrower: (payload: unknown) => request<Borrower>('/borrowers', { method: 'POST', body: JSON.stringify(payload) }),
  createMovement: (payload: unknown) => request<Movement>('/movements', { method: 'POST', body: JSON.stringify(payload) }),
  movements: (page = 0, size = 10) => request<PageResponse<Movement>>(`/movements?page=${page}&size=${size}`),
  loanRequests: () => request<LoanRequestItem[]>('/loan-requests'),
  createLoanRequest: (payload: unknown) => request<LoanRequestItem>('/loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  publicLoanRequest: (payload: unknown) => request<LoanRequestItem>('/public-loan-requests', { method: 'POST', body: JSON.stringify(payload) }),
  approveLoanRequest: (id: string) => request<Loan>(`/loan-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({}) }),
  loans: () => request<Loan[]>('/loans'),
  deliverLoan: (id: string) => request<Loan>(`/loans/${id}/deliver`, { method: 'POST', body: JSON.stringify({}) }),
  returnLoan: (id: string, payload: unknown) => request<Loan>(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  users: () => request<UserSummary[]>('/users'),
  createUser: (payload: unknown) => request<UserSummary>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  settings: () => request<SettingsPayload>('/settings'),
  audit: (page = 0, size = 10) => request<PageResponse<AuditEntry>>(`/audit-log?page=${page}&size=${size}`),
  inventoryCsv: () => request<string>('/reports/inventory.csv'),
  loansCsv: () => request<string>('/reports/loans.csv'),
}
