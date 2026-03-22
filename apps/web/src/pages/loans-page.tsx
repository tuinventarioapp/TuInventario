import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

type FormValues = {
  borrowerId: string
  itemId: string
  quantity: number
  dueAt: string
  notes?: string
}

export function LoansPage() {
  const { t, enumLabel } = useI18n()
  const schema = z.object({
    borrowerId: z.string().min(1, t('validation.required')),
    itemId: z.string().min(1, t('validation.required')),
    quantity: z.coerce.number().positive(t('validation.quantity')),
    dueAt: z.string().min(1, t('validation.date')),
    notes: z.string().optional(),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  })

  const borrowersQuery = useQuery({ queryKey: ['borrowers'], queryFn: api.borrowers })
  const itemsQuery = useQuery({ queryKey: ['items', 'loan-form'], queryFn: () => api.items('', 0, 50) })
  const loanRequestsQuery = useQuery({ queryKey: ['loan-requests'], queryFn: api.loanRequests })
  const loansQuery = useQuery({ queryKey: ['loans'], queryFn: api.loans })

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
    mutationFn: api.deliverLoan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.returnLoan(id, { returnCondition: 'GOOD', notes: 'Return registered from the app.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('loans.title')} description={t('loans.description')} />

      {createMutation.isError && <Notice variant="error">{createMutation.error.message}</Notice>}
      {createMutation.isSuccess && <Notice variant="success">{t('loans.successRequest')}</Notice>}
      {approveMutation.isError && <Notice variant="error">{approveMutation.error.message}</Notice>}
      {deliverMutation.isError && <Notice variant="error">{deliverMutation.error.message}</Notice>}
      {returnMutation.isError && <Notice variant="error">{returnMutation.error.message}</Notice>}

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
              {availableItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{request.borrowerName} - {request.itemName}</p>
                      <p className="text-sm text-slate-500">{t('common.quantity')} {request.quantity} - {t('loans.dueLabel')} {formatDate(request.dueAt)}</p>
                    </div>
                    <Button disabled={request.status !== 'PENDING' || approveMutation.isPending} onClick={() => approveMutation.mutate(request.id)}>
                      {t('loans.approve')}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{enumLabel('loanRequestStatus', request.status)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">{t('loans.activeAndClosed')}</h2>
            <div className="mt-4 space-y-3">
              {loansQuery.data?.map((loan) => (
                <div key={loan.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{loan.borrowerName} - {loan.itemName}</p>
                      <p className="text-sm text-slate-500">{enumLabel('loanStatus', loan.status)} - {t('loans.dueLabel')} {formatDate(loan.dueAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button disabled={loan.status !== 'APPROVED' || deliverMutation.isPending} onClick={() => deliverMutation.mutate(loan.id)}>{t('loans.deliver')}</Button>
                      <Button className="bg-secondary text-secondary-foreground" disabled={!['DELIVERED', 'OVERDUE'].includes(loan.status) || returnMutation.isPending} onClick={() => returnMutation.mutate(loan.id)}>{t('loans.return')}</Button>
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
