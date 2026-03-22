import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'

const createSchema = z.object({
  name: z.string().min(3),
  sku: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['CONSUMABLE', 'LENDABLE', 'HYBRID']),
  categoryId: z.string().min(1),
  unitId: z.string().min(1),
  primaryLocationId: z.string().min(1),
  initialStock: z.coerce.number().min(0),
})

const updateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.string().min(1),
  categoryId: z.string().min(1),
  unitId: z.string().min(1),
  primaryLocationId: z.string().min(1),
})

type CreateValues = z.infer<typeof createSchema>
type UpdateValues = z.infer<typeof updateSchema>

export function ItemFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const { itemId } = useParams()
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
    defaultValues: { type: 'LENDABLE', initialStock: 0 },
  })

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  })

  useEffect(() => {
    if (itemQuery.data && mode === 'edit') {
      updateForm.reset({
        name: itemQuery.data.name,
        description: itemQuery.data.description ?? '',
        imageUrl: '',
        status: itemQuery.data.status,
        categoryId: itemQuery.data.categoryId,
        unitId: itemQuery.data.unitId,
        primaryLocationId: itemQuery.data.primaryLocationId,
      })
    }
  }, [itemQuery.data, mode, updateForm])

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
  const registerField = (name: string) =>
    mode === 'create' ? (createForm.register as (field: string) => Record<string, unknown>)(name) : (updateForm.register as (field: string) => Record<string, unknown>)(name)

  return (
    <div className="space-y-6">
      <PageHeader title={mode === 'create' ? 'Nuevo item' : 'Editar item'} description="Configura los datos base del articulo y su ubicacion principal." />
      <Card>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            if (mode === 'create') createMutation.mutate(values as CreateValues)
            else updateMutation.mutate(values as UpdateValues)
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input {...registerField('name')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU</label>
            <Input {...createForm.register('sku')} disabled={mode === 'edit'} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Descripcion</label>
            <Input {...registerField('description')} />
          </div>
          {mode === 'create' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('type')}>
                  <option value="CONSUMABLE">Consumible</option>
                  <option value="LENDABLE">Prestable</option>
                  <option value="HYBRID">Hibrido</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock inicial</label>
                <Input type="number" step="0.01" {...createForm.register('initialStock')} />
              </div>
            </>
          )}
          {mode === 'edit' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...updateForm.register('status')}>
                {['AVAILABLE', 'RESERVED', 'ON_LOAN', 'MAINTENANCE', 'DAMAGED', 'LOST', 'ARCHIVED'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('categoryId')}>
              <option value="">Selecciona</option>
              {categoriesQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Unidad</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('unitId')}>
              <option value="">Selecciona</option>
              {unitsQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ubicacion principal</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...registerField('primaryLocationId')}>
              <option value="">Selecciona</option>
              {locationsQuery.data?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">{mode === 'create' ? 'Crear item' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
