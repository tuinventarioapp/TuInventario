export type AppRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR' | 'BORROWER'

export function isAdmin(role?: string | null): role is AppRole {
  return role === 'ADMIN'
}

export function isManagerOrAdmin(role?: string | null): role is AppRole {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function canManageCatalogs(role?: string | null) {
  return isManagerOrAdmin(role)
}

export function canManageInventory(role?: string | null) {
  return isManagerOrAdmin(role)
}

export function canManageUsers(role?: string | null) {
  return isAdmin(role)
}

export function canSeeAudit(role?: string | null) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function canSeeReports(role?: string | null) {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'COLLABORATOR'
}

export function canManageBorrowers(role?: string | null) {
  return role === 'ADMIN' || role === 'MANAGER'
}
