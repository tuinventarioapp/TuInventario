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
  type: 'CONSUMABLE' | 'LENDABLE' | 'HYBRID' | 'NON_LENDABLE'
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
  type: 'CONSUMABLE' | 'LENDABLE' | 'HYBRID' | 'NON_LENDABLE'
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
    type: z.enum(['CONSUMABLE', 'LENDABLE', 'HYBRID', 'NON_LENDABLE']),
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
    type: z.enum(['CONSUMABLE', 'LENDABLE', 'HYBRID', 'NON_LENDABLE']),
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
        type: itemQuery.data.type as UpdateValues['type'],
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

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteItem(itemId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/app/items')
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

      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <Notice variant="error">{createMutation.error?.message ?? updateMutation.error?.message ?? deleteMutation.error?.message}</Notice>
      )}
      {deleteMutation.isSuccess && <Notice variant="success">{t('itemForm.successDelete')}</Notice>}

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
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU</label>
            <Input {...createForm.register('sku')} disabled={mode === 'edit'} />
            {mode === 'create' && <FieldError message={createForm.formState.errors.sku?.message} />}
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{t('itemForm.descriptionField')}</label>
            <textarea className="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400" {...registerField('description')} />
          </div>
          {mode === 'create' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('items.type')}</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('type')}>
                  {(['CONSUMABLE', 'LENDABLE', 'HYBRID', 'NON_LENDABLE'] as const).map((value) => (
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
                <label className="text-sm font-medium">{t('items.type')}</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...updateForm.register('type')}>
                  {(['CONSUMABLE', 'LENDABLE', 'HYBRID', 'NON_LENDABLE'] as const).map((value) => (
                    <option key={value} value={value}>{enumLabel('itemType', value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.status')}</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...updateForm.register('status')}>
                  {['AVAILABLE', 'RESERVED', 'ON_LOAN', 'MAINTENANCE', 'LOST', 'ARCHIVED'].map((value) => (
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
            <label className="text-sm font-medium">{t('items.category')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('categoryId')}>
              <option value="">{t('itemForm.selectCategory')}</option>
              {categoriesQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            <FieldError message={form.formState.errors.categoryId?.message} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('itemForm.unitLabel')}</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('unitId')}>
              <option value="">{t('itemForm.selectUnit')}</option>
              {unitsQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            <FieldError message={form.formState.errors.unitId?.message} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('items.location')}</label>
            <select
              className="h-11 w-full rounded-xl border border-border bg-white px-3"
              disabled={!isGlobalAdmin}
              {...registerField('primaryLocationId')}
            >
              {isGlobalAdmin && <option value="">{t('itemForm.selectLocation')}</option>}
              {locationsQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            <FieldError message={form.formState.errors.primaryLocationId?.message} />
          </div>
          <div className={`grid gap-2 md:col-span-2 ${mode === 'edit' ? 'md:grid-cols-[1fr_auto]' : ''}`}>
            <Button disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending} type="submit">
              {mode === 'create' ? t('itemForm.submitCreate') : t('itemForm.submitEdit')}
            </Button>
            {mode === 'edit' && (
              <Button
                className="bg-secondary text-secondary-foreground"
                disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                type="button"
                onClick={() => {
                  if (window.confirm(t('itemForm.deleteConfirm'))) {
                    deleteMutation.mutate()
                  }
                }}
              >
                {t('itemForm.delete')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-red-600">{message}</p>
}
