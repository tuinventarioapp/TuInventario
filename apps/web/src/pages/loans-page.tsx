import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { queryClient } from '../app/query-client'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

export function LoansPage() {
  const [loanForm, setLoanForm] = useState({ borrowerId: '', itemId: '', quantity: 1, dueAt: '', notes: '' })
  const borrowersQuery = useQuery({ queryKey: ['borrowers'], queryFn: api.borrowers })
  const itemsQuery = useQuery({ queryKey: ['items', 'loan-form'], queryFn: () => api.items('', 0, 50) })
  const loanRequestsQuery = useQuery({ queryKey: ['loan-requests'], queryFn: api.loanRequests })
  const loansQuery = useQuery({ queryKey: ['loans'], queryFn: api.loans })

  const createMutation = useMutation({
    mutationFn: api.createLoanRequest,
    onSuccess: async () => {
      setLoanForm({ borrowerId: '', itemId: '', quantity: 1, dueAt: '', notes: '' })
      await queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: api.approveLoanRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const deliverMutation = useMutation({
    mutationFn: api.deliverLoan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.returnLoan(id, { returnCondition: 'GOOD', notes: 'Devolucion registrada desde panel operativo' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Prestamos" description="Gestiona solicitudes, aprobaciones, entregas y devoluciones." />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Nueva solicitud interna</h2>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={loanForm.borrowerId} onChange={(event) => setLoanForm((current) => ({ ...current, borrowerId: event.target.value }))}>
              <option value="">Selecciona prestatario</option>
              {borrowersQuery.data?.map((borrower) => <option key={borrower.id} value={borrower.id}>{borrower.name}</option>)}
            </select>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={loanForm.itemId} onChange={(event) => setLoanForm((current) => ({ ...current, itemId: event.target.value }))}>
              <option value="">Selecciona item</option>
              {itemsQuery.data?.content.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <Input type="number" min="1" value={loanForm.quantity} onChange={(event) => setLoanForm((current) => ({ ...current, quantity: Number(event.target.value) }))} />
            <Input type="datetime-local" value={loanForm.dueAt} onChange={(event) => setLoanForm((current) => ({ ...current, dueAt: event.target.value }))} />
            <Input value={loanForm.notes} onChange={(event) => setLoanForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" />
            <Button
              className="w-full"
              onClick={() =>
                createMutation.mutate({
                  ...loanForm,
                  dueAt: new Date(loanForm.dueAt).toISOString(),
                })
              }
            >
              Crear solicitud
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold">Solicitudes</h2>
            <div className="mt-4 space-y-3">
              {loanRequestsQuery.data?.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{request.borrowerName} · {request.itemName}</p>
                      <p className="text-sm text-slate-500">Cantidad {request.quantity} · vence {formatDate(request.dueAt)}</p>
                    </div>
                    <Button disabled={request.status !== 'PENDING'} onClick={() => approveMutation.mutate(request.id)}>
                      Aprobar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Prestamos activos y cerrados</h2>
            <div className="mt-4 space-y-3">
              {loansQuery.data?.map((loan) => (
                <div key={loan.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{loan.borrowerName} · {loan.itemName}</p>
                      <p className="text-sm text-slate-500">{loan.status} · vence {formatDate(loan.dueAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button disabled={loan.status !== 'APPROVED'} onClick={() => deliverMutation.mutate(loan.id)}>Entregar</Button>
                      <Button className="bg-secondary text-secondary-foreground" disabled={!['DELIVERED', 'OVERDUE'].includes(loan.status)} onClick={() => returnMutation.mutate(loan.id)}>Registrar devolucion</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
