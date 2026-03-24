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
import type { Loan, LoanRequestItem, OptionItem } from '../types/api'

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

type LoanEditDraft = {
  dueAt: string
  loanedAt: string
  returnedAt: string
  notes: string
  returnNotes: string
}

type LoanFilters = {
  categoryId: string
  minQuantity: string
  maxQuantity: string
  fromDate: string
  toDate: string
}

const initialLoanFilters: LoanFilters = {
  categoryId: '',
  minQuantity: '',
  maxQuantity: '',
  fromDate: '',
  toDate: '',
}

function quantityWithUnit(quantity: number, unitSymbol: string) {
  return unitSymbol ? `${quantity} ${unitSymbol}` : String(quantity)
}

function matchesQuantityRange(quantity: number, filters: LoanFilters) {
  const min = filters.minQuantity ? Number(filters.minQuantity) : null
  const max = filters.maxQuantity ? Number(filters.maxQuantity) : null
  if (min !== null && quantity < min) return false
  if (max !== null && quantity > max) return false
  return true
}

function matchesDateRange(value: string | null | undefined, filters: LoanFilters) {
  if (!filters.fromDate && !filters.toDate) return true
  if (!value) return false
  const currentDate = value.slice(0, 10)
  if (filters.fromDate && currentDate < filters.fromDate) return false
  if (filters.toDate && currentDate > filters.toDate) return false
  return true
}

function filterRequests(requests: LoanRequestItem[], filters: LoanFilters) {
  return requests.filter((request) => {
    if (filters.categoryId && request.categoryId !== filters.categoryId) return false
    if (!matchesQuantityRange(request.quantity, filters)) return false
    if (!matchesDateRange(request.requestedAt, filters)) return false
    return true
  })
}

function filterLoans(loans: Loan[], filters: LoanFilters, getDate: (loan: Loan) => string | null | undefined) {
  return loans.filter((loan) => {
    if (filters.categoryId && loan.categoryId !== filters.categoryId) return false
    if (!matchesQuantityRange(loan.quantity, filters)) return false
    if (!matchesDateRange(getDate(loan), filters)) return false
    return true
  })
}

