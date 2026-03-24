import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
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
import { useAuthStore } from '../store/auth-store'

type CreateValues = {
  name: string
  sku: string
  description?: string
  imageUrl?: string
  type: 'CONSUMABLE' | 'LENDABLE' | 'HYBRID'
  categoryId: string
  unitId: string
  primaryLocationId: string
  initialStock: number
  minimumStock: number
}

type UpdateValues = {
  name: string
  description?: string
  imageUrl?: string
  status: string
  categoryId: string
  unitId: string
  primaryLocationId: string
  minimumStock: number
}

export function ItemFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t, enumLabel } = useI18n()
  const navigate = useNavigate()
  const { itemId } = useParams()
  const user = useAuthStore((state) => state.user)
  const isGlobalAdmin = isAdmin(user?.role)
  const createSchema = z.object({
    name: z.string().min(3, t('validation.name')),
    sku: z.string().min(2, t('validation.required')),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    type: z.enum(['CONSUMABLE', 'LENDABLE', 'HYBRID']),
    categoryId: z.string().min(1, t('validation.required')),
    unitId: z.string().min(1, t('validation.required')),
    primaryLocationId: z.string().min(1, t('validation.required')),
    initialStock: z.coerce.number().min(0),
    minimumStock: z.coerce.number().min(0),
  })

  const updateSchema = z.object({
    name: z.string().min(3, t('validation.name')),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.string().min(1, t('validation.required')),
    categoryId: z.string().min(1, t('validation.required')),
    unitId: z.string().min(1, t('validation.required')),
    primaryLocationId: z.string().min(1, t('validation.required')),
    minimumStock: z.coerce.number().min(0),
  })

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const unitsQuery = useQuery({ queryKey: ['units'], queryFn: api.units })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const itemQuery = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => api.item(itemId!),
    enabled: mode === 'edit' && Boolean(itemId),
  })

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { type: 'LENDABLE', initialStock: 0, minimumStock: 0 },
  })

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  })

  const selectedUnitId = mode === 'create' ? createForm.watch('unitId') : updateForm.watch('unitId')
  const selectedUnit = unitsQuery.data?.find((option) => option.id === selectedUnitId)
  const quantityStep = selectedUnit?.details === 'true' ? '0.01' : '1'

  useEffect(() => {
    if (itemQuery.data && mode === 'edit') {
      updateForm.reset({
        name: itemQuery.data.name,
        description: itemQuery.data.description ?? '',
        imageUrl: itemQuery.data.imageUrl ?? '',
        status: itemQuery.data.status,
        categoryId: itemQuery.data.categoryId,
        unitId: itemQuery.data.unitId,
        primaryLocationId: itemQuery.data.primaryLocationId,
        minimumStock: itemQuery.data.minimumStock,
      })
    }
  }, [itemQuery.data, mode, updateForm])

  useEffect(() => {
    if (mode !== 'create' || isGlobalAdmin || !user?.assignedLocationId) return
    createForm.setValue('primaryLocationId', user.assignedLocationId)
  }, [createForm, isGlobalAdmin, mode, user?.assignedLocationId])

  const createMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      navigate('/app/items')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: UpdateValues) => api.updateItem(itemId!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      navigate(`/app/items/${itemId}`)
    },
  })

  const form = mode === 'create' ? createForm : updateForm
  const registerField = <T extends keyof CreateValues | keyof UpdateValues>(name: T) =>
    mode === 'create'
      ? createForm.register(name as keyof CreateValues)
      : updateForm.register(name as keyof UpdateValues)

  if (!canManageInventory(user?.role)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={mode === 'create' ? t('itemForm.createTitle') : t('itemForm.editTitle')}
          description={t('itemForm.description')}
        />
        <Notice variant="warning">{t('catalogs.managerOnly')}</Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? t('itemForm.createTitle') : t('itemForm.editTitle')}
        description={t('itemForm.description')}
      />

      {(createMutation.isError || updateMutation.isError) && (
        <Notice variant="error">{createMutation.error?.message ?? updateMutation.error?.message}</Notice>
      )}

      <Card>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            if (mode === 'create') createMutation.mutate(values as CreateValues)
            else updateMutation.mutate(values as UpdateValues)
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.name')}</label>
            <Input {...registerField('name')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU</label>
            <Input {...createForm.register('sku')} disabled={mode === 'edit'} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{t('catalogs.categoryDescription')}</label>
            <Input {...registerField('description')} />
          </div>
          {mode === 'create' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('movements.type')}</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('type')}>
                  {(['CONSUMABLE', 'LENDABLE', 'HYBRID'] as const).map((value) => (
                    <option key={value} value={value}>{enumLabel('itemType', value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.quantity')}</label>
                <Input type="number" min="0" step={quantityStep} {...createForm.register('initialStock')} />
                <p className="text-xs text-slate-500">
                  {selectedUnit
                    ? t('itemForm.quantityHelpWithUnit', { unit: selectedUnit.name, symbol: selectedUnit.extra })
                    : t('itemForm.quantityHelp')}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('items.minimumStock')}</label>
                <Input type="number" min="0" step={quantityStep} {...createForm.register('minimumStock')} />
                <p className="text-xs text-slate-500">
                  {selectedUnit
                    ? t('itemForm.minimumStockHelpWithUnit', { unit: selectedUnit.name, symbol: selectedUnit.extra })
                    : t('itemForm.minimumStockHelp')}
                </p>
              </div>
            </>
          )}
          {mode === 'edit' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.status')}</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...updateForm.register('status')}>
                  {['AVAILABLE', 'RESERVED', 'ON_LOAN', 'MAINTENANCE', 'DAMAGED', 'LOST', 'ARCHIVED'].map((value) => (
                    <option key={value} value={value}>{enumLabel('itemStatus', value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('items.minimumStock')}</label>
                <Input type="number" min="0" step={quantityStep} {...updateForm.register('minimumStock')} />
                <p className="text-xs text-slate-500">
                  {selectedUnit
                    ? t('itemForm.minimumStockHelpWithUnit', { unit: selectedUnit.name, symbol: selectedUnit.extra })
                    : t('itemForm.minimumStockHelp')}
                </p>
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('catalogs.categories')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('categoryId')}>
              <option value="">{t('validation.required')}</option>
              {categoriesQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('catalogs.units')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('unitId')}>
              <option value="">{t('validation.required')}</option>
              {unitsQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('catalogs.locations')}</label>
            <select
              className="h-11 w-full rounded-xl border border-border bg-white px-3"
              disabled={!isGlobalAdmin}
              {...registerField('primaryLocationId')}
            >
              {isGlobalAdmin && <option value="">{t('validation.required')}</option>}
              {locationsQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <Button disabled={createMutation.isPending || updateMutation.isPending} type="submit">
              {mode === 'create' ? t('itemForm.submitCreate') : t('itemForm.submitEdit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
