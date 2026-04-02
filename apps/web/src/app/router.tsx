import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '../components/layout/app-shell'
import { canSeeAudit } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import { DashboardPage } from '../pages/dashboard-page'
import { LoginPage } from '../pages/login-page'
import { RegisterPage } from '../pages/register-page'
import { ForgotPasswordPage } from '../pages/forgot-password-page'
import { ResetPasswordPage } from '../pages/reset-password-page'
import { PublicLoanRequestPage } from '../pages/public-loan-request-page'
import { ItemsPage } from '../pages/items-page'
import { ItemFormPage } from '../pages/item-form-page'
import { ItemDetailPage } from '../pages/item-detail-page'
import { CatalogsPage } from '../pages/catalogs-page'
import { MovementsPage } from '../pages/movements-page'
import { LoansPage } from '../pages/loans-page'
import { BorrowersPage } from '../pages/borrowers-page'
import { ReportsPage } from '../pages/reports-page'
import { UsersPage } from '../pages/users-page'
import { SettingsPage } from '../pages/settings-page'
import { AuditPage } from '../pages/audit-page'
import { isBorrower } from '../lib/access'

function RequireAuth() {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    enabled: Boolean(user),
    retry: false,
  })

  if (!user) return <Navigate to="/login" replace />
  if (meQuery.isError) {
    clearSession()
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function RequireAuditAccess() {
  const user = useAuthStore((state) => state.user)

  if (!canSeeAudit(user?.role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <AuditPage />
}

function AppHome() {
  const user = useAuthStore((state) => state.user)
  return <Navigate to={isBorrower(user?.role) ? '/app/items' : '/app/dashboard'} replace />
}

function DashboardRoute() {
  const user = useAuthStore((state) => state.user)
  if (isBorrower(user?.role)) {
    return <Navigate to="/app/items" replace />
  }
  return <DashboardPage />
}

function RequireNonBorrower({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)

  if (isBorrower(user?.role)) {
    return <Navigate to="/app/items" replace />
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/public-loan-request', element: <PublicLoanRequestPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <AppHome /> },
          { path: 'dashboard', element: <DashboardRoute /> },
          { path: 'items', element: <ItemsPage /> },
          { path: 'catalogs', element: <RequireNonBorrower><CatalogsPage /></RequireNonBorrower> },
          { path: 'items/new', element: <RequireNonBorrower><ItemFormPage mode="create" /></RequireNonBorrower> },
          { path: 'items/:itemId', element: <ItemDetailPage /> },
          { path: 'items/:itemId/edit', element: <RequireNonBorrower><ItemFormPage mode="edit" /></RequireNonBorrower> },
          { path: 'movements', element: <RequireNonBorrower><MovementsPage /></RequireNonBorrower> },
          { path: 'loans', element: <LoansPage /> },
          { path: 'borrowers', element: <RequireNonBorrower><BorrowersPage /></RequireNonBorrower> },
          { path: 'reports', element: <RequireNonBorrower><ReportsPage /></RequireNonBorrower> },
          { path: 'users', element: <RequireNonBorrower><UsersPage /></RequireNonBorrower> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'audit', element: <RequireNonBorrower><RequireAuditAccess /></RequireNonBorrower> },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
