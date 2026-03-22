import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
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

export function MovementsPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const canEditInventory = canManageInventory(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationFilterId, setLocationFilterId] = useState('')
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
    queryKey: ['items', 'movement-form', effectiveLocationFilter],
    queryFn: () => api.items({ query: '', page: 0, size: 100, locationId: effectiveLocationFilter }),
    enabled: canEditInventory,
  })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const movementsQuery = useQuery({
    queryKey: ['movements', effectiveLocationFilter],
    queryFn: () => api.movements(0, 50, effectiveLocationFilter),
  })

  const mutation = useMutation({
    mutationFn: api.createMovement,
    onSuccess: async () => {
      reset({ movementType: 'ENTRY', itemId: '', quantity: 1, targetLocationId: '', reason: '', notes: '' })
      await queryClient.invalidateQueries({ queryKey: ['movements'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

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
        {canEditInventory && <Card>
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
              <label className="text-sm font-medium">{t('movements.itemLabel')}</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
                <option value="">{t('validation.required')}</option>
                {itemsQuery.data?.content.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.primaryLocation}</option>)}
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
        </Card>}

        <Card>
          <div className="space-y-4">
            {movementsQuery.data?.content.length ? movementsQuery.data.content.map((movement) => (
              <div key={movement.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-950">{movement.itemName}</p>
                    <p className="text-sm text-slate-500">{movement.reason}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{enumLabel('movementType', movement.movementType)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>{t('common.quantity')}: <strong>{movement.quantity}</strong></p>
                  <p>{t('movements.responsible')}: <strong>{movement.performedBy}</strong></p>
                  <p>{t('movements.source')}: <strong>{movement.sourceLocation ?? t('movements.notApplicable')}</strong></p>
                  <p>{t('movements.target')}: <strong>{movement.targetLocation ?? t('movements.notApplicable')}</strong></p>
                </div>
                <p className="mt-3 text-xs text-slate-500">{formatDate(movement.occurredAt)}</p>
              </div>
            )) : <Notice>{t('common.noRecords')}</Notice>}
          </div>
        </Card>
      </div>
    </div>
  )
}
