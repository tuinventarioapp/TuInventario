import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { isAdmin, isManagerOrAdmin } from '../lib/access'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'
import type { Loan } from '../types/api'

type FormValues = {
  borrowerId: string
  itemId: string
  quantity: number
  dueAt: string
  notes?: string
}

type ReturnDraft = {
  returnedGoodQuantity: string
  returnedDamagedQuantity: string
  lostQuantity: string
  notes: string
}

function buildDefaultReturnDraft(loan: Loan): ReturnDraft {
  return {
    returnedGoodQuantity: String(loan.outstandingQuantity || 0),
    returnedDamagedQuantity: '0',
    lostQuantity: '0',
    notes: '',
  }
}

export function LoansPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const canManageLoanLifecycle = isManagerOrAdmin(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationFilterId, setLocationFilterId] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({})
  const [returnDrafts, setReturnDrafts] = useState<Record<string, ReturnDraft>>({})
  const schema = useMemo(() => z.object({
    borrowerId: z.string().min(1, t('validation.required')),
    itemId: z.string().min(1, t('validation.required')),
    quantity: z.coerce.number().positive(t('validation.quantity')),
    dueAt: z.string().min(1, t('validation.date')),
    notes: z.string().optional(),
  }), [t])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  })

  const effectiveLocationFilter = isGlobalAdmin ? locationFilterId || undefined : user?.assignedLocationId ?? undefined
  const borrowersQuery = useQuery({ queryKey: ['borrowers'], queryFn: api.borrowers })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const itemsQuery = useQuery({
    queryKey: ['items', 'loan-form', effectiveLocationFilter],
    queryFn: () => api.items({ query: '', page: 0, size: 100, stockFilter: 'IN_STOCK', locationId: effectiveLocationFilter }),
  })
  const loanRequestsQuery = useQuery({ queryKey: ['loan-requests', effectiveLocationFilter], queryFn: () => api.loanRequests(effectiveLocationFilter) })
  const loansQuery = useQuery({ queryKey: ['loans', effectiveLocationFilter], queryFn: () => api.loans(effectiveLocationFilter) })

  const availableItems = itemsQuery.data?.content.filter((item) => ['LENDABLE', 'HYBRID'].includes(item.type) && item.availableStock > 0) ?? []

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.createLoanRequest({
        ...values,
        dueAt: new Date(values.dueAt).toISOString(),
      }),
    onSuccess: async () => {
      reset({ borrowerId: '', itemId: '', quantity: 1, dueAt: '', notes: '' })
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
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deliverMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => api.deliverLoan(id, { notes }),
    onSuccess: async (_, variables) => {
      setDeliveryNotes((current) => ({ ...current, [variables.id]: '' }))
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { returnedGoodQuantity: number; returnedDamagedQuantity: number; lostQuantity: number; notes?: string } }) =>
      api.returnLoan(id, payload),
    onSuccess: async (_, variables) => {
      setReturnDrafts((current) => {
        const next = { ...current }
        delete next[variables.id]
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const getReturnDraft = (loan: Loan) => returnDrafts[loan.id] ?? buildDefaultReturnDraft(loan)

  const updateReturnDraft = (loan: Loan, patch: Partial<ReturnDraft>) => {
    setReturnDrafts((current) => ({
      ...current,
      [loan.id]: {
        ...getReturnDraft(loan),
        ...patch,
      },
    }))
  }

  const workflowMessage = (loan: Loan) => {
    if (loan.status === 'APPROVED') return t('loans.workflowApproved')
    if (loan.status === 'DELIVERED') return t('loans.workflowDelivered')
    if (loan.status === 'OVERDUE') return t('loans.workflowOverdue')
    if (loan.status === 'RETURNED') return t('loans.workflowReturned')
    return t('loans.workflowPending')
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('loans.title')} description={t('loans.description')} />

      {createMutation.isError && <Notice variant="error">{createMutation.error.message}</Notice>}
      {createMutation.isSuccess && <Notice variant="success">{t('loans.successRequest')}</Notice>}
      {approveMutation.isError && <Notice variant="error">{approveMutation.error.message}</Notice>}
      {approveMutation.isSuccess && <Notice variant="success">{t('loans.successApproval')}</Notice>}
      {deliverMutation.isError && <Notice variant="error">{deliverMutation.error.message}</Notice>}
      {deliverMutation.isSuccess && <Notice variant="success">{t('loans.successDelivery')}</Notice>}
      {returnMutation.isError && <Notice variant="error">{returnMutation.error.message}</Notice>}
      {returnMutation.isSuccess && <Notice variant="success">{t('loans.successReturn')}</Notice>}

      {!isGlobalAdmin && user?.assignedLocationName && <Notice>{t('loans.scopeNotice', { location: user.assignedLocationName })}</Notice>}

      {isGlobalAdmin && (
        <Card className="space-y-3">
          <label className="text-sm font-medium">{t('items.location')}</label>
          <select className="h-11 w-full rounded-xl border border-border bg-white px-3 md:max-w-sm" value={locationFilterId} onChange={(event) => setLocationFilterId(event.target.value)}>
            <option value="">{t('common.all')}</option>
            {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
            <h2 className="text-lg font-semibold">{t('loans.newRequest')}</h2>

            {!borrowersQuery.data?.length && <Notice variant="warning">{t('loans.emptyBorrowers')}</Notice>}
            {!availableItems.length && <Notice variant="warning">{t('loans.emptyItems')}</Notice>}

            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('borrowerId')}>
              <option value="">{t('loans.selectBorrower')}</option>
              {borrowersQuery.data?.map((borrower) => <option key={borrower.id} value={borrower.id}>{borrower.name}</option>)}
            </select>
            {errors.borrowerId && <p className="text-sm text-red-600">{errors.borrowerId.message}</p>}

            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
              <option value="">{t('loans.selectItem')}</option>
              {availableItems.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.primaryLocation}</option>)}
            </select>
            {errors.itemId && <p className="text-sm text-red-600">{errors.itemId.message}</p>}

            <Input type="number" min="1" step="1" {...register('quantity')} />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}

            <Input type="datetime-local" {...register('dueAt')} />
            {errors.dueAt && <p className="text-sm text-red-600">{errors.dueAt.message}</p>}

            <Input placeholder={t('common.notes')} {...register('notes')} />

            <Button className="w-full" disabled={createMutation.isPending || !borrowersQuery.data?.length || !availableItems.length} type="submit">
              {t('loans.createRequest')}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold">{t('loans.requests')}</h2>
            <div className="mt-4 space-y-3">
              {loanRequestsQuery.data?.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{request.borrowerName} - {request.itemName}</p>
                      <p className="text-sm text-slate-500">{request.locationName}</p>
                      <p className="text-sm text-slate-500">{t('common.quantity')} {request.quantity} - {t('loans.dueLabel')} {formatDate(request.dueAt)}</p>
                      {request.notes && <p className="mt-2 text-sm text-slate-600">{request.notes}</p>}
                    </div>
                    {canManageLoanLifecycle && (
                      <Button disabled={request.status !== 'PENDING' || approveMutation.isPending} onClick={() => approveMutation.mutate(request.id)}>
                        {t('loans.approve')}
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{enumLabel('loanRequestStatus', request.status)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">{t('loans.activeAndClosed')}</h2>
            <div className="mt-4 space-y-4">
              {loansQuery.data?.map((loan) => {
                const returnDraft = getReturnDraft(loan)
                return (
                  <div key={loan.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{loan.borrowerName} - {loan.itemName}</p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{enumLabel('loanStatus', loan.status)}</span>
                        </div>
                        <p className="text-sm text-slate-500">{loan.locationName}</p>
                        <p className="text-sm text-slate-600">{workflowMessage(loan)}</p>
                        <p className="text-sm text-slate-500">{t('loans.dueLabel')} {formatDate(loan.dueAt)}</p>
                        {loan.notes && <p className="text-sm text-slate-600">{loan.notes}</p>}
                      </div>

                      {canManageLoanLifecycle && (
                        <div className="flex w-full max-w-md flex-col gap-3 md:items-end">
                          {loan.status === 'APPROVED' && (
                            <>
                              <Input
                                placeholder={t('loans.deliveryNotes')}
                                value={deliveryNotes[loan.id] ?? ''}
                                onChange={(event) => setDeliveryNotes((current) => ({ ...current, [loan.id]: event.target.value }))}
                              />
                              <Button disabled={deliverMutation.isPending} onClick={() => deliverMutation.mutate({ id: loan.id, notes: deliveryNotes[loan.id] })}>
                                {t('loans.deliver')}
                              </Button>
                            </>
                          )}

                          {['DELIVERED', 'OVERDUE'].includes(loan.status) && (
                            <div className="w-full space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-sm font-medium text-slate-900">{t('loans.partialReturnHelp')}</p>
                              <div className="grid gap-2 md:grid-cols-3">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={returnDraft.returnedGoodQuantity}
                                  placeholder={t('loans.returnedGood')}
                                  onChange={(event) => updateReturnDraft(loan, { returnedGoodQuantity: event.target.value })}
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={returnDraft.returnedDamagedQuantity}
                                  placeholder={t('loans.returnedDamaged')}
                                  onChange={(event) => updateReturnDraft(loan, { returnedDamagedQuantity: event.target.value })}
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={returnDraft.lostQuantity}
                                  placeholder={t('loans.lost')}
                                  onChange={(event) => updateReturnDraft(loan, { lostQuantity: event.target.value })}
                                />
                              </div>
                              <Input
                                placeholder={t('loans.returnNotes')}
                                value={returnDraft.notes}
                                onChange={(event) => updateReturnDraft(loan, { notes: event.target.value })}
                              />
                              <Button
                                className="w-full bg-secondary text-secondary-foreground"
                                disabled={returnMutation.isPending}
                                onClick={() => returnMutation.mutate({
                                  id: loan.id,
                                  payload: {
                                    returnedGoodQuantity: Number(returnDraft.returnedGoodQuantity || 0),
                                    returnedDamagedQuantity: Number(returnDraft.returnedDamagedQuantity || 0),
                                    lostQuantity: Number(returnDraft.lostQuantity || 0),
                                    notes: returnDraft.notes || undefined,
                                  },
                                })}
                              >
                                {t('loans.return')}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <p>{t('common.quantity')}: <strong className="text-slate-950">{loan.quantity}</strong></p>
                      <p>{t('loans.pendingReturn')}: <strong className="text-slate-950">{loan.outstandingQuantity}</strong></p>
                      <p>{t('loans.returnedGood')}: <strong className="text-slate-950">{loan.returnedGoodQuantity}</strong></p>
                      <p>{t('loans.returnedDamaged')}: <strong className="text-slate-950">{loan.returnedDamagedQuantity}</strong></p>
                      <p>{t('loans.lost')}: <strong className="text-slate-950">{loan.lostQuantity}</strong></p>
                      <p>{t('loans.requestedAt')}: <strong className="text-slate-950">{formatDate(loan.requestedAt)}</strong></p>
                      <p>{t('loans.approvedAt')}: <strong className="text-slate-950">{formatDate(loan.approvedAt)}</strong></p>
                      <p>{t('loans.deliveredAt')}: <strong className="text-slate-950">{formatDate(loan.loanedAt)}</strong></p>
                      <p>{t('loans.approvedBy')}: <strong className="text-slate-950">{loan.approvedBy ?? t('common.notAvailable')}</strong></p>
                      <p>{t('loans.deliveredBy')}: <strong className="text-slate-950">{loan.deliveredBy ?? t('common.notAvailable')}</strong></p>
                      <p>{t('loans.completeReturn')}: <strong className="text-slate-950">{formatDate(loan.returnedAt)}</strong></p>
                      <p>{t('loans.returnSummary')}: <strong className="text-slate-950">{loan.returnCondition ? enumLabel('loanReturnCondition', loan.returnCondition) : t('common.notAvailable')}</strong></p>
                    </div>

                    {loan.returnNotes && (
                      <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">{t('loans.returnNotes')}</p>
                        <p className="mt-1">{loan.returnNotes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
