import { Bell, Boxes, ClipboardList, Gauge, HandCoins, Layers3, LogOut, ReceiptText, Settings, ShieldCheck, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useRealtimeSync } from '../../hooks/use-realtime-sync'
import { useI18n } from '../../i18n/use-i18n'
import { canManageBorrowers, canManageCatalogs, canManageUsers, canSeeAudit, canSeeReports } from '../../lib/access'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth-store'
import { Button } from '../ui/button'

export function AppShell() {
  const { t, enumLabel } = useI18n()
  const clearSession = useAuthStore((state) => state.clearSession)
  const user = useAuthStore((state) => state.user)

  useRealtimeSync()

  const navigation = [
    { to: '/app/dashboard', label: t('nav.dashboard'), icon: Gauge, visible: true },
    { to: '/app/items', label: t('nav.inventory'), icon: Boxes, visible: true },
    { to: '/app/catalogs', label: t('nav.catalogs'), icon: Layers3, visible: canManageCatalogs(user?.role) },
    { to: '/app/movements', label: t('nav.movements'), icon: ClipboardList, visible: true },
    { to: '/app/loans', label: t('nav.loans'), icon: HandCoins, visible: true },
    { to: '/app/borrowers', label: t('nav.borrowers'), icon: Users, visible: canManageBorrowers(user?.role) },
    { to: '/app/reports', label: t('nav.reports'), icon: ReceiptText, visible: canSeeReports(user?.role) },
    { to: '/app/users', label: t('nav.users'), icon: ShieldCheck, visible: canManageUsers(user?.role) },
    { to: '/app/audit', label: t('nav.audit'), icon: Bell, visible: canSeeAudit(user?.role) },
    { to: '/app/settings', label: t('nav.settings'), icon: Settings, visible: true },
  ].filter((entry) => entry.visible)

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-border bg-slate-950 px-5 py-6 text-white">
        <div className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200">{t('app.name')}</p>
          <h1 className="text-2xl font-semibold">{t('shell.subtitle')}</h1>
          <p className="text-sm text-slate-300">{user?.organizationName ?? t('shell.noOrganization')}</p>
        </div>

        <nav className="space-y-2">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10',
                  isActive && 'bg-white text-slate-950 shadow-panel',
                )
              }
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-3xl bg-white/10 p-4 text-sm text-slate-200">
          <p className="font-medium">{user?.fullName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">{enumLabel('role', user?.role)}</p>
          <Button
            className="mt-4 w-full bg-white text-slate-950 hover:bg-slate-100"
            onClick={() => {
              clearSession()
              window.location.href = '/login'
            }}
          >
            <LogOut className="mr-2 size-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </aside>

      <main className="space-y-6 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
