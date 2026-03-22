import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { canManageInventory, isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'

const stockFilterOptions = ['LOW_STOCK', 'OUT_OF_STOCK', 'IN_STOCK', 'ON_LOAN', 'RESERVED', 'DAMAGED'] as const

export function ItemsPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [draftQuery, setDraftQuery] = useState(searchParams.get('query') ?? '')

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

  useEffect(() => {
    setDraftQuery(filters.query)
  }, [filters.query])

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
    setDraftQuery('')
    setSearchParams({})
  }

  const canEditInventory = canManageInventory(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const currentPage = itemsQuery.data?.page ?? filters.page
  const totalPages = itemsQuery.data?.totalPages ?? 0

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

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{t('items.filtersTitle')}</h2>
            <p className="text-sm text-slate-500">{t('items.resultSummary', {
              count: itemsQuery.data?.totalElements ?? 0,
            })}</p>
          </div>
          <Button onClick={clearFilters} className="bg-secondary text-secondary-foreground">{t('common.clear')}</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-medium">{t('common.search')}</label>
            <div className="flex gap-2">
              <Input
                value={draftQuery}
                placeholder={t('items.searchPlaceholder')}
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    updateFilters({ query: draftQuery })
                  }
                }}
              />
              <Button onClick={() => updateFilters({ query: draftQuery })}>{t('common.apply')}</Button>
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
        </div>
      </Card>

      {itemsQuery.isError && <Notice variant="error">{itemsQuery.error.message}</Notice>}

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
                <p>{t('items.damaged')}: <strong className="text-slate-950">{item.damagedStock}</strong></p>
                <p>{t('items.location')}: <strong className="text-slate-950">{item.primaryLocation}</strong></p>
                <p>{t('items.detail.total')}: <strong className="text-slate-950">{item.totalStock}</strong></p>
              </div>
              <p className="mt-4 text-xs text-slate-500">{t('items.lastMovement')}: {formatDate(item.lastMovementAt)}</p>
            </Card>
          </Link>
        ))}
      </div>

      {!!itemsQuery.data?.content.length && (
        <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">{t('items.pagination', { page: currentPage + 1, totalPages: Math.max(totalPages, 1) })}</p>
          <div className="flex gap-2">
            <Button
              className="bg-secondary text-secondary-foreground"
              disabled={currentPage <= 0}
              onClick={() => updateFilters({ page: String(Math.max(currentPage - 1, 0)) }, false)}
            >
              {t('common.back')}
            </Button>
            <Button
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
