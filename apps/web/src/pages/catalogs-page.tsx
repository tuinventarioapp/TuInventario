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

export function CatalogsPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [unitForm, setUnitForm] = useState({ name: '', symbol: '', allowsDecimal: false })
  const [locationForm, setLocationForm] = useState({ name: '', type: 'WAREHOUSE', description: '' })

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const unitsQuery = useQuery({ queryKey: ['units'], queryFn: api.units })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })

  const categoryMutation = useMutation({
    mutationFn: api.createCategory,
    onSuccess: async () => {
      setCategoryForm({ name: '', description: '' })
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const unitMutation = useMutation({
    mutationFn: api.createUnit,
    onSuccess: async () => {
      setUnitForm({ name: '', symbol: '', allowsDecimal: false })
      await queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })

  const locationMutation = useMutation({
    mutationFn: api.createLocation,
    onSuccess: async () => {
      setLocationForm({ name: '', type: 'WAREHOUSE', description: '' })
      await queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })

  if (!canManageCatalogs(user?.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('catalogs.title')} description={t('catalogs.description')} />
        <Notice variant="warning">{t('catalogs.managerOnly')}</Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('catalogs.title')} description={t('catalogs.description')} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('catalogs.categories')}</h2>
            <p className="text-sm text-slate-500">{t('catalogs.createCategory')}</p>
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
          {categoryMutation.isError && <Notice variant="error">{categoryMutation.error.message}</Notice>}
          <Button
            className="w-full"
            disabled={categoryMutation.isPending || categoryForm.name.trim().length < 3}
            onClick={() => categoryMutation.mutate(categoryForm)}
          >
            {t('catalogs.createCategory')}
          </Button>
          <div className="space-y-2">
            {categoriesQuery.data?.length ? categoriesQuery.data.map((option) => (
              <div key={option.id} className="rounded-2xl border border-border p-3">
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-slate-500">{option.extra || t('common.notAvailable')}</p>
              </div>
            )) : <Notice>{t('catalogs.empty')}</Notice>}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('catalogs.units')}</h2>
            <p className="text-sm text-slate-500">{t('catalogs.createUnit')}</p>
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
          {unitMutation.isError && <Notice variant="error">{unitMutation.error.message}</Notice>}
          <Button
            className="w-full"
            disabled={unitMutation.isPending || unitForm.name.trim().length < 2 || unitForm.symbol.trim().length < 1}
            onClick={() => unitMutation.mutate(unitForm)}
          >
            {t('catalogs.createUnit')}
          </Button>
          <div className="space-y-2">
            {unitsQuery.data?.length ? unitsQuery.data.map((option) => (
              <div key={option.id} className="rounded-2xl border border-border p-3">
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-slate-500">{option.extra}</p>
              </div>
            )) : <Notice>{t('catalogs.empty')}</Notice>}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('catalogs.locations')}</h2>
            <p className="text-sm text-slate-500">{t('catalogs.createLocation')}</p>
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
          {locationMutation.isError && <Notice variant="error">{locationMutation.error.message}</Notice>}
          <Button
            className="w-full"
            disabled={locationMutation.isPending || locationForm.name.trim().length < 3}
            onClick={() => locationMutation.mutate(locationForm)}
          >
            {t('catalogs.createLocation')}
          </Button>
          <div className="space-y-2">
            {locationsQuery.data?.length ? locationsQuery.data.map((option) => (
              <div key={option.id} className="rounded-2xl border border-border p-3">
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-slate-500">{enumLabel('locationType', option.extra)}</p>
              </div>
            )) : <Notice>{t('catalogs.empty')}</Notice>}
          </div>
        </Card>
      </div>
    </div>
  )
}
