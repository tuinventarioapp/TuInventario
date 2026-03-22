import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'

export function ReportsPage() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isGlobalAdmin = isAdmin(user?.role)
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [locationId, setLocationId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations, enabled: isGlobalAdmin })
  const reportFilters = {
    locationId: isGlobalAdmin ? locationId || undefined : user?.assignedLocationId ?? undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  }

  const download = async (key: string, filename: string, action: () => Promise<Blob>) => {
    try {
      setStatus(null)
      setLoadingKey(key)
      const blob = await action()
      downloadBlob(blob, filename)
      setStatus({ kind: 'success', message: t('reports.success') })
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : t('common.error') })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} description={t('reports.description')} />

      {status && <Notice variant={status.kind}>{status.message}</Notice>}
      {!isGlobalAdmin && user?.assignedLocationName && <Notice>{t('reports.scopeNotice', { location: user.assignedLocationName })}</Notice>}

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isGlobalAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('items.location')}</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                <option value="">{t('common.all')}</option>
                {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('reports.fromDate')}</label>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('reports.toDate')}</label>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-secondary text-secondary-foreground" onClick={() => {
              setLocationId('')
              setFromDate('')
              setToDate('')
            }}>
              {t('common.clear')}
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-500">{t('reports.periodHelp')}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isGlobalAdmin && (
          <>
            <ReportCard
              title={t('reports.inventoryAdminCsv')}
              help={t('reports.inventoryAdminHelp')}
              disabled={loadingKey === 'inventoryAdminCsv'}
              onDownload={() => download('inventoryAdminCsv', 'inventario-administrativo.csv', () => api.inventoryAdminCsv(reportFilters))}
            />
            <ReportCard
              title={t('reports.inventoryAdminPdf')}
              help={t('reports.inventoryAdminHelp')}
              disabled={loadingKey === 'inventoryAdminPdf'}
              onDownload={() => download('inventoryAdminPdf', 'inventario-administrativo.pdf', () => api.inventoryAdminPdf(reportFilters))}
            />
          </>
        )}
        <ReportCard
          title={t('reports.inventoryCsv')}
          help={t('reports.inventoryOperationalHelp')}
          disabled={loadingKey === 'inventoryCsv'}
          onDownload={() => download('inventoryCsv', 'inventario.csv', () => api.inventoryCsv(reportFilters))}
        />
        <ReportCard
          title={t('reports.inventoryPdf')}
          help={t('reports.inventoryOperationalHelp')}
          disabled={loadingKey === 'inventoryPdf'}
          onDownload={() => download('inventoryPdf', 'inventario.pdf', () => api.inventoryPdf(reportFilters))}
        />
        <ReportCard
          title={t('reports.loansCsv')}
          help={t('reports.loansHelp')}
          disabled={loadingKey === 'loansCsv'}
          onDownload={() => download('loansCsv', 'prestamos.csv', () => api.loansCsv(reportFilters))}
        />
      </div>
    </div>
  )
}

function ReportCard({
  title,
  help,
  disabled,
  onDownload,
}: {
  title: string
  help: string
  disabled: boolean
  onDownload: () => void
}) {
  const { t } = useI18n()

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-slate-500">{help}</p>
      <Button disabled={disabled} onClick={onDownload}>
        {t('common.download')}
      </Button>
    </Card>
  )
}
