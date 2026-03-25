import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'

function stockWithUnit(quantity: number, unitSymbol: string) {
  return unitSymbol ? `${quantity} ${unitSymbol}` : String(quantity)
}

export function DashboardPage() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationId, setLocationId] = useState('')
  const effectiveLocationId = isGlobalAdmin ? locationId || undefined : user?.assignedLocationId ?? undefined
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['dashboard', effectiveLocationId], queryFn: () => api.dashboard(effectiveLocationId) })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations, enabled: isGlobalAdmin })
  const showEmptyState = Boolean(data && !data.hasOperationalData)

  const metrics = [
    { label: t('dashboard.totalItems'), value: data?.totalItems ?? 0 },
    { label: t('dashboard.activeLoans'), value: data?.activeLoans ?? 0 },
    { label: t('dashboard.overdueLoans'), value: data?.overdueLoans ?? 0 },
    { label: t('dashboard.minimumStockAlerts'), value: data?.lowStockAlerts.length ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {isError && <Notice variant="error">{error.message || t('dashboard.error')}</Notice>}
      {!isGlobalAdmin && user?.assignedLocationName && <Notice>{t('dashboard.scopeNotice', { location: user.assignedLocationName })}</Notice>}
      {isGlobalAdmin && (
        <Card className="space-y-3">
          <label className="text-sm font-medium">{t('items.location')}</label>
          <select className="h-11 w-full rounded-xl border border-border bg-white px-3 md:max-w-sm" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
            <option value="">{t('common.all')}</option>
            {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{isLoading ? '...' : metric.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('dashboard.statusTitle')}</h2>
              <p className="text-sm text-slate-600">{t('dashboard.statusDescription')}</p>
            </div>
            <Badge>{t('dashboard.realtime')}</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-slate-500">{t('dashboard.recentMovements')}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{data?.recentMovements ?? 0}</p>
            </div>
            {data?.lowStockAlerts.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-950">{t('dashboard.minimumStockTitle')}</p>
                <p className="mt-1 text-sm text-amber-800">{t('dashboard.minimumStockDescription')}</p>
                <div className="mt-4 space-y-3">
                  {data.lowStockAlerts.map((alert) => (
                    <div key={alert.itemId} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-950">{alert.itemName}</p>
                        <Badge className="bg-amber-100 text-amber-900">{t('dashboard.minimumStockBadge')}</Badge>
                      </div>
                      <p className="mt-1 text-slate-500">{alert.locationName} - {alert.categoryName}</p>
                      <p className="mt-2">
                        {t('items.available')}: <strong className="text-slate-950">{stockWithUnit(alert.availableStock, alert.unitSymbol)}</strong>
                      </p>
                      <p>
                        {t('items.minimumStock')}: <strong className="text-slate-950">{stockWithUnit(alert.minimumStock, alert.unitSymbol)}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : showEmptyState ? (
              <Notice variant="info">
                <p className="font-medium">{t('dashboard.emptyTitle')}</p>
                <p className="mt-1">{t('dashboard.emptyDescription')}</p>
              </Notice>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-950">{t('dashboard.healthyTitle')}</p>
                <p className="mt-1 text-sm text-slate-600">{t('dashboard.healthyDescription')}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dashboard.quickActionsTitle')}</h2>
          <p className="text-sm text-slate-600">{t('dashboard.quickActionsDescription')}</p>
          <div className="space-y-3">
            <DashboardAction to="/app/items?stockFilter=LOW_STOCK" title={t('dashboard.actionLowStock')} description={t('dashboard.actionLowStockHelp')} />
            <DashboardAction to="/app/movements" title={t('dashboard.actionMovements')} description={t('dashboard.actionMovementsHelp')} />
            <DashboardAction to="/app/loans" title={t('dashboard.actionLoans')} description={t('dashboard.actionLoansHelp')} />
            <DashboardAction href="/manual/manual-de-uso.pdf" targetBlank title={t('manual.title')} description={t('manual.description')} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function DashboardAction({
  to,
  href,
  download,
  targetBlank,
  title,
  description,
}: {
  to?: string
  href?: string
  download?: string
  targetBlank?: boolean
  title: string
  description: string
}) {
  if (href) {
    return (
      <a
        className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-white"
        href={href}
        download={download}
        rel={targetBlank ? 'noreferrer' : undefined}
        target={targetBlank ? '_blank' : undefined}
      >
        <p className="font-medium text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </a>
    )
  }

  return (
    <Link className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-white" to={to ?? '/'}>
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  )
}
