import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

const schema = z.object({
  movementType: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER']),
  itemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  sourceLocationId: z.string().optional(),
  targetLocationId: z.string().optional(),
  reason: z.string().min(3),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function MovementsPage() {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { movementType: 'ENTRY' },
  })

  const itemsQuery = useQuery({ queryKey: ['items', 'movement-form'], queryFn: () => api.items('', 0, 50) })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const movementsQuery = useQuery({ queryKey: ['movements'], queryFn: () => api.movements() })

  const mutation = useMutation({
    mutationFn: api.createMovement,
    onSuccess: async () => {
      reset()
      await queryClient.invalidateQueries({ queryKey: ['movements'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Movimientos" description="Entradas, salidas, ajustes y traslados con trazabilidad." />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('movementType')}>
                {['ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER'].map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Item</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
                <option value="">Selecciona</option>
                {itemsQuery.data?.content.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input type="number" step="0.01" {...register('quantity')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicacion origen</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('sourceLocationId')}>
                <option value="">No aplica</option>
                {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicacion destino</label>
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('targetLocationId')}>
                <option value="">No aplica</option>
                {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input {...register('reason')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input {...register('notes')} />
            </div>
            <Button className="w-full" type="submit">Registrar movimiento</Button>
          </form>
        </Card>

        <Card>
          <div className="space-y-4">
            {movementsQuery.data?.content.map((movement) => (
              <div key={movement.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-950">{movement.itemName}</p>
                    <p className="text-sm text-slate-500">{movement.reason}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{movement.movementType}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>Cantidad: <strong>{movement.quantity}</strong></p>
                  <p>Responsable: <strong>{movement.performedBy}</strong></p>
                  <p>Origen: <strong>{movement.sourceLocation ?? 'N/A'}</strong></p>
                  <p>Destino: <strong>{movement.targetLocation ?? 'N/A'}</strong></p>
                </div>
                <p className="mt-3 text-xs text-slate-500">{formatDate(movement.occurredAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