function LoanFiltersPanel({
  categories,
  filters,
  fromLabel,
  toLabel,
  onChange,
  t,
}: {
  categories: OptionItem[]
  filters: LoanFilters
  fromLabel: string
  toLabel: string
  onChange: (patch: Partial<LoanFilters>) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('items.category')}</label>
        <select className="h-11 w-full rounded-xl border border-border bg-white px-3" value={filters.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
          <option value="">{t('common.all')}</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('loans.filterMinQuantity')}</label>
        <Input type="number" min="0" step="1" value={filters.minQuantity} onChange={(event) => onChange({ minQuantity: event.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('loans.filterMaxQuantity')}</label>
        <Input type="number" min="0" step="1" value={filters.maxQuantity} onChange={(event) => onChange({ maxQuantity: event.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{fromLabel}</label>
        <Input type="date" value={filters.fromDate} onChange={(event) => onChange({ fromDate: event.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{toLabel}</label>
        <Input type="date" value={filters.toDate} onChange={(event) => onChange({ toDate: event.target.value })} />
      </div>
    </div>
  )
}

function buildDefaultReturnDraft(loan: Loan): ReturnDraft {
  return {
    returnedGoodQuantity: String(loan.outstandingQuantity || 0),
    returnedDamagedQuantity: '0',
    lostQuantity: '0',
    notes: '',
  }
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function buildLoanEditDraft(loan: Loan): LoanEditDraft {
  return {
    dueAt: toDateTimeLocalValue(loan.dueAt),
    loanedAt: toDateTimeLocalValue(loan.loanedAt),
    returnedAt: toDateTimeLocalValue(loan.returnedAt),
    notes: loan.notes ?? '',
    returnNotes: loan.returnNotes ?? '',
  }
}

export function LoansPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const canManageLoanLifecycle = isManagerOrAdmin(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationFilterId, setLocationFilterId] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({})
  const [returnDrafts, setReturnDrafts] = useState<Record<string, ReturnDraft>>({})
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null)
  const [loanEditDrafts, setLoanEditDrafts] = useState<Record<string, LoanEditDraft>>({})
  const [requestFilters, setRequestFilters] = useState<LoanFilters>(initialLoanFilters)
  const [activeFilters, setActiveFilters] = useState<LoanFilters>(initialLoanFilters)
  const [closedFilters, setClosedFilters] = useState<LoanFilters>(initialLoanFilters)
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
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const itemsQuery = useQuery({
    queryKey: ['items', 'loan-form', effectiveLocationFilter, itemSearch],
    queryFn: () => api.items({ query: itemSearch, page: 0, size: 50, stockFilter: 'IN_STOCK', locationId: effectiveLocationFilter }),
  })
  const loanRequestsQuery = useQuery({ queryKey: ['loan-requests', effectiveLocationFilter], queryFn: () => api.loanRequests(effectiveLocationFilter) })
  const loansQuery = useQuery({ queryKey: ['loans', effectiveLocationFilter], queryFn: () => api.loans(effectiveLocationFilter) })

  const availableItems = itemsQuery.data?.content.filter((item) => ['LENDABLE', 'HYBRID'].includes(item.type) && item.availableStock > 0) ?? []
  const requestItems = useMemo(
    () => filterRequests((loanRequestsQuery.data ?? []).filter((request) => request.status === 'PENDING'), requestFilters),
    [loanRequestsQuery.data, requestFilters],
  )
  const activeLoans = useMemo(
    () => filterLoans(
      (loansQuery.data ?? []).filter((loan) => ['APPROVED', 'DELIVERED', 'OVERDUE'].includes(loan.status)),
      activeFilters,
      (loan) => loan.dueAt,
    ),
    [activeFilters, loansQuery.data],
  )
  const closedLoans = useMemo(
    () => filterLoans(
      (loansQuery.data ?? []).filter((loan) => ['RETURNED', 'REJECTED', 'CANCELLED'].includes(loan.status)),
      closedFilters,
      (loan) => loan.returnedAt ?? loan.dueAt,
    ),
    [closedFilters, loansQuery.data],
  )

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.createLoanRequest({
        ...values,
        dueAt: new Date(values.dueAt).toISOString(),
      }),
    onSuccess: async () => {
      reset({ borrowerId: '', itemId: '', quantity: 1, dueAt: '', notes: '' })
      setItemSearch('')
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

  const updateLoanMutation = useMutation({
    mutationFn: ({ id, loan, draft }: { id: string; loan: Loan; draft: LoanEditDraft }) => api.updateLoan(id, {
      dueAt: new Date(draft.dueAt).toISOString(),
      loanedAt: loan.status === 'APPROVED' ? null : new Date(draft.loanedAt).toISOString(),
      returnedAt: loan.status === 'RETURNED' ? new Date(draft.returnedAt).toISOString() : null,
      notes: draft.notes || undefined,
      returnNotes: loan.status === 'RETURNED' ? draft.returnNotes || undefined : undefined,
    }),
    onSuccess: async (_, variables) => {
      setEditingLoanId((current) => current === variables.id ? null : current)
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const getReturnDraft = (loan: Loan) => returnDrafts[loan.id] ?? buildDefaultReturnDraft(loan)
  const getLoanEditDraft = (loan: Loan) => loanEditDrafts[loan.id] ?? buildLoanEditDraft(loan)

  const updateReturnDraft = (loan: Loan, patch: Partial<ReturnDraft>) => {
    setReturnDrafts((current) => ({
      ...current,
      [loan.id]: {
        ...getReturnDraft(loan),
        ...patch,
      },
    }))
  }

  const updateLoanDraft = (loan: Loan, patch: Partial<LoanEditDraft>) => {
    setLoanEditDrafts((current) => ({
      ...current,
      [loan.id]: {
        ...getLoanEditDraft(loan),
        ...patch,
      },
    }))
  }

  const startEditingLoan = (loan: Loan) => {
    setLoanEditDrafts((current) => ({
      ...current,
      [loan.id]: getLoanEditDraft(loan),
    }))
    setEditingLoanId(loan.id)
  }

  const cancelEditingLoan = (loanId: string) => {
    setEditingLoanId((current) => current === loanId ? null : current)
    setLoanEditDrafts((current) => {
      const next = { ...current }
      delete next[loanId]
      return next
    })
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
      {updateLoanMutation.isError && <Notice variant="error">{updateLoanMutation.error.message}</Notice>}
      {updateLoanMutation.isSuccess && <Notice variant="success">{t('loans.successEdit')}</Notice>}

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

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('movements.itemSearch')}</label>
              <Input
                value={itemSearch}
                placeholder={t('movements.itemSearchPlaceholder')}
                onChange={(event) => setItemSearch(event.target.value)}
              />
              <p className="text-xs text-slate-500">{t('movements.itemSearchHelp')}</p>
            </div>

            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
              <option value="">{t('loans.selectItem')}</option>
              {availableItems.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.sku} - {item.primaryLocation}</option>)}
            </select>
            {errors.itemId && <p className="text-sm text-red-600">{errors.itemId.message}</p>}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.quantity')}</label>
              <Input type="number" min="1" step="1" {...register('quantity')} />
            </div>
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('loans.dueField')}</label>
              <Input type="datetime-local" {...register('dueAt')} />
              <p className="text-xs text-slate-500">{t('loans.dueHelp')}</p>
            </div>
            {errors.dueAt && <p className="text-sm text-red-600">{errors.dueAt.message}</p>}

            <Input placeholder={t('common.notes')} {...register('notes')} />

            <Button className="w-full" disabled={createMutation.isPending || !borrowersQuery.data?.length || !availableItems.length} type="submit">
              {t('loans.createRequest')}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('loans.requests')}</h2>
              <p className="text-sm text-slate-600">{t('loans.requestsSummary', { count: requestItems.length })}</p>
            </div>
            <LoanFiltersPanel
              categories={categoriesQuery.data ?? []}
              filters={requestFilters}
              fromLabel={t('loans.requestedFrom')}
              toLabel={t('loans.requestedTo')}
              onChange={(patch) => setRequestFilters((current) => ({ ...current, ...patch }))}
              t={t}
            />
            <div className="space-y-3">
              {requestItems.length ? requestItems.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{request.borrowerName} - {request.itemName}</p>
                      <p className="text-sm text-slate-500">{request.categoryName} - {request.locationName}</p>
                      <p className="text-sm text-slate-500">{t('common.quantity')} {quantityWithUnit(request.quantity, request.unitSymbol)} - {t('loans.dueLabel')} {formatDate(request.dueAt)}</p>
                      <p className="text-sm text-slate-500">{t('loans.requestedAt')} {formatDate(request.requestedAt)}</p>
                      {request.notes && <p className="mt-2 text-sm text-slate-600">{request.notes}</p>}
                    </div>
                    {canManageLoanLifecycle && (
                      <Button disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(request.id)}>
                        {t('loans.approve')}
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{enumLabel('loanRequestStatus', request.status)}</p>
                </div>
              )) : <Notice>{t('loans.noRequests')}</Notice>}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('loans.active')}</h2>
              <p className="text-sm text-slate-600">{t('loans.activeSummary', { count: activeLoans.length })}</p>
            </div>
            <LoanFiltersPanel
              categories={categoriesQuery.data ?? []}
              filters={activeFilters}
              fromLabel={t('loans.dueFrom')}
              toLabel={t('loans.dueTo')}
              onChange={(patch) => setActiveFilters((current) => ({ ...current, ...patch }))}
              t={t}
            />
            <div className="space-y-4">
              {activeLoans.length ? activeLoans.map((loan) => {
                const returnDraft = getReturnDraft(loan)
                const loanEditDraft = getLoanEditDraft(loan)
                const isEditingLoan = editingLoanId === loan.id
                const canEditLoan = canManageLoanLifecycle && ['APPROVED', 'DELIVERED', 'OVERDUE', 'RETURNED'].includes(loan.status)
                return (
                  <div key={loan.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{loan.borrowerName} - {loan.itemName}</p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{enumLabel('loanStatus', loan.status)}</span>
                        </div>
                        <p className="text-sm text-slate-500">{loan.categoryName} - {loan.locationName}</p>
                        <p className="text-sm text-slate-600">{workflowMessage(loan)}</p>
                        <p className="text-sm text-slate-500">{t('common.quantity')} {quantityWithUnit(loan.quantity, loan.unitSymbol)} - {t('loans.dueLabel')} {formatDate(loan.dueAt)}</p>
                        {loan.notes && <p className="text-sm text-slate-600">{loan.notes}</p>}
                      </div>

                      {canManageLoanLifecycle && (
                        <div className="flex w-full max-w-md flex-col gap-3 md:items-end">
                          {canEditLoan && !isEditingLoan && (
                            <Button className="bg-secondary text-secondary-foreground" onClick={() => startEditingLoan(loan)}>
                              {t('loans.editLoan')}
                            </Button>
                          )}

                          {canEditLoan && isEditingLoan && (
                            <div className="w-full space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-medium text-slate-900">{t('loans.editLoan')}</p>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editDueAt')}</label>
                                <Input
                                  type="datetime-local"
                                  value={loanEditDraft.dueAt}
                                  onChange={(event) => updateLoanDraft(loan, { dueAt: event.target.value })}
                                />
                              </div>

                              {loan.status !== 'APPROVED' && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('loans.editLoanedAt')}</label>
                                  <Input
                                    type="datetime-local"
                                    value={loanEditDraft.loanedAt}
                                    onChange={(event) => updateLoanDraft(loan, { loanedAt: event.target.value })}
                                  />
                                </div>
                              )}

                              {loan.status === 'RETURNED' && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('loans.editReturnedAt')}</label>
                                  <Input
                                    type="datetime-local"
                                    value={loanEditDraft.returnedAt}
                                    onChange={(event) => updateLoanDraft(loan, { returnedAt: event.target.value })}
                                  />
                                </div>
                              )}

                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editNotes')}</label>
                                <Input
                                  value={loanEditDraft.notes}
                                  onChange={(event) => updateLoanDraft(loan, { notes: event.target.value })}
                                />
                              </div>

                              {loan.status === 'RETURNED' && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('loans.editReturnNotes')}</label>
                                  <Input
                                    value={loanEditDraft.returnNotes}
                                    onChange={(event) => updateLoanDraft(loan, { returnNotes: event.target.value })}
                                  />
                                </div>
                              )}

                              <p className="text-xs text-slate-500">{t(`loans.editHelp.${loan.status}`)}</p>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  disabled={
                                    updateLoanMutation.isPending
                                    || !loanEditDraft.dueAt
                                    || (loan.status !== 'APPROVED' && !loanEditDraft.loanedAt)
                                    || (loan.status === 'RETURNED' && !loanEditDraft.returnedAt)
                                  }
                                  onClick={() => updateLoanMutation.mutate({ id: loan.id, loan, draft: loanEditDraft })}
                                >
                                  {t('loans.saveLoan')}
                                </Button>
                                <Button className="bg-secondary text-secondary-foreground" onClick={() => cancelEditingLoan(loan.id)}>
                                  {t('common.cancel')}
                                </Button>
                              </div>
                            </div>
                          )}

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
                      <p>{t('common.quantity')}: <strong className="text-slate-950">{quantityWithUnit(loan.quantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.pendingReturn')}: <strong className="text-slate-950">{quantityWithUnit(loan.outstandingQuantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.returnedGood')}: <strong className="text-slate-950">{quantityWithUnit(loan.returnedGoodQuantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.returnedDamaged')}: <strong className="text-slate-950">{quantityWithUnit(loan.returnedDamagedQuantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.lost')}: <strong className="text-slate-950">{quantityWithUnit(loan.lostQuantity, loan.unitSymbol)}</strong></p>
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
              }) : <Notice>{t('loans.noActive')}</Notice>}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('loans.closed')}</h2>
              <p className="text-sm text-slate-600">{t('loans.closedSummary', { count: closedLoans.length })}</p>
            </div>
            <LoanFiltersPanel
              categories={categoriesQuery.data ?? []}
              filters={closedFilters}
              fromLabel={t('loans.closedFrom')}
              toLabel={t('loans.closedTo')}
              onChange={(patch) => setClosedFilters((current) => ({ ...current, ...patch }))}
              t={t}
            />
            <div className="space-y-4">
              {closedLoans.length ? closedLoans.map((loan) => {
                const loanEditDraft = getLoanEditDraft(loan)
                const isEditingLoan = editingLoanId === loan.id
                const canEditLoan = canManageLoanLifecycle && loan.status === 'RETURNED'
                return (
                  <div key={loan.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{loan.borrowerName} - {loan.itemName}</p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{enumLabel('loanStatus', loan.status)}</span>
                        </div>
                        <p className="text-sm text-slate-500">{loan.categoryName} - {loan.locationName}</p>
                        <p className="text-sm text-slate-500">{t('common.quantity')} {quantityWithUnit(loan.quantity, loan.unitSymbol)}</p>
                        {loan.notes && <p className="text-sm text-slate-600">{loan.notes}</p>}
                      </div>

                      {canEditLoan && (
                        <div className="flex w-full max-w-md flex-col gap-3 md:items-end">
                          {!isEditingLoan && (
                            <Button className="bg-secondary text-secondary-foreground" onClick={() => startEditingLoan(loan)}>
                              {t('loans.editLoan')}
                            </Button>
                          )}

                          {isEditingLoan && (
                            <div className="w-full space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-medium text-slate-900">{t('loans.editLoan')}</p>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editDueAt')}</label>
                                <Input type="datetime-local" value={loanEditDraft.dueAt} onChange={(event) => updateLoanDraft(loan, { dueAt: event.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editLoanedAt')}</label>
                                <Input type="datetime-local" value={loanEditDraft.loanedAt} onChange={(event) => updateLoanDraft(loan, { loanedAt: event.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editReturnedAt')}</label>
                                <Input type="datetime-local" value={loanEditDraft.returnedAt} onChange={(event) => updateLoanDraft(loan, { returnedAt: event.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editNotes')}</label>
                                <Input value={loanEditDraft.notes} onChange={(event) => updateLoanDraft(loan, { notes: event.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('loans.editReturnNotes')}</label>
                                <Input value={loanEditDraft.returnNotes} onChange={(event) => updateLoanDraft(loan, { returnNotes: event.target.value })} />
                              </div>
                              <p className="text-xs text-slate-500">{t(`loans.editHelp.${loan.status}`)}</p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  disabled={updateLoanMutation.isPending || !loanEditDraft.dueAt || !loanEditDraft.loanedAt || !loanEditDraft.returnedAt}
                                  onClick={() => updateLoanMutation.mutate({ id: loan.id, loan, draft: loanEditDraft })}
                                >
                                  {t('loans.saveLoan')}
                                </Button>
                                <Button className="bg-secondary text-secondary-foreground" onClick={() => cancelEditingLoan(loan.id)}>
                                  {t('common.cancel')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <p>{t('loans.requestedAt')}: <strong className="text-slate-950">{formatDate(loan.requestedAt)}</strong></p>
                      <p>{t('loans.approvedAt')}: <strong className="text-slate-950">{formatDate(loan.approvedAt)}</strong></p>
                      <p>{t('loans.deliveredAt')}: <strong className="text-slate-950">{formatDate(loan.loanedAt)}</strong></p>
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
              }) : <Notice>{t('loans.noClosed')}</Notice>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
