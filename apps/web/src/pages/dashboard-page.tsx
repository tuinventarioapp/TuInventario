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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', effectiveLocationId],
    queryFn: () => api.dashboard(effectiveLocationId),
  })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations, enabled: isGlobalAdmin })
  const showEmptyState = Boolean(data && !data.hasOperationalData)

  const metrics = [
    { label: t('dashboard.totalItems'), value: data?.totalItems ?? 0 },
    { label: t('dashboard.activeLoans'), value: data?.activeLoans ?? 0 },
    { label: t('dashboard.overdueLoans'), value: data?.overdueLoans ?? 0 },
    { label: t('dashboard.minimumStockAlerts'), value: data?.lowStockAlerts.length ?? 0 },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {isError && <Notice variant="error">{error.message || t('dashboard.error')}</Notice>}
      {!isGlobalAdmin && user?.assignedLocationName && <Notice>{t('dashboard.scopeNotice', { location: user.assignedLocationName })}</Notice>}
      <Card className="p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-slate-950">{t('items.location')}</p>
          {isGlobalAdmin ? (
            <select
              className="h-12 w-full rounded-[18px] border border-border bg-white px-4 text-sm md:max-w-none"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="">{t('common.all')}</option>
              {locationsQuery.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex min-h-[3rem] items-center rounded-[18px] border border-border bg-white px-4 text-sm text-slate-700">
              {user?.assignedLocationName ?? t('common.all')}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className={index === 0 ? 'min-h-[116px] border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(244,250,252,1)_100%)] p-4 sm:p-5' : 'min-h-[116px] p-4 sm:p-5'}
          >
            <p className="max-w-[10ch] text-[13px] leading-6 text-slate-500">{metric.label}</p>
            <p className="mt-5 text-[2.55rem] font-semibold leading-none text-slate-950">{isLoading ? '...' : metric.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.95fr_1fr]">
        <Card className="overflow-hidden p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[1.15rem] font-semibold leading-none text-slate-950">{t('dashboard.statusTitle')}</h2>
              <p className="mt-2 max-w-[26ch] text-[13px] leading-6 text-slate-600">{t('dashboard.statusDescription')}</p>
            </div>
            <Badge>{t('dashboard.realtime')}</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="min-h-[148px] rounded-[18px] border border-border bg-slate-50 p-4">
              <p className="text-[13px] text-slate-500">{t('dashboard.recentMovements')}</p>
              <p className="mt-4 text-[2.5rem] font-semibold leading-none text-slate-950">{data?.recentMovements ?? 0}</p>
            </div>
            {data?.lowStockAlerts.length ? (
              <div className="min-h-[148px] rounded-[18px] border border-amber-200 bg-amber-50 p-4">
                <p className="text-[13px] font-medium text-amber-950">{t('dashboard.minimumStockTitle')}</p>
                <p className="mt-1 text-[13px] leading-6 text-amber-800">{t('dashboard.minimumStockDescription')}</p>
                <div className="mt-4 space-y-3">
                  {data.lowStockAlerts.map((alert) => (
                    <div key={alert.itemId} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-950">{alert.itemName}</p>
                        <Badge className="bg-amber-100 text-amber-900">{t('dashboard.minimumStockBadge')}</Badge>
                      </div>
                      <p className="mt-1 text-slate-500">
                        {alert.locationName} - {alert.categoryName}
                      </p>
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
              <div className="min-h-[148px] rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[13px] font-medium text-slate-950">{t('dashboard.healthyTitle')}</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{t('dashboard.healthyDescription')}</p>
              </div>
            )}
          </div>
          <div className="min-h-[210px]" />
        </Card>

        <Card className="space-y-4 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,251,253,1)_100%)] p-4 sm:p-5">
          <div>
            <h2 className="text-[1.15rem] font-semibold leading-none text-slate-950">{t('dashboard.quickActionsTitle')}</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">{t('dashboard.quickActionsDescription')}</p>
          </div>
          <div className="space-y-3">
            <DashboardAction description={t('dashboard.actionLowStockHelp')} title={t('dashboard.actionLowStock')} to="/app/items?stockFilter=LOW_STOCK" />
            <DashboardAction description={t('dashboard.actionMovementsHelp')} title={t('dashboard.actionMovements')} to="/app/movements" />
            <DashboardAction description={t('dashboard.actionLoansHelp')} title={t('dashboard.actionLoans')} to="/app/loans" />
          </div>
          <Link className="inline-flex text-[13px] font-medium text-sky-700 hover:text-sky-800" to="/manual/manual-de-uso.pdf" target="_blank" rel="noreferrer">
            {t('manual.title')}
          </Link>
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
  const classes = 'block rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:bg-sky-50/40'

  if (href) {
    return (
      <a
        className={classes}
        download={download}
        href={href}
        rel={targetBlank ? 'noreferrer' : undefined}
        target={targetBlank ? '_blank' : undefined}
      >
        <p className="font-medium text-slate-950">{title}</p>
        <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
      </a>
    )
  }

  return (
    <Link className={classes} to={to ?? '/'}>
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
    </Link>
  )
}
