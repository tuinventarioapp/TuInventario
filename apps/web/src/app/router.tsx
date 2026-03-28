import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '../components/layout/app-shell'
import { canSeeAudit } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import { DashboardPage } from '../pages/dashboard-page'
import { LoginPage } from '../pages/login-page'
import { PlaceholderPage } from '../pages/placeholder-page'
import { RegisterPage } from '../pages/register-page'
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

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/forgot-password',
    element: <PlaceholderPage title="" description="" />,
  },
  {
    path: '/reset-password',
    element: <PlaceholderPage title="" description="" />,
  },
  { path: '/public-loan-request', element: <PublicLoanRequestPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'items', element: <ItemsPage /> },
          { path: 'catalogs', element: <CatalogsPage /> },
          { path: 'items/new', element: <ItemFormPage mode="create" /> },
          { path: 'items/:itemId', element: <ItemDetailPage /> },
          { path: 'items/:itemId/edit', element: <ItemFormPage mode="edit" /> },
          { path: 'movements', element: <MovementsPage /> },
          { path: 'loans', element: <LoansPage /> },
          { path: 'borrowers', element: <BorrowersPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'audit', element: <RequireAuditAccess /> },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
