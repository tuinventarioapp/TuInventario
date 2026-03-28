import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { MobileDisclosure } from '../components/shared/mobile-disclosure'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useIsMobile } from '../hooks/use-is-mobile'
import { useI18n } from '../i18n/use-i18n'
import { canManageInventory, isAdmin } from '../lib/access'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'

type FormValues = {
  movementType: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'TRANSFER'
  itemId: string
  quantity: number
  targetLocationId?: string
  reason: string
  notes?: string
}

type MovementFilters = {
  query: string
  movementType: string
  minQuantity: string
  maxQuantity: string
  fromDate: string
  toDate: string
}

const initialFilters: MovementFilters = {
  query: '',
  movementType: '',
  minQuantity: '',
  maxQuantity: '',
  fromDate: '',
  toDate: '',
}

function quantityWithUnit(quantity: number, unitSymbol: string) {
  return unitSymbol ? `${quantity} ${unitSymbol}` : String(quantity)
}

function isoDateFromToday(daysBack: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  today.setDate(today.getDate() - daysBack)
  return today.toISOString().slice(0, 10)
}

export function MovementsPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isPhone = useIsMobile()
  const canEditInventory = canManageInventory(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationFilterId, setLocationFilterId] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [draftFilters, setDraftFilters] = useState<MovementFilters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<MovementFilters>(initialFilters)
  const [page, setPage] = useState(0)
  const schema = useMemo(() => z.object({
    movementType: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER']),
    itemId: z.string().min(1, t('validation.required')),
    quantity: z.coerce.number().positive(t('validation.quantity')),
    targetLocationId: z.string().optional(),
    reason: z.string().min(3, t('validation.name')),
    notes: z.string().optional(),
  }).superRefine((values, ctx) => {
    if (values.movementType === 'TRANSFER' && !values.targetLocationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetLocationId'],
        message: t('movements.targetRequired'),
      })
    }
  }), [t])

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { movementType: 'ENTRY' },
  })

  const movementType = watch('movementType')
  const effectiveLocationFilter = isGlobalAdmin ? locationFilterId || undefined : user?.assignedLocationId ?? undefined

  const itemsQuery = useQuery({
    queryKey: ['items', 'movement-form', effectiveLocationFilter, itemSearch],
    queryFn: () => api.items({ query: itemSearch, page: 0, size: 50, locationId: effectiveLocationFilter }),
    enabled: canEditInventory,
  })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const movementsQuery = useQuery({
    queryKey: ['movements', effectiveLocationFilter, appliedFilters, page],
    queryFn: () => api.movements({
      ...appliedFilters,
      locationId: effectiveLocationFilter,
      page,
      size: 20,
      minQuantity: appliedFilters.minQuantity || undefined,
      maxQuantity: appliedFilters.maxQuantity || undefined,
    }),
  })

  const mutation = useMutation({
    mutationFn: api.createMovement,
    onSuccess: async () => {
      reset({ movementType: 'ENTRY', itemId: '', quantity: 1, targetLocationId: '', reason: '', notes: '' })
      setItemSearch('')
      await queryClient.invalidateQueries({ queryKey: ['movements'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const applyFilters = (filters: MovementFilters) => {
    setPage(0)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    setPage(0)
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const applyQuickRange = (daysBack: number) => {
    const nextFilters = {
      ...draftFilters,
      fromDate: isoDateFromToday(daysBack),
      toDate: new Date().toISOString().slice(0, 10),
    }
    setDraftFilters(nextFilters)
    applyFilters(nextFilters)
  }

  const totalPages = movementsQuery.data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title={t('movements.title')} description={t('movements.description')} />

      {mutation.isError && <Notice variant="error">{mutation.error.message}</Notice>}
      {mutation.isSuccess && <Notice variant="success">{t('movements.success')}</Notice>}
      {!canEditInventory && <Notice variant="warning">{t('catalogs.managerOnly')}</Notice>}
      {!isGlobalAdmin && user?.assignedLocationName && <Notice>{t('movements.scopeNotice', { location: user.assignedLocationName })}</Notice>}

      {isGlobalAdmin && (
        <Card className="space-y-3">
          <label className="text-sm font-medium">{t('items.location')}</label>
          <select className="h-11 w-full rounded-xl border border-border bg-white px-3 md:max-w-sm" value={locationFilterId} onChange={(event) => setLocationFilterId(event.target.value)}>
            <option value="">{t('common.all')}</option>
            {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </Card>
      )}

      <div className={`grid gap-6 ${canEditInventory ? 'xl:grid-cols-[360px_1fr]' : ''}`}>
        {canEditInventory && (
          <Card>
            <MobileDisclosure
              defaultOpen
              description={t('movements.description')}
              isMobile={isPhone}
              title={t('movements.submit')}
            >
              <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate({
                movementType: values.movementType,
                itemId: values.itemId,
                quantity: values.quantity,
                targetLocationId: values.movementType === 'TRANSFER' ? values.targetLocationId : undefined,
                reason: values.reason,
                notes: values.notes,
              }))}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('movements.type')}</label>
                  <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('movementType')}>
                    {(['ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER'] as const).map((type) => <option key={type} value={type}>{enumLabel('movementType', type)}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('movements.itemSearch')}</label>
                  <Input
                    value={itemSearch}
                    placeholder={t('movements.itemSearchPlaceholder')}
                    onChange={(event) => setItemSearch(event.target.value)}
                  />
                  <p className="text-xs text-slate-500">{t('movements.itemSearchHelp')}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('movements.itemLabel')}</label>
                  <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
                    <option value="">{t('movements.selectItem')}</option>
                    {itemsQuery.data?.content.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.sku} - {item.primaryLocation}
                      </option>
                    ))}
                  </select>
                  {errors.itemId && <p className="text-sm text-red-600">{errors.itemId.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('common.quantity')}</label>
                  <Input type="number" step="1" {...register('quantity')} />
                  {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
                </div>

                {movementType === 'TRANSFER' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('movements.target')}</label>
                    <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('targetLocationId')}>
                      <option value="">{t('movements.selectTarget')}</option>
                      {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                    </select>
                    {errors.targetLocationId && <p className="text-sm text-red-600">{errors.targetLocationId.message}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('movements.reason')}</label>
                  <Input {...register('reason')} />
                  {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('common.notes')}</label>
                  <Input {...register('notes')} />
                </div>

                <Button className="w-full" type="submit">{t('movements.submit')}</Button>
              </form>
            </MobileDisclosure>
          </Card>
        )}

        <Card className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t('movements.historyTitle')}</h2>
              <p className="text-sm text-slate-500">{t('movements.historySummary', { count: movementsQuery.data?.totalElements ?? 0 })}</p>
            </div>
          </div>

          <MobileDisclosure
            defaultOpen={false}
            isMobile={isPhone}
            title={t('items.filtersTitle')}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2 xl:col-span-2">
                <label className="text-sm font-medium">{t('common.search')}</label>
                <Input
                  value={draftFilters.query}
                  placeholder={t('movements.historySearchPlaceholder')}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('movements.type')}</label>
                <select
                  className="h-11 w-full rounded-xl border border-border bg-white px-3"
                  value={draftFilters.movementType}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, movementType: event.target.value }))}
                >
                  <option value="">{t('common.all')}</option>
                  {(['ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER'] as const).map((type) => <option key={type} value={type}>{enumLabel('movementType', type)}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('movements.minQuantity')}</label>
                <Input type="number" min="0" step="0.01" value={draftFilters.minQuantity} onChange={(event) => setDraftFilters((current) => ({ ...current, minQuantity: event.target.value }))} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('movements.maxQuantity')}</label>
                <Input type="number" min="0" step="0.01" value={draftFilters.maxQuantity} onChange={(event) => setDraftFilters((current) => ({ ...current, maxQuantity: event.target.value }))} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('movements.fromDate')}</label>
                <Input type="date" value={draftFilters.fromDate} onChange={(event) => setDraftFilters((current) => ({ ...current, fromDate: event.target.value }))} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('movements.toDate')}</label>
                <Input type="date" value={draftFilters.toDate} onChange={(event) => setDraftFilters((current) => ({ ...current, toDate: event.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button className="w-full sm:w-auto" onClick={() => applyFilters(draftFilters)}>{t('common.apply')}</Button>
              <Button className="w-full bg-secondary text-secondary-foreground sm:w-auto" onClick={clearFilters}>{t('common.clear')}</Button>
              <Button className="w-full bg-secondary text-secondary-foreground sm:w-auto" onClick={() => applyQuickRange(6)}>{t('movements.quickLast7')}</Button>
              <Button className="w-full bg-secondary text-secondary-foreground sm:w-auto" onClick={() => applyQuickRange(29)}>{t('movements.quickLast30')}</Button>
            </div>
          </MobileDisclosure>

          {movementsQuery.isError && <Notice variant="error">{movementsQuery.error.message}</Notice>}

          <div className="space-y-4">
            {movementsQuery.data?.content.length ? movementsQuery.data.content.map((movement) => (
              <div key={movement.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-950">{movement.itemName}</p>
                    <p className="text-sm text-slate-500">{movement.itemSku} - {movement.reason}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{enumLabel('movementType', movement.movementType)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>{t('common.quantity')}: <strong>{quantityWithUnit(movement.quantity, movement.unitSymbol)}</strong></p>
                  <p>{t('movements.responsible')}: <strong>{movement.performedBy}</strong></p>
                  <p>{t('movements.source')}: <strong>{movement.sourceLocation ?? t('movements.notApplicable')}</strong></p>
                  <p>{t('movements.target')}: <strong>{movement.targetLocation ?? t('movements.notApplicable')}</strong></p>
                </div>
                {movement.notes && <p className="mt-3 text-sm text-slate-600">{movement.notes}</p>}
                <p className="mt-3 text-xs text-slate-500">{formatDate(movement.occurredAt)}</p>
              </div>
            )) : <Notice>{t('common.noRecords')}</Notice>}
          </div>

          {!!movementsQuery.data?.content.length && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">{t('items.pagination', { page: page + 1, totalPages: Math.max(totalPages, 1) })}</p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  className="w-full bg-secondary text-secondary-foreground sm:w-auto"
                  disabled={page <= 0}
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                >
                  {t('common.back')}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
