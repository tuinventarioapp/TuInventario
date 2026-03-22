import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { queryClient } from '../app/query-client'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { canManageCatalogs } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import type { OptionItem } from '../types/api'

type CategoryForm = { name: string; description: string }
type UnitForm = { name: string; symbol: string; allowsDecimal: boolean }
type LocationForm = { name: string; type: string; description: string }

export function CatalogsPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: '', description: '' })
  const [unitForm, setUnitForm] = useState<UnitForm>({ name: '', symbol: '', allowsDecimal: false })
  const [locationForm, setLocationForm] = useState<LocationForm>({ name: '', type: 'WAREHOUSE', description: '' })
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const unitsQuery = useQuery({ queryKey: ['units'], queryFn: api.units })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })

  const invalidateCatalogs = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    await queryClient.invalidateQueries({ queryKey: ['units'] })
    await queryClient.invalidateQueries({ queryKey: ['locations'] })
  }

  const categoryMutation = useMutation({
    mutationFn: () => editingCategoryId ? api.updateCategory(editingCategoryId, categoryForm) : api.createCategory(categoryForm),
    onSuccess: async () => {
      setCategoryForm({ name: '', description: '' })
      setEditingCategoryId(null)
      await invalidateCatalogs()
    },
  })
  const deleteCategoryMutation = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: invalidateCatalogs,
  })

  const unitMutation = useMutation({
    mutationFn: () => editingUnitId ? api.updateUnit(editingUnitId, unitForm) : api.createUnit(unitForm),
    onSuccess: async () => {
      setUnitForm({ name: '', symbol: '', allowsDecimal: false })
      setEditingUnitId(null)
      await invalidateCatalogs()
    },
  })
  const deleteUnitMutation = useMutation({
    mutationFn: api.deleteUnit,
    onSuccess: invalidateCatalogs,
  })

  const locationMutation = useMutation({
    mutationFn: () => editingLocationId ? api.updateLocation(editingLocationId, locationForm) : api.createLocation(locationForm),
    onSuccess: async () => {
      setLocationForm({ name: '', type: 'WAREHOUSE', description: '' })
      setEditingLocationId(null)
      await invalidateCatalogs()
    },
  })
  const deleteLocationMutation = useMutation({
    mutationFn: api.deleteLocation,
    onSuccess: invalidateCatalogs,
  })

  if (!canManageCatalogs(user?.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('catalogs.title')} description={t('catalogs.description')} />
        <Notice variant="warning">{t('catalogs.adminOnly')}</Notice>
      </div>
    )
  }

  const mutationError = categoryMutation.error?.message
    ?? deleteCategoryMutation.error?.message
    ?? unitMutation.error?.message
    ?? deleteUnitMutation.error?.message
    ?? locationMutation.error?.message
    ?? deleteLocationMutation.error?.message

  return (
    <div className="space-y-6">
      <PageHeader title={t('catalogs.title')} description={t('catalogs.description')} />
      <Notice>{t('catalogs.scopeHelp')}</Notice>
      {mutationError && <Notice variant="error">{mutationError}</Notice>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('catalogs.categories')}</h2>
            <p className="text-sm text-slate-500">{editingCategoryId ? t('catalogs.editCategory') : t('catalogs.createCategory')}</p>
          </div>
          <Input
            placeholder={t('common.name')}
            value={categoryForm.name}
            onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            placeholder={t('catalogs.categoryDescription')}
            value={categoryForm.description}
            onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={categoryMutation.isPending || categoryForm.name.trim().length < 3}
              onClick={() => categoryMutation.mutate()}
            >
              {editingCategoryId ? t('common.save') : t('catalogs.createCategory')}
            </Button>
            {editingCategoryId && (
              <Button
                className="bg-secondary text-secondary-foreground"
                onClick={() => {
                  setEditingCategoryId(null)
                  setCategoryForm({ name: '', description: '' })
                }}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
          <CatalogList
            items={categoriesQuery.data}
            emptyLabel={t('catalogs.empty')}
            editLabel={t('common.edit')}
            deleteLabel={t('common.delete')}
            onEdit={(option) => {
              setEditingCategoryId(option.id)
              setCategoryForm({ name: option.name, description: option.extra ?? '' })
            }}
            onDelete={(id) => {
              if (window.confirm(t('catalogs.deleteConfirm'))) {
                deleteCategoryMutation.mutate(id)
              }
            }}
          />
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('catalogs.units')}</h2>
            <p className="text-sm text-slate-500">{editingUnitId ? t('catalogs.editUnit') : t('catalogs.createUnit')}</p>
          </div>
          <Input
            placeholder={t('common.name')}
            value={unitForm.name}
            onChange={(event) => setUnitForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            placeholder={t('catalogs.unitSymbol')}
            value={unitForm.symbol}
            onChange={(event) => setUnitForm((current) => ({ ...current, symbol: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              checked={unitForm.allowsDecimal}
              type="checkbox"
              onChange={(event) => setUnitForm((current) => ({ ...current, allowsDecimal: event.target.checked }))}
            />
            {t('catalogs.unitDecimals')}
          </label>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={unitMutation.isPending || unitForm.name.trim().length < 2 || unitForm.symbol.trim().length < 1}
              onClick={() => unitMutation.mutate()}
            >
              {editingUnitId ? t('common.save') : t('catalogs.createUnit')}
            </Button>
            {editingUnitId && (
              <Button
                className="bg-secondary text-secondary-foreground"
                onClick={() => {
                  setEditingUnitId(null)
                  setUnitForm({ name: '', symbol: '', allowsDecimal: false })
                }}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
          <CatalogList
            items={unitsQuery.data}
            emptyLabel={t('catalogs.empty')}
            editLabel={t('common.edit')}
            deleteLabel={t('common.delete')}
            onEdit={(option) => {
              setEditingUnitId(option.id)
              setUnitForm({ name: option.name, symbol: option.extra ?? '', allowsDecimal: option.details === 'true' })
            }}
            onDelete={(id) => {
              if (window.confirm(t('catalogs.deleteConfirm'))) {
                deleteUnitMutation.mutate(id)
              }
            }}
          />
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('catalogs.locations')}</h2>
            <p className="text-sm text-slate-500">{editingLocationId ? t('catalogs.editLocation') : t('catalogs.createLocation')}</p>
          </div>
          <Input
            placeholder={t('common.name')}
            value={locationForm.name}
            onChange={(event) => setLocationForm((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            className="h-11 w-full rounded-xl border border-border bg-white px-3"
            value={locationForm.type}
            onChange={(event) => setLocationForm((current) => ({ ...current, type: event.target.value }))}
          >
            {['WAREHOUSE', 'OFFICE', 'VEHICLE', 'CLIENT_SITE', 'OTHER'].map((value) => (
              <option key={value} value={value}>{enumLabel('locationType', value)}</option>
            ))}
          </select>
          <Input
            placeholder={t('catalogs.categoryDescription')}
            value={locationForm.description}
            onChange={(event) => setLocationForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={locationMutation.isPending || locationForm.name.trim().length < 3}
              onClick={() => locationMutation.mutate()}
            >
              {editingLocationId ? t('common.save') : t('catalogs.createLocation')}
            </Button>
            {editingLocationId && (
              <Button
                className="bg-secondary text-secondary-foreground"
                onClick={() => {
                  setEditingLocationId(null)
                  setLocationForm({ name: '', type: 'WAREHOUSE', description: '' })
                }}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
          <CatalogList
            items={locationsQuery.data?.map((option) => ({ ...option, extra: enumLabel('locationType', option.extra) }))}
            emptyLabel={t('catalogs.empty')}
            editLabel={t('common.edit')}
            deleteLabel={t('common.delete')}
            onEdit={(option) => {
              const original = locationsQuery.data?.find((entry) => entry.id === option.id)
              setEditingLocationId(option.id)
              setLocationForm({ name: option.name, type: original?.extra ?? 'WAREHOUSE', description: original?.details ?? '' })
            }}
            onDelete={(id) => {
              if (window.confirm(t('catalogs.deleteConfirm'))) {
                deleteLocationMutation.mutate(id)
              }
            }}
          />
        </Card>
      </div>
    </div>
  )
}

function CatalogList({
  items,
  emptyLabel,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  items?: OptionItem[]
  emptyLabel: string
  editLabel: string
  deleteLabel: string
  onEdit: (item: OptionItem) => void
  onDelete: (id: string) => void
}) {
  if (!items?.length) {
    return <Notice>{emptyLabel}</Notice>
  }

  return (
    <div className="space-y-2">
      {items.map((option) => (
        <div key={option.id} className="rounded-2xl border border-border p-3">
          <p className="font-medium">{option.name}</p>
          <p className="text-sm text-slate-500">{option.extra || '-'}</p>
          <div className="mt-3 flex gap-2">
            <Button className="bg-secondary text-secondary-foreground" onClick={() => onEdit(option)}>
              {editLabel}
            </Button>
            <Button onClick={() => onDelete(option.id)}>
              {deleteLabel}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
