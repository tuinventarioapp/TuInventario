import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
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
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations, enabled: isGlobalAdmin })
  const effectiveLocationId = isGlobalAdmin ? locationId || undefined : user?.assignedLocationId ?? undefined

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
      {isGlobalAdmin && (
        <Card className="space-y-3">
          <label className="text-sm font-medium">{t('items.location')}</label>
          <select className="h-11 w-full rounded-xl border border-border bg-white px-3 md:max-w-sm" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
            <option value="">{t('common.all')}</option>
            {locationsQuery.data?.map((location: { id: string; name: string }) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {isGlobalAdmin && (
          <>
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold">{t('reports.inventoryAdminCsv')}</h2>
              <p className="text-sm text-slate-500">{t('reports.inventoryAdminHelp')}</p>
              <Button disabled={loadingKey === 'inventoryAdminCsv'} onClick={() => download('inventoryAdminCsv', 'inventario-administrativo.csv', () => api.inventoryAdminCsv(effectiveLocationId))}>
                {t('common.download')}
              </Button>
            </Card>
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold">{t('reports.inventoryAdminPdf')}</h2>
              <p className="text-sm text-slate-500">{t('reports.inventoryAdminHelp')}</p>
              <Button disabled={loadingKey === 'inventoryAdminPdf'} onClick={() => download('inventoryAdminPdf', 'inventario-administrativo.pdf', () => api.inventoryAdminPdf(effectiveLocationId))}>
                {t('common.download')}
              </Button>
            </Card>
          </>
        )}
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('reports.inventoryCsv')}</h2>
          <p className="text-sm text-slate-500">{t('reports.inventoryOperationalHelp')}</p>
          <Button disabled={loadingKey === 'inventoryCsv'} onClick={() => download('inventoryCsv', 'inventario.csv', () => api.inventoryCsv(effectiveLocationId))}>
            {t('common.download')}
          </Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('reports.inventoryPdf')}</h2>
          <p className="text-sm text-slate-500">{t('reports.inventoryOperationalHelp')}</p>
          <Button disabled={loadingKey === 'inventoryPdf'} onClick={() => download('inventoryPdf', 'inventario.pdf', () => api.inventoryPdf(effectiveLocationId))}>
            {t('common.download')}
          </Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('reports.loansCsv')}</h2>
          <p className="text-sm text-slate-500">{t('reports.loansHelp')}</p>
          <Button disabled={loadingKey === 'loansCsv'} onClick={() => download('loansCsv', 'prestamos.csv', () => api.loansCsv(effectiveLocationId))}>
            {t('common.download')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
