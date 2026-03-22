import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { queryClient } from '../app/query-client'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'

export function BorrowersPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const borrowersQuery = useQuery({ queryKey: ['borrowers'], queryFn: api.borrowers })
  const mutation = useMutation({
    mutationFn: api.createBorrower,
    onSuccess: async () => {
      setForm({ name: '', email: '', phone: '', notes: '' })
      await queryClient.invalidateQueries({ queryKey: ['borrowers'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Prestatarios" description="Gestiona las personas o clientes que reciben articulos." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input placeholder="Correo" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input placeholder="Telefono" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <Input placeholder="Notas" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          <Button onClick={() => mutation.mutate(form)}>Crear prestatario</Button>
        </Card>
        <Card>
          <div className="space-y-3">
            {borrowersQuery.data?.map((borrower) => (
              <div key={borrower.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{borrower.name}</p>
                <p className="text-sm text-slate-500">{borrower.email ?? 'Sin correo'} · {borrower.phone ?? 'Sin telefono'}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
