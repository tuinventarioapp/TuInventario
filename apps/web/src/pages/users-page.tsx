import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { queryClient } from '../app/query-client'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'

export function UsersPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'COLLABORATOR' })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: api.users })
  const mutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: async () => {
      setForm({ fullName: '', email: '', password: '', role: 'COLLABORATOR' })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios y roles" description="Administra el equipo interno del espacio de trabajo." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="space-y-3">
          <Input placeholder="Nombre completo" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
          <Input placeholder="Correo" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input type="password" placeholder="Contrasena" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            {['ADMIN', 'MANAGER', 'COLLABORATOR', 'BORROWER'].map((role) => <option key={role}>{role}</option>)}
          </select>
          <Button onClick={() => mutation.mutate(form)}>Crear usuario</Button>
        </Card>
        <Card>
          <div className="space-y-3">
            {usersQuery.data?.map((user) => (
              <div key={user.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-slate-500">{user.email} · {user.role} · {user.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
