import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { canManageInventory } from '../lib/access'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'

function stockWithUnit(quantity: number, unitSymbol: string) {
  return unitSymbol ? `${quantity} ${unitSymbol}` : String(quantity)
}

export function ItemDetailPage() {
  const { t, enumLabel } = useI18n()
  const { itemId } = useParams()
  const user = useAuthStore((state) => state.user)
  const itemQuery = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => api.item(itemId!),
    enabled: Boolean(itemId),
  })

  if (itemQuery.isError) return <Notice variant="error">{itemQuery.error.message}</Notice>
  if (!itemQuery.data) return <Card>{t('common.loading')}</Card>

  const item = itemQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description={`SKU ${item.sku} - ${item.category}`}
        action={canManageInventory(user?.role) ? <Link to={`/app/items/${item.id}/edit`}><Button>{t('common.edit')}</Button></Link> : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('items.detail.currentStatus')}</p>
              <h2 className="mt-1 text-3xl font-semibold">{enumLabel('itemStatus', item.status)}</h2>
            </div>
            <Badge>{enumLabel('itemType', item.type)}</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <p>{t('items.available')}: <strong>{stockWithUnit(item.availableStock, item.unit)}</strong></p>
            <p>{t('items.reserved')}: <strong>{stockWithUnit(item.reservedStock, item.unit)}</strong></p>
            <p>{t('items.loaned')}: <strong>{stockWithUnit(item.loanedStock, item.unit)}</strong></p>
            <p>{t('items.detail.total')}: <strong>{stockWithUnit(item.totalStock, item.unit)}</strong></p>
            <p>{t('items.minimumStock')}: <strong>{stockWithUnit(item.minimumStock, item.unit)}</strong></p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">{t('items.detail.summary')}</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div><dt className="font-medium text-slate-900">{t('items.location')}</dt><dd>{item.primaryLocation}</dd></div>
            <div><dt className="font-medium text-slate-900">{t('items.detail.unit')}</dt><dd>{item.unit}</dd></div>
            <div><dt className="font-medium text-slate-900">{t('items.lastMovement')}</dt><dd>{formatDate(item.lastMovementAt)}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  )
}
