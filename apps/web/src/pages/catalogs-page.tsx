import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

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
type LocationCategoryForm = { name: string; description: string }
type LocationForm = { name: string; locationCategoryId: string; description: string }

export function CatalogsPage() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: '', description: '' })
  const [unitForm, setUnitForm] = useState<UnitForm>({ name: '', symbol: '', allowsDecimal: false })
  const [locationCategoryForm, setLocationCategoryForm] = useState<LocationCategoryForm>({ name: '', description: '' })
  const [locationForm, setLocationForm] = useState<LocationForm>({ name: '', locationCategoryId: '', description: '' })
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [editingLocationCategoryId, setEditingLocationCategoryId] = useState<string | null>(null)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const unitsQuery = useQuery({ queryKey: ['units'], queryFn: api.units })
  const locationCategoriesQuery = useQuery({ queryKey: ['location-categories'], queryFn: api.locationCategories })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })

  useEffect(() => {
    if (!editingLocationId && !locationForm.locationCategoryId && locationCategoriesQuery.data?.[0]?.id) {
      setLocationForm((current) => ({ ...current, locationCategoryId: locationCategoriesQuery.data?.[0]?.id ?? '' }))
    }
  }, [editingLocationId, locationCategoriesQuery.data, locationForm.locationCategoryId])

  const invalidateCatalogs = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    await queryClient.invalidateQueries({ queryKey: ['units'] })
    await queryClient.invalidateQueries({ queryKey: ['location-categories'] })
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
  const deleteCategoryMutation = useMutation({ mutationFn: api.deleteCategory, onSuccess: invalidateCatalogs })

  const unitMutation = useMutation({
    mutationFn: () => editingUnitId ? api.updateUnit(editingUnitId, unitForm) : api.createUnit(unitForm),
    onSuccess: async () => {
      setUnitForm({ name: '', symbol: '', allowsDecimal: false })
      setEditingUnitId(null)
      await invalidateCatalogs()
    },
  })
  const deleteUnitMutation = useMutation({ mutationFn: api.deleteUnit, onSuccess: invalidateCatalogs })

  const locationCategoryMutation = useMutation({
    mutationFn: () => editingLocationCategoryId
      ? api.updateLocationCategory(editingLocationCategoryId, locationCategoryForm)
      : api.createLocationCategory(locationCategoryForm),
    onSuccess: async () => {
      setLocationCategoryForm({ name: '', description: '' })
      setEditingLocationCategoryId(null)
      await invalidateCatalogs()
    },
  })
  const deleteLocationCategoryMutation = useMutation({ mutationFn: api.deleteLocationCategory, onSuccess: invalidateCatalogs })

  const locationMutation = useMutation({
    mutationFn: () => editingLocationId ? api.updateLocation(editingLocationId, locationForm) : api.createLocation(locationForm),
    onSuccess: async () => {
      setLocationForm({ name: '', locationCategoryId: locationCategoriesQuery.data?.[0]?.id ?? '', description: '' })
      setEditingLocationId(null)
      await invalidateCatalogs()
    },
  })
  const deleteLocationMutation = useMutation({ mutationFn: api.deleteLocation, onSuccess: invalidateCatalogs })

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
    ?? locationCategoryMutation.error?.message
    ?? deleteLocationCategoryMutation.error?.message
    ?? locationMutation.error?.message
    ?? deleteLocationMutation.error?.message

  return (
    <div className="space-y-6">
      <PageHeader title={t('catalogs.title')} description={t('catalogs.description')} />
      <Notice>{t('catalogs.scopeHelp')}</Notice>
      {mutationError && <Notice variant="error">{mutationError}</Notice>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <SectionHeader title={t('catalogs.categories')} subtitle={editingCategoryId ? t('catalogs.editCategory') : t('catalogs.createCategory')} />
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
          <EditorActions
            editing={Boolean(editingCategoryId)}
            disabled={categoryMutation.isPending || categoryForm.name.trim().length < 3}
            onSave={() => categoryMutation.mutate()}
            onCancel={() => {
              setEditingCategoryId(null)
              setCategoryForm({ name: '', description: '' })
            }}
            cancelLabel={t('common.cancel')}
          >
            {editingCategoryId ? t('common.save') : t('catalogs.createCategory')}
          </EditorActions>
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
          <SectionHeader title={t('catalogs.units')} subtitle={editingUnitId ? t('catalogs.editUnit') : t('catalogs.createUnit')} />
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
          <EditorActions
            editing={Boolean(editingUnitId)}
            disabled={unitMutation.isPending || unitForm.name.trim().length < 2 || unitForm.symbol.trim().length < 1}
            onSave={() => unitMutation.mutate()}
            onCancel={() => {
              setEditingUnitId(null)
              setUnitForm({ name: '', symbol: '', allowsDecimal: false })
            }}
            cancelLabel={t('common.cancel')}
          >
            {editingUnitId ? t('common.save') : t('catalogs.createUnit')}
          </EditorActions>
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
          <SectionHeader
            title={t('catalogs.locationCategories')}
            subtitle={editingLocationCategoryId ? t('catalogs.editLocationCategory') : t('catalogs.createLocationCategory')}
          />
          <Input
            placeholder={t('common.name')}
            value={locationCategoryForm.name}
            onChange={(event) => setLocationCategoryForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            placeholder={t('catalogs.categoryDescription')}
            value={locationCategoryForm.description}
            onChange={(event) => setLocationCategoryForm((current) => ({ ...current, description: event.target.value }))}
          />
          <EditorActions
            editing={Boolean(editingLocationCategoryId)}
            disabled={locationCategoryMutation.isPending || locationCategoryForm.name.trim().length < 3}
            onSave={() => locationCategoryMutation.mutate()}
            onCancel={() => {
              setEditingLocationCategoryId(null)
              setLocationCategoryForm({ name: '', description: '' })
            }}
            cancelLabel={t('common.cancel')}
          >
            {editingLocationCategoryId ? t('common.save') : t('catalogs.createLocationCategory')}
          </EditorActions>
          <CatalogList
            items={locationCategoriesQuery.data}
            emptyLabel={t('catalogs.empty')}
            editLabel={t('common.edit')}
            deleteLabel={t('common.delete')}
            onEdit={(option) => {
              setEditingLocationCategoryId(option.id)
              setLocationCategoryForm({ name: option.name, description: option.extra ?? '' })
            }}
            onDelete={(id) => {
              if (window.confirm(t('catalogs.deleteConfirm'))) {
                deleteLocationCategoryMutation.mutate(id)
              }
            }}
          />
        </Card>

        <Card className="space-y-4">
          <SectionHeader title={t('catalogs.locations')} subtitle={editingLocationId ? t('catalogs.editLocation') : t('catalogs.createLocation')} />
          <Input
            placeholder={t('common.name')}
            value={locationForm.name}
            onChange={(event) => setLocationForm((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            className="h-11 w-full rounded-xl border border-border bg-white px-3"
            value={locationForm.locationCategoryId}
            onChange={(event) => setLocationForm((current) => ({ ...current, locationCategoryId: event.target.value }))}
          >
            <option value="">{t('catalogs.selectLocationCategory')}</option>
            {locationCategoriesQuery.data?.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <Input
            placeholder={t('catalogs.categoryDescription')}
            value={locationForm.description}
            onChange={(event) => setLocationForm((current) => ({ ...current, description: event.target.value }))}
          />
          {!locationCategoriesQuery.data?.length && <Notice variant="warning">{t('catalogs.locationCategoryRequired')}</Notice>}
          <EditorActions
            editing={Boolean(editingLocationId)}
            disabled={locationMutation.isPending || locationForm.name.trim().length < 3 || !locationForm.locationCategoryId}
            onSave={() => locationMutation.mutate()}
            onCancel={() => {
              setEditingLocationId(null)
              setLocationForm({ name: '', locationCategoryId: locationCategoriesQuery.data?.[0]?.id ?? '', description: '' })
            }}
            cancelLabel={t('common.cancel')}
          >
            {editingLocationId ? t('common.save') : t('catalogs.createLocation')}
          </EditorActions>
          <CatalogList
            items={locationsQuery.data}
            emptyLabel={t('catalogs.empty')}
            editLabel={t('common.edit')}
            deleteLabel={t('common.delete')}
            onEdit={(option) => {
              setEditingLocationId(option.id)
              setLocationForm({
                name: option.name,
                locationCategoryId: option.referenceId ?? '',
                description: option.details ?? '',
              })
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

function EditorActions({
  children,
  editing,
  disabled,
  onSave,
  onCancel,
  cancelLabel,
}: {
  children: string
  editing: boolean
  disabled: boolean
  onSave: () => void
  onCancel: () => void
  cancelLabel: string
}) {
  return (
    <div className="flex gap-2">
      <Button className="flex-1" disabled={disabled} onClick={onSave}>
        {children}
      </Button>
      {editing && (
        <Button className="bg-secondary text-secondary-foreground" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
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
          {option.details && option.details !== 'true' && option.details !== 'false' && (
            <p className="mt-1 text-xs text-slate-500">{option.details}</p>
          )}
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
