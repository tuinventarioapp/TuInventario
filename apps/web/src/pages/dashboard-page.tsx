import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'

export function DashboardPage() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationId, setLocationId] = useState('')
  const effectiveLocationId = isGlobalAdmin ? locationId || undefined : user?.assignedLocationId ?? undefined
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['dashboard', effectiveLocationId], queryFn: () => api.dashboard(effectiveLocationId) })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations, enabled: isGlobalAdmin })

  const metrics = [
    { label: t('dashboard.totalItems'), value: data?.totalItems ?? 0 },
    { label: t('dashboard.activeLoans'), value: data?.activeLoans ?? 0 },
    { label: t('dashboard.overdueLoans'), value: data?.overdueLoans ?? 0 },
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            <Notice variant="info">
              <p className="font-medium">{t('dashboard.emptyTitle')}</p>
              <p className="mt-1">{t('dashboard.emptyDescription')}</p>
            </Notice>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('manual.title')}</h2>
          <p className="text-sm text-slate-600">{t('manual.description')}</p>
          <div className="rounded-2xl border border-border p-4 text-sm text-slate-600">
            <p>{t('dashboard.step1')}</p>
            <p className="mt-2">{t('dashboard.step2')}</p>
            <p className="mt-2">{t('dashboard.step3')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
