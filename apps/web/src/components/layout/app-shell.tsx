import { Bell, Boxes, ClipboardList, Gauge, HandCoins, Layers3, LogOut, Menu, ReceiptText, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useRealtimeSync } from '../../hooks/use-realtime-sync'
import { useIsMobile } from '../../hooks/use-is-mobile'
import { useI18n } from '../../i18n/use-i18n'
import { canManageBorrowers, canManageCatalogs, canManageUsers, canSeeAudit, canSeeReports } from '../../lib/access'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth-store'
import { Button } from '../ui/button'

type NavigationItem = {
  to: string
  label: string
  icon: typeof Gauge
  visible: boolean
}

export function AppShell() {
  const { t, enumLabel } = useI18n()
  const clearSession = useAuthStore((state) => state.clearSession)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const isCompactNavigation = useIsMobile(1024)
  const [mobileMenuState, setMobileMenuState] = useState({ path: location.pathname, open: false })

  useRealtimeSync()

  const navigation = useMemo<NavigationItem[]>(() => ([
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
  ].filter((entry) => entry.visible)), [t, user?.role])

  const primaryMobileNavigation = navigation.filter((entry) =>
    ['/app/dashboard', '/app/items', '/app/movements', '/app/loans'].includes(entry.to),
  )

  const currentSection = navigation.find((entry) => location.pathname.startsWith(entry.to))?.label ?? t('app.name')
  const mobileMenuOpen = mobileMenuState.path === location.pathname && mobileMenuState.open

  useEffect(() => {
    if (!isCompactNavigation) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : previousOverflow

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isCompactNavigation, mobileMenuOpen])

  const handleLogout = () => {
    clearSession()
    window.location.href = '/login'
  }

  const closeMobileMenu = () => {
    setMobileMenuState({ path: location.pathname, open: false })
  }

  const toggleMobileMenu = () => {
    setMobileMenuState((current) => ({
      path: location.pathname,
      open: current.path === location.pathname ? !current.open : true,
    }))
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_1fr]">
      {!isCompactNavigation && (
        <aside className="border-r border-border bg-slate-950 px-5 py-6 text-white">
          <BrandBlock organizationName={user?.organizationName ?? t('shell.noOrganization')} subtitle={t('shell.subtitle')} />
          <NavigationList navigation={navigation} />
          <UserSummaryCard
            assignedLocationName={user?.assignedLocationName ?? undefined}
            fullName={user?.fullName ?? undefined}
            onLogout={handleLogout}
            roleLabel={enumLabel('role', user?.role)}
            t={t}
          />
        </aside>
      )}

      {isCompactNavigation && (
        <>
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-[0.26em] text-sky-200">{t('app.name')}</p>
                <p className="truncate text-base font-semibold">{currentSection}</p>
                <p className="truncate text-xs text-slate-300">{user?.assignedLocationName ?? t('shell.scopeOrganization')}</p>
              </div>
              <Button
                aria-label={mobileMenuOpen ? t('common.close') : t('common.menu')}
                className="h-11 w-11 shrink-0 rounded-2xl bg-white/10 px-0 text-white hover:bg-white/20"
                onClick={toggleMobileMenu}
                type="button"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </header>

          <div
            aria-hidden={!mobileMenuOpen}
            className={cn(
              'fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden',
              mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
            )}
            onClick={closeMobileMenu}
          />

          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col bg-slate-950 px-5 py-6 text-white shadow-2xl transition-transform duration-200 lg:hidden',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <BrandBlock organizationName={user?.organizationName ?? t('shell.noOrganization')} subtitle={t('shell.subtitle')} />
              <Button
                aria-label={t('common.close')}
                className="h-11 w-11 shrink-0 rounded-2xl bg-white/10 px-0 text-white hover:bg-white/20"
                onClick={closeMobileMenu}
                type="button"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavigationList navigation={navigation} onNavigate={closeMobileMenu} />
            </div>
            <UserSummaryCard
              assignedLocationName={user?.assignedLocationName ?? undefined}
              fullName={user?.fullName ?? undefined}
              onLogout={handleLogout}
              roleLabel={enumLabel('role', user?.role)}
              t={t}
            />
          </aside>
        </>
      )}

      <main className="space-y-4 px-4 pb-24 pt-4 sm:space-y-6 sm:px-5 lg:space-y-6 lg:px-8 lg:py-6 lg:pb-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-panel sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t('shell.contextTitle')}</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user?.organizationName ?? t('shell.noOrganization')}
              </p>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
              <p><span className="font-medium text-slate-900">{t('settings.currentRole')}:</span> {enumLabel('role', user?.role)}</p>
              <p>
                <span className="font-medium text-slate-900">{t('shell.scopeLabel')}:</span>{' '}
                {user?.assignedLocationName ?? t('shell.scopeOrganization')}
              </p>
              <p><span className="font-medium text-slate-900">{t('common.name')}:</span> {user?.fullName}</p>
            </div>
          </div>
        </div>

        <Outlet />
      </main>

      {isCompactNavigation && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="grid grid-cols-4 gap-2">
            {primaryMobileNavigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-500 transition',
                    isActive && 'bg-slate-950 text-white shadow-panel',
                  )
                }
              >
                <Icon className="size-4" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

function BrandBlock({
  subtitle,
  organizationName,
}: {
  subtitle: string
  organizationName: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-sky-200">TuInventario</p>
      <h1 className="text-2xl font-semibold">{subtitle}</h1>
      <p className="text-sm text-slate-300">{organizationName}</p>
    </div>
  )
}

function NavigationList({
  navigation,
  onNavigate,
}: {
  navigation: NavigationItem[]
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-2">
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          onClick={onNavigate}
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
  )
}

function UserSummaryCard({
  fullName,
  roleLabel,
  assignedLocationName,
  onLogout,
  t,
}: {
  fullName?: string
  roleLabel: string
  assignedLocationName?: string
  onLogout: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  return (
    <div className="mt-8 rounded-3xl bg-white/10 p-4 text-sm text-slate-200">
      <p className="font-medium">{fullName}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">{roleLabel}</p>
      {assignedLocationName && (
        <p className="mt-2 text-xs text-sky-100">{assignedLocationName}</p>
      )}
      <Button
        className="mt-4 w-full bg-white text-slate-950 hover:bg-slate-100"
        onClick={onLogout}
      >
        <LogOut className="size-4" />
        {t('nav.logout')}
      </Button>
    </div>
  )
}
