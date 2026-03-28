import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { MobileDisclosure } from '../components/shared/mobile-disclosure'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useIsMobile } from '../hooks/use-is-mobile'
import { useI18n } from '../i18n/use-i18n'
import { canManageInventory, isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'

const stockFilterOptions = ['LOW_STOCK', 'OUT_OF_STOCK', 'IN_STOCK', 'ON_LOAN', 'RESERVED', 'DAMAGED'] as const

function stockWithUnit(quantity: number, unitSymbol: string) {
  return unitSymbol ? `${quantity} ${unitSymbol}` : String(quantity)
}

function isAtMinimumStock(availableStock: number, minimumStock: number) {
  return minimumStock > 0 && availableStock <= minimumStock
}

export function ItemsPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isPhone = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [draftQueryState, setDraftQueryState] = useState(() => ({
    source: searchParams.get('query') ?? '',
    value: searchParams.get('query') ?? '',
  }))
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortBy, setSortBy] = useState<'name' | 'available' | 'minimumStock' | 'lastMovement'>('name')

  const filters = useMemo(() => ({
    query: searchParams.get('query') ?? '',
    categoryId: searchParams.get('categoryId') ?? '',
    status: searchParams.get('status') ?? '',
    type: searchParams.get('type') ?? '',
    locationId: searchParams.get('locationId') ?? '',
    stockFilter: searchParams.get('stockFilter') ?? '',
    minAvailableStock: searchParams.get('minAvailableStock') ?? '',
    maxAvailableStock: searchParams.get('maxAvailableStock') ?? '',
    page: Number(searchParams.get('page') ?? '0'),
    size: 12,
  }), [searchParams])
  const draftQuery = draftQueryState.source === filters.query ? draftQueryState.value : filters.query

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const itemsQuery = useQuery({
    queryKey: ['items', filters],
    queryFn: () => api.items({
      ...filters,
      categoryId: filters.categoryId || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
      locationId: filters.locationId || undefined,
      stockFilter: filters.stockFilter || undefined,
      minAvailableStock: filters.minAvailableStock || undefined,
      maxAvailableStock: filters.maxAvailableStock || undefined,
    }),
  })

  const updateFilters = (updates: Record<string, string>, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) nextParams.delete(key)
      else nextParams.set(key, value)
    })
    if (resetPage) nextParams.set('page', '0')
    setSearchParams(nextParams)
  }

  const clearFilters = () => {
    setDraftQueryState({ source: '', value: '' })
    setSearchParams({})
  }

  const canEditInventory = canManageInventory(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const currentPage = itemsQuery.data?.page ?? filters.page
  const totalPages = itemsQuery.data?.totalPages ?? 0
  const sortedItems = useMemo(() => {
    const content = [...(itemsQuery.data?.content ?? [])]
    return content.sort((left, right) => {
      if (sortBy === 'available') return right.availableStock - left.availableStock
      if (sortBy === 'minimumStock') return right.minimumStock - left.minimumStock
      if (sortBy === 'lastMovement') return new Date(right.lastMovementAt ?? 0).getTime() - new Date(left.lastMovementAt ?? 0).getTime()
      return left.name.localeCompare(right.name)
    })
  }, [itemsQuery.data?.content, sortBy])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('items.title')}
        description={t('items.description')}
        action={canEditInventory ? <Link to="/app/items/new"><Button>{t('items.new')}</Button></Link> : undefined}
      />

      {!isGlobalAdmin && user?.assignedLocationName && (
        <Notice>{t('items.scopeNotice', { location: user.assignedLocationName })}</Notice>
      )}

      <Card>
        <MobileDisclosure
          actions={(
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <Button className={viewMode === 'cards' ? 'w-full sm:w-auto' : 'w-full bg-secondary text-secondary-foreground sm:w-auto'} onClick={() => setViewMode('cards')}>{t('items.viewCards')}</Button>
              <Button className={viewMode === 'table' ? 'w-full sm:w-auto' : 'w-full bg-secondary text-secondary-foreground sm:w-auto'} onClick={() => setViewMode('table')}>{t('items.viewTable')}</Button>
              <Button className="col-span-2 w-full bg-secondary text-secondary-foreground sm:col-auto sm:w-auto" onClick={clearFilters}>{t('common.clear')}</Button>
            </div>
          )}
          defaultOpen={false}
          description={t('items.resultSummary', { count: itemsQuery.data?.totalElements ?? 0 })}
          isMobile={isPhone}
          title={t('items.filtersTitle')}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-medium">{t('common.search')}</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={draftQuery}
                placeholder={t('items.searchPlaceholder')}
                onChange={(event) => setDraftQueryState({ source: filters.query, value: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    updateFilters({ query: draftQuery })
                  }
                }}
              />
              <Button className="w-full sm:w-auto" onClick={() => updateFilters({ query: draftQuery })}>{t('common.apply')}</Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.category')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={filters.categoryId} onChange={(event) => updateFilters({ categoryId: event.target.value })}>
              <option value="">{t('common.all')}</option>
              {categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>

          {isGlobalAdmin ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('items.location')}</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={filters.locationId} onChange={(event) => updateFilters({ locationId: event.target.value })}>
                <option value="">{t('common.all')}</option>
                {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('items.location')}</label>
              <Input disabled value={user?.assignedLocationName ?? t('common.notAvailable')} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value })}>
              <option value="">{t('common.all')}</option>
              {['AVAILABLE', 'RESERVED', 'ON_LOAN', 'MAINTENANCE', 'DAMAGED', 'LOST', 'ARCHIVED'].map((status) => (
                <option key={status} value={status}>{enumLabel('itemStatus', status)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.type')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={filters.type} onChange={(event) => updateFilters({ type: event.target.value })}>
              <option value="">{t('common.all')}</option>
              {['CONSUMABLE', 'LENDABLE', 'HYBRID'].map((type) => (
                <option key={type} value={type}>{enumLabel('itemType', type)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.stockFocus')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={filters.stockFilter} onChange={(event) => updateFilters({ stockFilter: event.target.value })}>
              <option value="">{t('common.all')}</option>
              {stockFilterOptions.map((option) => (
                <option key={option} value={option}>{t(`items.stockFilter.${option}`)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.minAvailable')}</label>
            <Input type="number" min="0" step="1" value={filters.minAvailableStock} onChange={(event) => updateFilters({ minAvailableStock: event.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.maxAvailable')}</label>
            <Input type="number" min="0" step="1" value={filters.maxAvailableStock} onChange={(event) => updateFilters({ maxAvailableStock: event.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.sortBy')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="name">{t('items.sort.name')}</option>
              <option value="available">{t('items.sort.available')}</option>
              <option value="minimumStock">{t('items.sort.minimumStock')}</option>
              <option value="lastMovement">{t('items.sort.lastMovement')}</option>
            </select>
          </div>
          </div>
        </MobileDisclosure>
      </Card>

      {itemsQuery.isError && <Notice variant="error">{itemsQuery.error.message}</Notice>}

      {!itemsQuery.data?.content.length && <Notice>{t('items.empty')}</Notice>}

      {viewMode === 'cards' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {sortedItems.map((item) => (
            <Link key={item.id} to={`/app/items/${item.id}`}>
              <Card className="h-full border-slate-200 transition hover:border-sky-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                      {isAtMinimumStock(item.availableStock, item.minimumStock) && (
                        <Badge className="bg-amber-100 text-amber-900">{t('items.minimumStockAlert')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{item.sku} - {item.category}</p>
                  </div>
                  <Badge>{enumLabel('itemStatus', item.status)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>{t('items.available')}: <strong className="text-slate-950">{stockWithUnit(item.availableStock, item.unit)}</strong></p>
                  <p>{t('items.reserved')}: <strong className="text-slate-950">{stockWithUnit(item.reservedStock, item.unit)}</strong></p>
                  <p>{t('items.loaned')}: <strong className="text-slate-950">{stockWithUnit(item.loanedStock, item.unit)}</strong></p>
                  <p>{t('items.damaged')}: <strong className="text-slate-950">{stockWithUnit(item.damagedStock, item.unit)}</strong></p>
                  <p>{t('items.location')}: <strong className="text-slate-950">{item.primaryLocation}</strong></p>
                  <p>{t('items.detail.total')}: <strong className="text-slate-950">{stockWithUnit(item.totalStock, item.unit)}</strong></p>
                  <p>{t('items.minimumStock')}: <strong className="text-slate-950">{stockWithUnit(item.minimumStock, item.unit)}</strong></p>
                </div>
                <p className="mt-4 text-xs text-slate-500">{t('items.lastMovement')}: {formatDate(item.lastMovementAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-[720px] divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t('common.name')}</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">{t('items.category')}</th>
                <th className="px-4 py-3">{t('items.location')}</th>
                <th className="px-4 py-3">{t('items.available')}</th>
                <th className="px-4 py-3">{t('items.minimumStock')}</th>
                <th className="px-4 py-3">{t('common.status')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
              {sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-slate-950 hover:text-sky-700" to={`/app/items/${item.id}`}>{item.name}</Link>
                  </td>
                  <td className="px-4 py-3">{item.sku}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.primaryLocation}</td>
                  <td className="px-4 py-3">{stockWithUnit(item.availableStock, item.unit)}</td>
                  <td className="px-4 py-3">{stockWithUnit(item.minimumStock, item.unit)}</td>
                  <td className="px-4 py-3">{enumLabel('itemStatus', item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="text-sky-700 hover:text-sky-900" to={`/app/items/${item.id}`}>{t('common.view')}</Link>
                      <Link className="text-slate-600 hover:text-slate-900" to="/app/movements">{t('items.quickMovement')}</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!!itemsQuery.data?.content.length && (
        <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">{t('items.pagination', { page: currentPage + 1, totalPages: Math.max(totalPages, 1) })}</p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              className="w-full bg-secondary text-secondary-foreground sm:w-auto"
              disabled={currentPage <= 0}
              onClick={() => updateFilters({ page: String(Math.max(currentPage - 1, 0)) }, false)}
            >
              {t('common.back')}
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={currentPage + 1 >= totalPages}
              onClick={() => updateFilters({ page: String(currentPage + 1) }, false)}
            >
              {t('common.next')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
