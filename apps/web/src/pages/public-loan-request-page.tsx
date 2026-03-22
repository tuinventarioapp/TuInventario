import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'

const schema = z.object({
  borrowerName: z.string().min(3),
  borrowerEmail: z.string().email().optional().or(z.literal('')),
  borrowerPhone: z.string().optional(),
  itemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  dueAt: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function PublicLoanRequestPage() {
  const itemsQuery = useQuery({
    queryKey: ['public-items'],
    queryFn: () => api.items('', 0, 50),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.publicLoanRequest({
        ...values,
        dueAt: new Date(values.dueAt).toISOString(),
      }),
    onSuccess: () => reset(),
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl bg-white/95">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Solicitud publica</p>
          <h1 className="text-3xl font-semibold">Solicitar un prestamo</h1>
          <p className="text-sm text-slate-600">Formulario abierto para solicitudes iniciales del inventario.</p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input {...register('borrowerName')} />
            {errors.borrowerName && <p className="text-sm text-red-600">{errors.borrowerName.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Correo</label>
            <Input {...register('borrowerEmail')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefono</label>
            <Input {...register('borrowerPhone')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Item</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
              <option value="">Selecciona un item</option>
              {itemsQuery.data?.content.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {errors.itemId && <p className="text-sm text-red-600">{errors.itemId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <Input type="number" step="0.01" {...register('quantity')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de devolucion</label>
            <Input type="datetime-local" {...register('dueAt')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <Input {...register('notes')} />
          </div>
          {mutation.isSuccess && <p className="text-sm text-emerald-700 md:col-span-2">Solicitud enviada correctamente.</p>}
          {mutation.isError && <p className="text-sm text-red-600 md:col-span-2">{mutation.error.message}</p>}
          <div className="md:col-span-2">
            <Button className="w-full" type="submit">Enviar solicitud</Button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          ¿Ya tienes acceso interno? <Link className="text-sky-700 hover:underline" to="/login">Ir al login</Link>
        </p>
      </Card>
    </div>
  )
}
