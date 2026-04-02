export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: string
  assignedLocationId?: string | null
  assignedLocationName?: string | null
  organizationId: string
  organizationName: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface RegistrationPendingResponse {
  email: string
  organizationName: string
  expiresAt: string
  canResendAt: string
  message: string
}

export interface ActionMessageResponse {
  message: string
}

export interface OptionItem {
  id: string
  name: string
  extra: string
  details?: string | null
  referenceId?: string | null
}

export interface Borrower {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
}

export interface Item {
  id: string
  name: string
  sku: string
  description?: string | null
  imageUrl?: string | null
  type: string
  status: string
  categoryId: string
  category: string
  unitId: string
  unit: string
  primaryLocationId: string
  primaryLocation: string
  totalStock: number
  availableStock: number
  reservedStock: number
  loanedStock: number
  minimumStock: number
  lastMovementAt?: string | null
}

export interface ItemImportSummary {
  newItems: number
  matches: number
  errors: number
  totalRows: number
  created: number
  updated: number
  omitted: number
}

export interface ItemImportPreviewRow {
  rowNumber: number
  sku: string
  itemName: string
  existingItemName?: string | null
  status: string
  suggestedAction: string
  canUpdate: boolean
  errors: string[]
}

export interface ItemImportPreviewResponse {
  fileName: string
  summary: ItemImportSummary
  rows: ItemImportPreviewRow[]
}

export interface ItemImportResultRow {
  rowNumber: number
  sku: string
  itemName: string
  outcome: string
  messages: string[]
}

export interface ItemImportCommitResponse {
  summary: ItemImportSummary
  rows: ItemImportResultRow[]
}

export interface Movement {
  id: string
  movementType: string
  itemId: string
  itemName: string
  itemSku: string
  unitSymbol: string
  quantity: number
  sourceLocation?: string | null
  targetLocation?: string | null
  reason: string
  notes?: string | null
  performedBy: string
  occurredAt: string
}

export interface LoanRequestItem {
  id: string
  borrowerName: string
  itemName: string
  categoryId: string
  categoryName: string
  unitSymbol: string
  locationId: string
  locationName: string
  quantity: number
  status: string
  requestedAt: string
  dueAt: string
  notes?: string | null
}

export interface Loan {
  id: string
  borrowerName: string
  itemName: string
  categoryId: string
  categoryName: string
  unitSymbol: string
  locationId: string
  locationName: string
  quantity: number
  returnedQuantity: number
  outstandingQuantity: number
  returnCondition?: string | null
  status: string
  requestedAt?: string | null
  approvedAt?: string | null
  dueAt: string
  loanedAt?: string | null
  returnedAt?: string | null
  notes?: string | null
  returnNotes?: string | null
  approvedBy?: string | null
  deliveredBy?: string | null
}

export interface BorrowerLoanGroupItem {
  loanRequestId: string
  loanId?: string | null
  itemId: string
  itemName: string
  categoryName: string
  unitSymbol: string
  requestedQuantity: number
  approvedQuantity: number
  returnedQuantity: number
  outstandingQuantity: number
  status: string
  rejectionReason?: string | null
}

export interface BorrowerLoanGroup {
  id: string
  borrowerName: string
  locationId: string
  locationName: string
  status: string
  requestedAt: string
  approvedAt?: string | null
  dueAt: string
  loanedAt?: string | null
  returnedAt?: string | null
  notes?: string | null
  dueSoon: boolean
  items: BorrowerLoanGroupItem[]
}

export interface LowStockAlert {
  itemId: string
  itemName: string
  sku: string
  categoryName: string
  locationName: string
  unitSymbol: string
  availableStock: number
  minimumStock: number
}

export interface DashboardSummary {
  totalItems: number
  activeLoans: number
  overdueLoans: number
  recentMovements: number
  lowStockAlerts: LowStockAlert[]
  hasOperationalData: boolean
}

export interface UserSummary {
  id: string
  fullName: string
  email: string
  role: string
  status: string
  assignedLocationId?: string | null
  assignedLocationName?: string | null
}

export interface AuditEntry {
  id: string
  entityType: string
  action: string
  payload: string
  actor: string
  createdAt: string
}

export interface SettingsPayload {
  organizationId: string
  organizationName: string
  timezone: string
  role: string
  assignedLocationId?: string | null
  assignedLocationName?: string | null
}
