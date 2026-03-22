import { useState } from 'react'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'

export function ReportsPage() {
  const { t } = useI18n()
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('reports.inventoryCsv')}</h2>
          <Button disabled={loadingKey === 'inventoryCsv'} onClick={() => download('inventoryCsv', 'inventario.csv', api.inventoryCsv)}>
            {t('common.download')}
          </Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('reports.loansCsv')}</h2>
          <Button disabled={loadingKey === 'loansCsv'} onClick={() => download('loansCsv', 'prestamos.csv', api.loansCsv)}>
            {t('common.download')}
          </Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">{t('reports.inventoryPdf')}</h2>
          <Button disabled={loadingKey === 'inventoryPdf'} onClick={() => download('inventoryPdf', 'inventario.pdf', api.inventoryPdf)}>
            {t('common.download')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
