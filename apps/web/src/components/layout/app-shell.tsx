import { Bell, Boxes, ClipboardList, Gauge, HandCoins, Layers3, LogOut, Menu, ReceiptText, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useRealtimeSync } from '../../hooks/use-realtime-sync'
import { useIsMobile } from '../../hooks/use-is-mobile'
import { useI18n } from '../../i18n/use-i18n'
import { canManageBorrowers, canManageCatalogs, canManageUsers, canSeeAudit, canSeeReports } from '../../lib/access'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth-store'
import { BrandLogo } from '../branding/brand-logo'
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

  const navigation = useMemo<NavigationItem[]>(
    () =>
      [
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
      ].filter((entry) => entry.visible),
    [t, user?.role],
  )

  const primaryMobileNavigation = navigation.filter((entry) =>
    ['/app/dashboard', '/app/items', '/app/movements', '/app/loans'].includes(entry.to),
  )

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_left_bottom,rgba(219,241,247,0.65),transparent_26%),linear-gradient(180deg,#f7fafc_0%,#edf2f6_100%)] lg:grid lg:grid-cols-[236px_1fr] xl:grid-cols-[248px_1fr]">
      {!isCompactNavigation && (
        <aside className="border-r border-slate-900/80 bg-slate-950 px-4 py-5 text-white xl:px-5">
          <div className="mb-7">
            <BrandBlock subtitle={t('shell.subtitle')} />
          </div>
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
          <header className="sticky top-0 z-40 bg-transparent px-4 pb-2 pt-4 text-white">
            <div className="rounded-[26px] border border-slate-900/75 bg-slate-950 px-4 py-3.5 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <BrandBlock compact subtitle={t('shell.subtitle')} />
                <Button
                  aria-label={mobileMenuOpen ? t('common.close') : t('common.menu')}
                  className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/10 px-0 text-white shadow-none hover:bg-white/20"
                  onClick={toggleMobileMenu}
                  type="button"
                >
                  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
              </div>
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
              <BrandBlock compact subtitle={t('shell.subtitle')} />
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

      <main className="space-y-4 px-4 pb-28 pt-1 sm:space-y-6 sm:px-5 sm:pt-3 lg:space-y-4 lg:px-6 lg:py-4 lg:pb-6">
        {!isCompactNavigation && (
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-panel sm:px-5 lg:px-4 lg:py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2 lg:space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2]">
                    <BrandLogo className="h-4.5 w-4.5" variant="mark" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{t('shell.contextSummary')}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-x-4 gap-y-1 text-[12px] text-slate-600 sm:grid-cols-2 lg:max-w-[470px] lg:grid-cols-[repeat(3,max-content)] lg:justify-end">
                <p className="leading-5">
                  <span className="font-semibold text-slate-900">{t('settings.currentRole')}:</span> {enumLabel('role', user?.role)}
                </p>
                <p className="leading-5">
                  <span className="font-semibold text-slate-900">{t('shell.scopeLabel')}:</span>{' '}
                  {user?.assignedLocationName ?? t('shell.scopeOrganization')}
                </p>
                <p className="leading-5">
                  <span className="font-semibold text-slate-900">{t('common.name')}:</span> {user?.fullName}
                </p>
              </div>
            </div>
          </div>
        )}

        <Outlet />
      </main>

      {isCompactNavigation && (
        <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 pt-2 lg:hidden">
          <div className="grid grid-cols-4 gap-2 rounded-[26px] border border-slate-900/80 bg-slate-950 px-3 py-2.5 shadow-[0_-10px_26px_rgba(2,6,23,0.22)]">
            {primaryMobileNavigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-medium text-slate-300 transition',
                    isActive && 'bg-white text-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.16)]',
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
  compact = false,
}: {
  subtitle: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex items-start gap-3', compact && 'gap-2.5')}>
      <BrandLogo className={cn('mt-0.5 h-10 w-10 shrink-0 select-none', compact && 'h-9 w-9')} variant="markLight" />
      <div className={cn('min-w-0', compact ? 'max-w-[180px]' : 'max-w-[154px] xl:max-w-[160px]')}>
        <p className={cn('text-[0.98rem] font-semibold leading-none text-white', compact && 'text-[0.95rem]')}>TuInventario</p>
        <p className={cn('mt-2 text-[13px] leading-5 text-slate-300', compact && 'mt-1.5 text-[12px]')}>{subtitle}</p>
      </div>
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
    <nav className="mt-7 space-y-2">
      {navigation.map(({ to, label }) => (
        <NavLink
          key={to}
          onClick={onNavigate}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-[18px] border border-transparent px-3 py-3 text-[13px] text-slate-200 transition hover:bg-white/5',
              isActive && 'bg-white text-slate-950 shadow-panel',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn('size-2 rounded-full bg-slate-500/80', isActive && 'bg-sky-500')} />
              <span>{label}</span>
            </>
          )}
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
    <div className="mt-8 rounded-[22px] border border-white/8 bg-white/10 p-4 text-sm text-slate-200">
      <p className="font-medium text-white">{fullName}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">{roleLabel}</p>
      {assignedLocationName && <p className="mt-2 text-xs text-sky-100">{assignedLocationName}</p>}
      <Button className="mt-4 h-11 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-100" onClick={onLogout}>
        <LogOut className="size-4" />
        {t('nav.logout')}
      </Button>
    </div>
  )
}
