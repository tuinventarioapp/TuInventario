import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { MobileDisclosure } from '../components/shared/mobile-disclosure'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useIsMobile } from '../hooks/use-is-mobile'
import { useI18n } from '../i18n/use-i18n'
import { isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'
import { useUiStore } from '../store/ui-store'

export function ReportsPage() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const language = useUiStore((state) => state.language)
  const isPhone = useIsMobile()
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
  const reportFileNames =
    language === 'en'
      ? {
          inventoryAdminCsv: 'inventory-admin.csv',
          inventoryAdminPdf: 'inventory-admin.pdf',
          inventoryCsv: 'inventory-operational.csv',
          inventoryPdf: 'inventory-operational.pdf',
          loansCsv: 'loans.csv',
        }
      : language === 'pt'
        ? {
            inventoryAdminCsv: 'inventario-administrativo.csv',
            inventoryAdminPdf: 'inventario-administrativo.pdf',
            inventoryCsv: 'inventario-operacional.csv',
            inventoryPdf: 'inventario-operacional.pdf',
            loansCsv: 'emprestimos.csv',
          }
        : {
            inventoryAdminCsv: 'inventario-administrativo.csv',
            inventoryAdminPdf: 'inventario-administrativo.pdf',
            inventoryCsv: 'inventario-operativo.csv',
            inventoryPdf: 'inventario-operativo.pdf',
            loansCsv: 'prestamos.csv',
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

      <Card className="space-y-4 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,251,253,1)_100%)]">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{t('reports.title')}</h2>
          <p className="text-sm text-slate-600">{t('reports.periodHelp')}</p>
        </div>

        <MobileDisclosure defaultOpen={false} description={t('reports.periodHelp')} isMobile={isPhone} title={t('items.filtersTitle')}>
          <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">
            <PresetButton label={t('reports.quickToday')} onClick={() => applyPreset('today', setFromDate, setToDate)} />
            <PresetButton label={t('reports.quickLast7')} onClick={() => applyPreset('last7', setFromDate, setToDate)} />
            <PresetButton label={t('reports.quickLast30')} onClick={() => applyPreset('last30', setFromDate, setToDate)} />
            <PresetButton label={t('reports.quickThisMonth')} onClick={() => applyPreset('month', setFromDate, setToDate)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isGlobalAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('items.location')}</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                  <option value="">{t('common.all')}</option>
                  {locationsQuery.data?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
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
              <Button
                className="w-full bg-secondary text-secondary-foreground"
                onClick={() => {
                  setLocationId('')
                  setFromDate('')
                  setToDate('')
                }}
              >
                {t('common.clear')}
              </Button>
            </div>
          </div>
        </MobileDisclosure>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isGlobalAdmin && (
          <>
            <ReportCard
              disabled={loadingKey === 'inventoryAdminCsv'}
              help={t('reports.inventoryAdminHelp')}
              onDownload={() => download('inventoryAdminCsv', reportFileNames.inventoryAdminCsv, () => api.inventoryAdminCsv(reportFilters))}
              title={t('reports.inventoryAdminCsv')}
            />
            <ReportCard
              disabled={loadingKey === 'inventoryAdminPdf'}
              help={t('reports.inventoryAdminHelp')}
              onDownload={() => download('inventoryAdminPdf', reportFileNames.inventoryAdminPdf, () => api.inventoryAdminPdf(reportFilters))}
              title={t('reports.inventoryAdminPdf')}
            />
          </>
        )}
        <ReportCard
          disabled={loadingKey === 'inventoryCsv'}
          help={t('reports.inventoryOperationalHelp')}
          onDownload={() => download('inventoryCsv', reportFileNames.inventoryCsv, () => api.inventoryCsv(reportFilters))}
          title={t('reports.inventoryCsv')}
        />
        <ReportCard
          disabled={loadingKey === 'inventoryPdf'}
          help={t('reports.inventoryOperationalHelp')}
          onDownload={() => download('inventoryPdf', reportFileNames.inventoryPdf, () => api.inventoryPdf(reportFilters))}
          title={t('reports.inventoryPdf')}
        />
        <ReportCard
          disabled={loadingKey === 'loansCsv'}
          help={t('reports.loansHelp')}
          onDownload={() => download('loansCsv', reportFileNames.loansCsv, () => api.loansCsv(reportFilters))}
          title={t('reports.loansCsv')}
        />
      </div>
    </div>
  )
}

function applyPreset(
  preset: 'today' | 'last7' | 'last30' | 'month',
  setFromDate: (value: string) => void,
  setToDate: (value: string) => void,
) {
  const now = new Date()
  const current = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  const format = (value: Date) => value.toISOString().slice(0, 10)

  if (preset === 'today') {
    const day = format(current)
    setFromDate(day)
    setToDate(day)
    return
  }

  if (preset === 'last7') {
    const from = new Date(current)
    from.setDate(from.getDate() - 6)
    setFromDate(format(from))
    setToDate(format(current))
    return
  }

  if (preset === 'last30') {
    const from = new Date(current)
    from.setDate(from.getDate() - 29)
    setFromDate(format(from))
    setToDate(format(current))
    return
  }

  const from = new Date(current.getFullYear(), current.getMonth(), 1)
  setFromDate(format(from))
  setToDate(format(current))
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button className="w-full bg-secondary text-secondary-foreground xl:w-auto" onClick={onClick}>
      {label}
    </Button>
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
    <Card className="space-y-4 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,251,253,1)_100%)]">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Documento</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      <p className="text-sm text-slate-500">{help}</p>
      <Button className="w-full" disabled={disabled} onClick={onDownload}>
        {t('common.download')}
      </Button>
    </Card>
  )
}
