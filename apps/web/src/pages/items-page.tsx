import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

export function ItemsPage() {
  const { t, enumLabel } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const itemsQuery = useQuery({
    queryKey: ['items', query],
    queryFn: () => api.items(query),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('items.title')}
        description={t('items.description')}
        action={<Link to="/app/items/new"><Button>{t('items.new')}</Button></Link>}
      />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            placeholder={t('items.searchPlaceholder')}
            defaultValue={query}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setSearchParams({ query: event.currentTarget.value })
              }
            }}
          />
          <Button onClick={() => setSearchParams({ query: '' })} className="bg-secondary text-secondary-foreground">{t('common.clear')}</Button>
        </div>

        {!itemsQuery.data?.content.length && <Notice>{t('items.empty')}</Notice>}

        <div className="grid gap-4 xl:grid-cols-2">
          {itemsQuery.data?.content.map((item) => (
            <Link key={item.id} to={`/app/items/${item.id}`}>
              <Card className="h-full border-slate-200 transition hover:border-sky-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.sku} - {item.category}</p>
                  </div>
                  <Badge>{enumLabel('itemStatus', item.status)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <p>{t('items.available')}: <strong className="text-slate-950">{item.availableStock}</strong></p>
                  <p>{t('items.reserved')}: <strong className="text-slate-950">{item.reservedStock}</strong></p>
                  <p>{t('items.loaned')}: <strong className="text-slate-950">{item.loanedStock}</strong></p>
                  <p>{t('items.location')}: <strong className="text-slate-950">{item.primaryLocation}</strong></p>
                </div>
                <p className="mt-4 text-xs text-slate-500">{t('items.lastMovement')}: {formatDate(item.lastMovementAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
