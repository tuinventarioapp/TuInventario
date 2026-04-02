import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { MobileDisclosure } from '../components/shared/mobile-disclosure'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useIsMobile } from '../hooks/use-is-mobile'
import { useI18n } from '../i18n/use-i18n'
import { isAdmin, isBorrower, isManagerOrAdmin } from '../lib/access'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth-store'
import type { BorrowerLoanGroup, Loan, LoanRequestItem, OptionItem } from '../types/api'

type FormValues = {
  borrowerId: string
  itemId: string
  quantity: number
  dueAt: string
  notes?: string
}

type ReturnDraft = {
  returnedQuantity: string
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

type LoanSection = 'requests' | 'active' | 'closed'

type BorrowerReviewDraft = {
  decision: 'APPROVE' | 'REJECT'
  approvedQuantity: string
  rejectionReason: string
}

type BorrowerReturnDraft = {
  returnedQuantity: string
  notes: string
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
    returnedQuantity: String(loan.outstandingQuantity || 0),
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

function borrowerGroupStatusLabel(
  status: string,
  enumLabel: (namespace: string, value?: string | null) => string,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (status === 'PARTIALLY_APPROVED') return t('borrower.partiallyApproved')
  if (status === 'RETURNED') return enumLabel('loanStatus', 'RETURNED')
  if (status === 'REJECTED') return enumLabel('loanRequestStatus', 'REJECTED')
  if (status === 'PENDING') return enumLabel('loanRequestStatus', 'PENDING')
  return enumLabel('loanStatus', status)
}

export function LoansPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isPhone = useIsMobile()
  const borrowerOnly = isBorrower(user?.role)
  const showBorrowerOperatorBeta = false
  const canManageLoanLifecycle = isManagerOrAdmin(user?.role)
  const isGlobalAdmin = isAdmin(user?.role)
  const [locationFilterId, setLocationFilterId] = useState('')
  const [borrowerSearch, setBorrowerSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [rejectingRequest, setRejectingRequest] = useState<LoanRequestItem | null>(null)
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({})
  const [returnDrafts, setReturnDrafts] = useState<Record<string, ReturnDraft>>({})
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null)
  const [loanEditDrafts, setLoanEditDrafts] = useState<Record<string, LoanEditDraft>>({})
  const [requestFilters, setRequestFilters] = useState<LoanFilters>(initialLoanFilters)
  const [activeFilters, setActiveFilters] = useState<LoanFilters>(initialLoanFilters)
  const [closedFilters, setClosedFilters] = useState<LoanFilters>(initialLoanFilters)
  const [activeSection, setActiveSection] = useState<LoanSection>('requests')
  const [borrowerReviewDrafts, setBorrowerReviewDrafts] = useState<Record<string, BorrowerReviewDraft>>({})
  const [borrowerReturnDrafts, setBorrowerReturnDrafts] = useState<Record<string, Record<string, BorrowerReturnDraft>>>({})
  const [reviewingBorrowerGroup, setReviewingBorrowerGroup] = useState<BorrowerLoanGroup | null>(null)
  const [returningBorrowerGroup, setReturningBorrowerGroup] = useState<BorrowerLoanGroup | null>(null)
  const schema = useMemo(() => z.object({
    borrowerId: z.string().min(1, t('validation.required')),
    itemId: z.string().min(1, t('validation.required')),
    quantity: z.coerce.number().positive(t('validation.quantity')),
    dueAt: z.string().min(1, t('validation.date')),
    notes: z.string().optional(),
  }), [t])

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  })

  const effectiveLocationFilter = isGlobalAdmin ? locationFilterId || undefined : user?.assignedLocationId ?? undefined
  const borrowersQuery = useQuery({
    queryKey: ['borrowers', borrowerSearch],
    queryFn: () => api.borrowers(borrowerSearch),
  })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const unitsQuery = useQuery({ queryKey: ['units'], queryFn: api.units })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: api.locations })
  const itemsQuery = useQuery({
    queryKey: ['items', 'loan-form', effectiveLocationFilter, itemSearch],
    queryFn: () => api.items({ query: itemSearch, page: 0, size: 50, stockFilter: 'IN_STOCK', locationId: effectiveLocationFilter }),
  })
  const loanRequestsQuery = useQuery({ queryKey: ['loan-requests', effectiveLocationFilter], queryFn: () => api.loanRequests(effectiveLocationFilter) })
  const loansQuery = useQuery({ queryKey: ['loans', effectiveLocationFilter], queryFn: () => api.loans(effectiveLocationFilter) })
  const borrowerGroupsQuery = useQuery({
    queryKey: [borrowerOnly ? 'borrower-loan-requests-mine' : 'borrower-loan-requests', effectiveLocationFilter, borrowerOnly],
    queryFn: () => borrowerOnly ? api.myBorrowerLoanRequests() : api.borrowerLoanRequests(effectiveLocationFilter),
    enabled: borrowerOnly || canManageLoanLifecycle,
  })

  const availableItems = itemsQuery.data?.content.filter((item) => ['LENDABLE', 'HYBRID'].includes(item.type) && item.availableStock > 0) ?? []
  const selectedItemId = useWatch({ control, name: 'itemId' })
  const selectedRequestedItem = availableItems.find((item) => item.id === selectedItemId)
  const selectedRequestedUnit = unitsQuery.data?.find((option) => option.id === selectedRequestedItem?.unitId)
  const requestedQuantityStep = selectedRequestedUnit?.details === 'true' ? '0.01' : '1'
  const groupedLoanRequestIds = useMemo(
    () => new Set((borrowerGroupsQuery.data ?? []).flatMap((group) => group.items.map((item) => item.loanRequestId))),
    [borrowerGroupsQuery.data],
  )
  const groupedLoanIds = useMemo(
    () => new Set(
      (borrowerGroupsQuery.data ?? [])
        .flatMap((group) => group.items.map((item) => item.loanId).filter((loanId): loanId is string => Boolean(loanId))),
    ),
    [borrowerGroupsQuery.data],
  )
  const requestItems = useMemo(
    () => filterRequests(
      (loanRequestsQuery.data ?? []).filter((request) => request.status === 'PENDING' && !groupedLoanRequestIds.has(request.id)),
      requestFilters,
    ),
    [groupedLoanRequestIds, loanRequestsQuery.data, requestFilters],
  )
  const activeLoans = useMemo(
    () => filterLoans(
      (loansQuery.data ?? []).filter((loan) => ['APPROVED', 'DELIVERED', 'OVERDUE'].includes(loan.status) && !groupedLoanIds.has(loan.id)),
      activeFilters,
      (loan) => loan.dueAt,
    ),
    [activeFilters, groupedLoanIds, loansQuery.data],
  )
  const closedLoans = useMemo(
    () => filterLoans(
      (loansQuery.data ?? []).filter((loan) => ['RETURNED', 'REJECTED', 'CANCELLED'].includes(loan.status) && !groupedLoanIds.has(loan.id)),
      closedFilters,
      (loan) => loan.returnedAt ?? loan.dueAt,
    ),
    [closedFilters, groupedLoanIds, loansQuery.data],
  )
  const borrowerPendingGroups = useMemo(
    () => (borrowerGroupsQuery.data ?? []).filter((group) => group.status === 'PENDING'),
    [borrowerGroupsQuery.data],
  )
  const borrowerOperationalGroups = useMemo(
    () => (borrowerGroupsQuery.data ?? []).filter((group) => group.status !== 'PENDING'),
    [borrowerGroupsQuery.data],
  )
  const operatorBorrowerPendingGroups = borrowerOnly ? [] : borrowerPendingGroups
  const operatorBorrowerActiveGroups = useMemo(
    () => (borrowerOnly ? [] : borrowerOperationalGroups.filter((group) => ['APPROVED', 'PARTIALLY_APPROVED', 'DELIVERED', 'OVERDUE'].includes(group.status))),
    [borrowerOnly, borrowerOperationalGroups],
  )
  const operatorBorrowerClosedGroups = useMemo(
    () => (borrowerOnly ? [] : borrowerOperationalGroups.filter((group) => ['RETURNED', 'REJECTED'].includes(group.status))),
    [borrowerOnly, borrowerOperationalGroups],
  )
  const requestSectionCount = requestItems.length + operatorBorrowerPendingGroups.length
  const activeSectionCount = activeLoans.length + operatorBorrowerActiveGroups.length
  const closedSectionCount = closedLoans.length + operatorBorrowerClosedGroups.length

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.createLoanRequest({
        ...values,
        dueAt: new Date(values.dueAt).toISOString(),
      }),
    onSuccess: async () => {
      reset({ borrowerId: '', itemId: '', quantity: 1, dueAt: '', notes: '' })
      setBorrowerSearch('')
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

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => api.rejectLoanRequest(id, { notes }),
    onSuccess: async () => {
      setRejectingRequest(null)
      setRejectionReasonDraft('')
      await queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
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
    mutationFn: ({ id, payload }: { id: string; payload: { returnedQuantity: number; notes?: string } }) =>
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
  const reviewBorrowerGroupMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: unknown }) => api.reviewBorrowerLoanRequest(groupId, payload),
    onSuccess: async () => {
      setBorrowerReviewDrafts({})
      setReviewingBorrowerGroup(null)
      await queryClient.invalidateQueries({ queryKey: ['borrower-loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['borrower-loan-requests-mine'] })
      await queryClient.invalidateQueries({ queryKey: ['loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deliverBorrowerGroupMutation = useMutation({
    mutationFn: ({ groupId, notes }: { groupId: string; notes?: string }) => api.deliverBorrowerLoanGroup(groupId, { notes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['borrower-loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['borrower-loan-requests-mine'] })
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const returnBorrowerGroupMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: unknown }) => api.returnBorrowerLoanGroup(groupId, payload),
    onSuccess: async (_, variables) => {
      setBorrowerReturnDrafts((current) => {
        const next = { ...current }
        delete next[variables.groupId]
        return next
      })
      setReturningBorrowerGroup(null)
      await queryClient.invalidateQueries({ queryKey: ['borrower-loan-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['borrower-loan-requests-mine'] })
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
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

  const openRejectDialog = (request: LoanRequestItem) => {
    setRejectingRequest(request)
    setRejectionReasonDraft('')
  }

  const closeRejectDialog = () => {
    if (rejectMutation.isPending) return
    setRejectingRequest(null)
    setRejectionReasonDraft('')
  }

  const getBorrowerReviewDraft = (group: BorrowerLoanGroup, itemId: string): BorrowerReviewDraft => {
    const existing = borrowerReviewDrafts[itemId]
    if (existing) return existing
    const line = group.items.find((entry) => entry.loanRequestId === itemId)
    return {
      decision: 'APPROVE',
      approvedQuantity: String(line?.requestedQuantity ?? 1),
      rejectionReason: '',
    }
  }

  const updateBorrowerReviewDraft = (loanRequestId: string, patch: Partial<BorrowerReviewDraft>) => {
    setBorrowerReviewDrafts((current) => ({
      ...current,
      [loanRequestId]: {
        decision: current[loanRequestId]?.decision ?? 'APPROVE',
        approvedQuantity: current[loanRequestId]?.approvedQuantity ?? '1',
        rejectionReason: current[loanRequestId]?.rejectionReason ?? '',
        ...patch,
      },
    }))
  }

  const getBorrowerReturnDraft = (groupId: string, loanId: string, requestedQuantity: number): BorrowerReturnDraft => {
    return borrowerReturnDrafts[groupId]?.[loanId] ?? {
      returnedQuantity: String(requestedQuantity),
      notes: '',
    }
  }

  const updateBorrowerReturnDraft = (groupId: string, loanId: string, patch: Partial<BorrowerReturnDraft>, requestedQuantity: number) => {
    setBorrowerReturnDrafts((current) => ({
      ...current,
      [groupId]: {
        ...(current[groupId] ?? {}),
        [loanId]: {
          ...getBorrowerReturnDraft(groupId, loanId, requestedQuantity),
          ...patch,
        },
      },
    }))
  }

  if (borrowerOnly) {
    const dueSoonGroups = borrowerOperationalGroups.filter((group) => group.dueSoon)
    const activeBorrowerGroups = borrowerOperationalGroups.filter((group) => ['APPROVED', 'PARTIALLY_APPROVED', 'DELIVERED', 'OVERDUE'].includes(group.status))
    const historyBorrowerGroups = borrowerOperationalGroups.filter((group) => ['RETURNED', 'REJECTED'].includes(group.status))

    return (
      <div className="space-y-6">
        <PageHeader title={t('loans.title')} description={t('borrower.loansDescription')} />
        {dueSoonGroups.map((group) => (
          <Notice key={group.id} variant="warning">
            {t('borrower.dueSoonNotice', { borrower: group.borrowerName, dueAt: formatDate(group.dueAt) })}
          </Notice>
        ))}
        {!dueSoonGroups.length && user?.assignedLocationName && <Notice>{t('borrower.scopeNotice', { location: user.assignedLocationName })}</Notice>}

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t('borrower.pendingRequests')}</h2>
            <p className="text-sm text-slate-600">{t('borrower.pendingRequestsHelp')}</p>
          </div>
          {borrowerPendingGroups.length ? borrowerPendingGroups.map((group) => (
            <BorrowerGroupCard key={group.id} enumLabel={enumLabel} group={group} t={t} />
          )) : <Notice>{t('borrower.noPendingRequests')}</Notice>}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t('borrower.activeLoansTitle')}</h2>
            <p className="text-sm text-slate-600">{t('borrower.activeLoansHelp')}</p>
          </div>
          {activeBorrowerGroups.length ? activeBorrowerGroups.map((group) => (
            <BorrowerGroupCard key={group.id} enumLabel={enumLabel} group={group} t={t} />
          )) : <Notice>{t('borrower.noActiveLoans')}</Notice>}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t('borrower.historyTitle')}</h2>
            <p className="text-sm text-slate-600">{t('borrower.historyHelp')}</p>
          </div>
          {historyBorrowerGroups.length ? historyBorrowerGroups.map((group) => (
            <BorrowerGroupCard key={group.id} enumLabel={enumLabel} group={group} t={t} />
          )) : <Notice>{t('borrower.noHistory')}</Notice>}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('loans.title')} description={t('loans.description')} />

      {createMutation.isError && <Notice variant="error">{createMutation.error.message}</Notice>}
      {createMutation.isSuccess && <Notice variant="success">{t('loans.successRequest')}</Notice>}
      {approveMutation.isError && <Notice variant="error">{approveMutation.error.message}</Notice>}
      {approveMutation.isSuccess && <Notice variant="success">{t('loans.successApproval')}</Notice>}
      {rejectMutation.isError && <Notice variant="error">{rejectMutation.error.message}</Notice>}
      {rejectMutation.isSuccess && <Notice variant="success">{t('loans.successRejection')}</Notice>}
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

      {showBorrowerOperatorBeta && (
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('borrower.managerSectionTitle')}</h2>
          <p className="text-sm text-slate-600">{t('borrower.managerSectionHelp')}</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{t('borrower.pendingRequests')}</h3>
            {borrowerPendingGroups.length ? borrowerPendingGroups.map((group) => (
              <div key={group.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{group.borrowerName}</p>
                    <p className="text-sm text-slate-500">{group.locationName} - {formatDate(group.dueAt)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{group.items.length} {t('borrower.lines')}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => {
                    const draft = getBorrowerReviewDraft(group, item.loanRequestId)
                    return (
                      <div key={item.loanRequestId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-medium text-slate-950">{item.itemName}</p>
                            <p className="text-sm text-slate-500">{item.categoryName}</p>
                            <p className="text-sm text-slate-600">{t('borrower.requestedQuantity')}: {quantityWithUnit(item.requestedQuantity, item.unitSymbol)}</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[380px]">
                            <select className="h-11 rounded-xl border border-border bg-white px-3" value={draft.decision} onChange={(event) => updateBorrowerReviewDraft(item.loanRequestId, { decision: event.target.value as BorrowerReviewDraft['decision'] })}>
                              <option value="APPROVE">{t('loans.approve')}</option>
                              <option value="REJECT">{t('loans.reject')}</option>
                            </select>
                            {draft.decision === 'APPROVE' ? (
                              <Input value={draft.approvedQuantity} onChange={(event) => updateBorrowerReviewDraft(item.loanRequestId, { approvedQuantity: event.target.value })} />
                            ) : (
                              <Input value={draft.rejectionReason} onChange={(event) => updateBorrowerReviewDraft(item.loanRequestId, { rejectionReason: event.target.value })} />
                            )}
                            <div className="flex items-center text-xs text-slate-500">
                              {draft.decision === 'APPROVE'
                                ? t('borrower.approveHelp', { unit: item.unitSymbol || t('common.quantity') })
                                : t('borrower.rejectHelp')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    disabled={reviewBorrowerGroupMutation.isPending}
                    onClick={() => reviewBorrowerGroupMutation.mutate({
                      groupId: group.id,
                      payload: {
                        items: group.items.map((item) => {
                          const draft = getBorrowerReviewDraft(group, item.loanRequestId)
                          return {
                            loanRequestId: item.loanRequestId,
                            decision: draft.decision,
                            approvedQuantity: draft.decision === 'APPROVE' ? Number(draft.approvedQuantity) : undefined,
                            rejectionReason: draft.decision === 'REJECT' ? draft.rejectionReason : undefined,
                          }
                        }),
                      },
                    })}
                  >
                    {t('borrower.reviewRequest')}
                  </Button>
                </div>
              </div>
            )) : <Notice>{t('borrower.noPendingRequests')}</Notice>}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{t('borrower.managerOperationalTitle')}</h3>
            {borrowerOperationalGroups.length ? borrowerOperationalGroups.map((group) => {
              const canDeliverGroup = ['APPROVED', 'PARTIALLY_APPROVED'].includes(group.status)
              const canReturnGroup = ['DELIVERED', 'OVERDUE'].includes(group.status)
              return (
                <div key={group.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{group.borrowerName}</p>
                      <p className="text-sm text-slate-500">{group.locationName} - {formatDate(group.dueAt)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{borrowerGroupStatusLabel(group.status, enumLabel, t)}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => {
                      const returnDraft = item.loanId ? getBorrowerReturnDraft(group.id, item.loanId, item.outstandingQuantity || item.approvedQuantity) : null
                      return (
                        <div key={item.loanRequestId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-medium text-slate-950">{item.itemName}</p>
                              <p className="text-sm text-slate-600">{t('borrower.requestedQuantity')}: {quantityWithUnit(item.requestedQuantity, item.unitSymbol)}</p>
                              <p className="text-sm text-slate-600">{t('borrower.approvedQuantity')}: {quantityWithUnit(item.approvedQuantity, item.unitSymbol)}</p>
                              <p className="text-sm text-slate-600">{t('borrower.returnedQuantityLabel')}: {quantityWithUnit(item.returnedQuantity, item.unitSymbol)}</p>
                              {item.rejectionReason && <p className="text-sm text-rose-600">{item.rejectionReason}</p>}
                            </div>
                            {canReturnGroup && item.loanId && returnDraft ? (
                              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                                <Input value={returnDraft.returnedQuantity} onChange={(event) => updateBorrowerReturnDraft(group.id, item.loanId!, { returnedQuantity: event.target.value }, item.outstandingQuantity || item.approvedQuantity)} />
                                <Input value={returnDraft.notes} onChange={(event) => updateBorrowerReturnDraft(group.id, item.loanId!, { notes: event.target.value }, item.outstandingQuantity || item.approvedQuantity)} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {canDeliverGroup && (
                      <Button disabled={deliverBorrowerGroupMutation.isPending} onClick={() => deliverBorrowerGroupMutation.mutate({ groupId: group.id })}>
                        {t('loans.deliver')}
                      </Button>
                    )}
                    {canReturnGroup && (
                      <Button
                        disabled={returnBorrowerGroupMutation.isPending}
                        onClick={() => returnBorrowerGroupMutation.mutate({
                          groupId: group.id,
                          payload: {
                            items: group.items
                              .filter((item) => item.loanId)
                              .map((item) => {
                                const draft = getBorrowerReturnDraft(group.id, item.loanId!, item.outstandingQuantity || item.approvedQuantity)
                                return {
                                  loanId: item.loanId,
                                  returnedQuantity: Number(draft.returnedQuantity),
                                  notes: draft.notes || undefined,
                                }
                              }),
                          },
                        })}
                      >
                        {t('loans.return')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            }) : <Notice>{t('borrower.noOperationalLoans')}</Notice>}
          </div>
        </div>
      </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <MobileDisclosure
            defaultOpen
            description={t('loans.description')}
            isMobile={isPhone}
            title={t('loans.newRequest')}
          >
            <form className="space-y-4" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
              {!borrowersQuery.data?.length && <Notice variant="warning">{t('loans.emptyBorrowers')}</Notice>}
              {!availableItems.length && <Notice variant="warning">{t('loans.emptyItems')}</Notice>}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('loans.borrowerSearch')}</label>
                <Input
                  value={borrowerSearch}
                  placeholder={t('loans.borrowerSearchPlaceholder')}
                  onChange={(event) => setBorrowerSearch(event.target.value)}
                />
                <p className="text-xs text-slate-500">{t('loans.borrowerSearchHelp')}</p>
              </div>

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
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.sku} - {quantityWithUnit(item.availableStock, item.unit)} - {item.primaryLocation}
                  </option>
                ))}
              </select>
              {errors.itemId && <p className="text-sm text-red-600">{errors.itemId.message}</p>}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {selectedRequestedItem?.unit
                    ? `${t('common.quantity')} (${selectedRequestedItem.unit})`
                    : t('common.quantity')}
                </label>
                <Input type="number" min={requestedQuantityStep === '1' ? '1' : '0.01'} step={requestedQuantityStep} {...register('quantity')} />
                <p className="text-xs text-slate-500">
                  {selectedRequestedUnit
                    ? t('loans.requestQuantityHelpWithUnit', { unit: selectedRequestedUnit.name, symbol: selectedRequestedItem?.unit ?? selectedRequestedUnit.extra })
                    : t('loans.requestQuantityHelp')}
                </p>
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
          </MobileDisclosure>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <LoanSectionButton active={activeSection === 'requests'} label={t('loans.requestsTab', { count: requestSectionCount })} onClick={() => setActiveSection('requests')} />
              <LoanSectionButton active={activeSection === 'active'} label={t('loans.activeTab', { count: activeSectionCount })} onClick={() => setActiveSection('active')} />
              <LoanSectionButton active={activeSection === 'closed'} label={t('loans.closedTab', { count: closedSectionCount })} onClick={() => setActiveSection('closed')} />
            </div>
            <p className="text-sm text-slate-500">{t('loans.sectionHelp')}</p>
          </Card>

          {activeSection === 'requests' && (
            <Card className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{t('loans.requests')}</h2>
                <p className="text-sm text-slate-600">{t('loans.requestsSummary', { count: requestSectionCount })}</p>
              </div>
              <MobileDisclosure defaultOpen={false} isMobile={isPhone} title={t('items.filtersTitle')}>
                <LoanFiltersPanel
                  categories={categoriesQuery.data ?? []}
                  filters={requestFilters}
                  fromLabel={t('loans.requestedFrom')}
                  toLabel={t('loans.requestedTo')}
                  onChange={(patch) => setRequestFilters((current) => ({ ...current, ...patch }))}
                  t={t}
                />
              </MobileDisclosure>
            <div className="space-y-3">
              {operatorBorrowerPendingGroups.map((group) => (
                <OperatorBorrowerGroupCard
                  key={group.id}
                  actionLabel={t('borrower.reviewRequest')}
                  group={group}
                  statusLabel={borrowerGroupStatusLabel(group.status, enumLabel, t)}
                  subtitle={`${group.locationName} - ${formatDate(group.requestedAt)}`}
                  title={group.borrowerName}
                  onAction={() => setReviewingBorrowerGroup(group)}
                />
              ))}
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
                      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2 md:w-auto">
                          <Button className="w-full" disabled={approveMutation.isPending || rejectMutation.isPending} onClick={() => approveMutation.mutate(request.id)}>
                            {t('loans.approve')}
                          </Button>
                          <Button
                            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            disabled={rejectMutation.isPending || approveMutation.isPending}
                            onClick={() => openRejectDialog(request)}
                          >
                            {t('loans.reject')}
                          </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{enumLabel('loanRequestStatus', request.status)}</p>
                </div>
              )) : <Notice>{t('loans.noRequests')}</Notice>}
            </div>
            </Card>
          )}

          {activeSection === 'active' && (
            <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('loans.active')}</h2>
              <p className="text-sm text-slate-600">{t('loans.activeSummary', { count: activeSectionCount })}</p>
            </div>
            <MobileDisclosure defaultOpen={false} isMobile={isPhone} title={t('items.filtersTitle')}>
              <LoanFiltersPanel
                categories={categoriesQuery.data ?? []}
                filters={activeFilters}
                fromLabel={t('loans.dueFrom')}
                toLabel={t('loans.dueTo')}
                onChange={(patch) => setActiveFilters((current) => ({ ...current, ...patch }))}
                t={t}
              />
            </MobileDisclosure>
            <div className="space-y-4">
              {operatorBorrowerActiveGroups.map((group) => {
                const canDeliverGroup = ['APPROVED', 'PARTIALLY_APPROVED'].includes(group.status)
                const canReturnGroup = ['DELIVERED', 'OVERDUE'].includes(group.status)
                return (
                  <OperatorBorrowerGroupCard
                    key={group.id}
                    actionLabel={canReturnGroup ? t('loans.return') : canDeliverGroup ? t('loans.deliver') : undefined}
                    group={group}
                    statusLabel={borrowerGroupStatusLabel(group.status, enumLabel, t)}
                    subtitle={`${group.locationName} - ${formatDate(group.dueAt)}`}
                    title={group.borrowerName}
                    onAction={
                      canReturnGroup
                        ? () => setReturningBorrowerGroup(group)
                        : canDeliverGroup
                          ? () => deliverBorrowerGroupMutation.mutate({ groupId: group.id })
                          : undefined
                    }
                  />
                )
              })}
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
                            <Button className="w-full bg-secondary text-secondary-foreground md:w-auto" onClick={() => startEditingLoan(loan)}>
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

                              <div className="grid grid-cols-2 gap-2 sm:flex">
                                <Button
                                  className="w-full sm:w-auto"
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
                              <Button
                                className="w-full md:w-auto"
                                disabled={deliverMutation.isPending}
                                onClick={() => deliverMutation.mutate({ id: loan.id, notes: deliveryNotes[loan.id] })}
                              >
                                {t('loans.deliver')}
                              </Button>
                            </>
                          )}

                          {['DELIVERED', 'OVERDUE'].includes(loan.status) && (
                            <div className="w-full space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">
                                  {loan.unitSymbol ? `${t('loans.returnedQuantity')} (${loan.unitSymbol})` : t('loans.returnedQuantity')}
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={returnDraft.returnedQuantity}
                                  placeholder={t('loans.returnedQuantity')}
                                  onChange={(event) => updateReturnDraft(loan, { returnedQuantity: event.target.value })}
                                />
                                <p className="text-xs text-slate-500">{t('loans.returnQuantityHelp')}</p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">{t('loans.returnNotes')}</label>
                                <Input
                                  placeholder={t('loans.returnNotesPlaceholder')}
                                  value={returnDraft.notes}
                                  onChange={(event) => updateReturnDraft(loan, { notes: event.target.value })}
                                />
                              </div>
                              <Button
                                className="w-full bg-secondary text-secondary-foreground"
                                disabled={returnMutation.isPending}
                                onClick={() => returnMutation.mutate({
                                  id: loan.id,
                                  payload: {
                                    returnedQuantity: Number(returnDraft.returnedQuantity || 0),
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

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <p>{t('common.quantity')}: <strong className="text-slate-950">{quantityWithUnit(loan.quantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.pendingReturn')}: <strong className="text-slate-950">{quantityWithUnit(loan.outstandingQuantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.returnedQuantity')}: <strong className="text-slate-950">{quantityWithUnit(loan.returnedQuantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.requestedAt')}: <strong className="text-slate-950">{formatDate(loan.requestedAt)}</strong></p>
                      <p>{t('loans.approvedAt')}: <strong className="text-slate-950">{formatDate(loan.approvedAt)}</strong></p>
                      <p>{t('loans.deliveredAt')}: <strong className="text-slate-950">{formatDate(loan.loanedAt)}</strong></p>
                      <p>{t('loans.approvedBy')}: <strong className="text-slate-950">{loan.approvedBy ?? t('common.notAvailable')}</strong></p>
                      <p>{t('loans.deliveredBy')}: <strong className="text-slate-950">{loan.deliveredBy ?? t('common.notAvailable')}</strong></p>
                      <p>{t('loans.completeReturn')}: <strong className="text-slate-950">{formatDate(loan.returnedAt)}</strong></p>
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
          )}

          {activeSection === 'closed' && (
            <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('loans.closed')}</h2>
              <p className="text-sm text-slate-600">{t('loans.closedSummary', { count: closedSectionCount })}</p>
            </div>
            <MobileDisclosure defaultOpen={false} isMobile={isPhone} title={t('items.filtersTitle')}>
              <LoanFiltersPanel
                categories={categoriesQuery.data ?? []}
                filters={closedFilters}
                fromLabel={t('loans.closedFrom')}
                toLabel={t('loans.closedTo')}
                onChange={(patch) => setClosedFilters((current) => ({ ...current, ...patch }))}
                t={t}
              />
            </MobileDisclosure>
            <div className="space-y-4">
              {operatorBorrowerClosedGroups.map((group) => (
                <OperatorBorrowerGroupCard
                  key={group.id}
                  group={group}
                  statusLabel={borrowerGroupStatusLabel(group.status, enumLabel, t)}
                  subtitle={`${group.locationName} - ${formatDate(group.returnedAt ?? group.dueAt)}`}
                  title={group.borrowerName}
                />
              ))}
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
                            <Button className="w-full bg-secondary text-secondary-foreground md:w-auto" onClick={() => startEditingLoan(loan)}>
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
                              <div className="grid grid-cols-2 gap-2 sm:flex">
                                <Button
                                  className="w-full sm:w-auto"
                                  disabled={updateLoanMutation.isPending || !loanEditDraft.dueAt || !loanEditDraft.loanedAt || !loanEditDraft.returnedAt}
                                  onClick={() => updateLoanMutation.mutate({ id: loan.id, loan, draft: loanEditDraft })}
                                >
                                  {t('loans.saveLoan')}
                                </Button>
                                <Button className="w-full bg-secondary text-secondary-foreground sm:w-auto" onClick={() => cancelEditingLoan(loan.id)}>
                                  {t('common.cancel')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <p>{t('common.quantity')}: <strong className="text-slate-950">{quantityWithUnit(loan.quantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.returnedQuantity')}: <strong className="text-slate-950">{quantityWithUnit(loan.returnedQuantity, loan.unitSymbol)}</strong></p>
                      <p>{t('loans.requestedAt')}: <strong className="text-slate-950">{formatDate(loan.requestedAt)}</strong></p>
                      <p>{t('loans.approvedAt')}: <strong className="text-slate-950">{formatDate(loan.approvedAt)}</strong></p>
                      <p>{t('loans.deliveredAt')}: <strong className="text-slate-950">{formatDate(loan.loanedAt)}</strong></p>
                      <p>{t('loans.completeReturn')}: <strong className="text-slate-950">{formatDate(loan.returnedAt)}</strong></p>
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
          )}
        </div>
      </div>

      {reviewingBorrowerGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{t('borrower.groupedRequestBadge')}</p>
                <h2 className="text-xl font-semibold text-slate-950">{reviewingBorrowerGroup.borrowerName}</h2>
                <p className="text-sm text-slate-500">{reviewingBorrowerGroup.locationName} - {formatDate(reviewingBorrowerGroup.dueAt)}</p>
              </div>
              <Button className="bg-secondary text-secondary-foreground sm:w-auto" onClick={() => setReviewingBorrowerGroup(null)}>
                {t('common.cancel')}
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {reviewingBorrowerGroup.items.map((item) => {
                const draft = getBorrowerReviewDraft(reviewingBorrowerGroup, item.loanRequestId)
                return (
                  <div key={item.loanRequestId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">{item.itemName}</p>
                        <p className="text-sm text-slate-500">{item.categoryName}</p>
                        <p className="text-sm text-slate-600">{t('borrower.requestedQuantity')}: {quantityWithUnit(item.requestedQuantity, item.unitSymbol)}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                        <select className="h-11 rounded-xl border border-border bg-white px-3" value={draft.decision} onChange={(event) => updateBorrowerReviewDraft(item.loanRequestId, { decision: event.target.value as BorrowerReviewDraft['decision'] })}>
                          <option value="APPROVE">{t('loans.approve')}</option>
                          <option value="REJECT">{t('loans.reject')}</option>
                        </select>
                        {draft.decision === 'APPROVE' ? (
                          <Input value={draft.approvedQuantity} onChange={(event) => updateBorrowerReviewDraft(item.loanRequestId, { approvedQuantity: event.target.value })} />
                        ) : (
                          <Input value={draft.rejectionReason} onChange={(event) => updateBorrowerReviewDraft(item.loanRequestId, { rejectionReason: event.target.value })} />
                        )}
                        <div className="flex items-center text-xs text-slate-500">
                          {draft.decision === 'APPROVE'
                            ? t('borrower.approveHelp', { unit: item.unitSymbol || t('common.quantity') })
                            : t('borrower.rejectHelp')}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                disabled={reviewBorrowerGroupMutation.isPending}
                onClick={() => reviewBorrowerGroupMutation.mutate({
                  groupId: reviewingBorrowerGroup.id,
                  payload: {
                    items: reviewingBorrowerGroup.items.map((item) => {
                      const draft = getBorrowerReviewDraft(reviewingBorrowerGroup, item.loanRequestId)
                      return {
                        loanRequestId: item.loanRequestId,
                        decision: draft.decision,
                        approvedQuantity: draft.decision === 'APPROVE' ? Number(draft.approvedQuantity) : undefined,
                        rejectionReason: draft.decision === 'REJECT' ? draft.rejectionReason : undefined,
                      }
                    }),
                  },
                })}
              >
                {t('borrower.reviewRequest')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {returningBorrowerGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{t('borrower.groupedLoanBadge')}</p>
                <h2 className="text-xl font-semibold text-slate-950">{returningBorrowerGroup.borrowerName}</h2>
                <p className="text-sm text-slate-500">{returningBorrowerGroup.locationName} - {formatDate(returningBorrowerGroup.dueAt)}</p>
              </div>
              <Button className="bg-secondary text-secondary-foreground sm:w-auto" onClick={() => setReturningBorrowerGroup(null)}>
                {t('common.cancel')}
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {returningBorrowerGroup.items.filter((item) => item.loanId).map((item) => {
                const draft = getBorrowerReturnDraft(returningBorrowerGroup.id, item.loanId!, item.outstandingQuantity || item.approvedQuantity)
                return (
                  <div key={item.loanRequestId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">{item.itemName}</p>
                        <p className="text-sm text-slate-500">{item.categoryName}</p>
                        <p className="text-sm text-slate-600">{t('borrower.approvedQuantity')}: {quantityWithUnit(item.approvedQuantity, item.unitSymbol)}</p>
                        <p className="text-sm text-slate-600">{t('borrower.pendingQuantity')}: {quantityWithUnit(item.outstandingQuantity, item.unitSymbol)}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
                        <Input value={draft.returnedQuantity} onChange={(event) => updateBorrowerReturnDraft(returningBorrowerGroup.id, item.loanId!, { returnedQuantity: event.target.value }, item.outstandingQuantity || item.approvedQuantity)} />
                        <Input value={draft.notes} placeholder={t('loans.returnNotes')} onChange={(event) => updateBorrowerReturnDraft(returningBorrowerGroup.id, item.loanId!, { notes: event.target.value }, item.outstandingQuantity || item.approvedQuantity)} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                disabled={returnBorrowerGroupMutation.isPending}
                onClick={() => returnBorrowerGroupMutation.mutate({
                  groupId: returningBorrowerGroup.id,
                  payload: {
                    items: returningBorrowerGroup.items
                      .filter((item) => item.loanId)
                      .map((item) => {
                        const draft = getBorrowerReturnDraft(returningBorrowerGroup.id, item.loanId!, item.outstandingQuantity || item.approvedQuantity)
                        return {
                          loanId: item.loanId,
                          returnedQuantity: Number(draft.returnedQuantity),
                          notes: draft.notes || undefined,
                        }
                      }),
                  },
                })}
              >
                {t('loans.return')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{t('loans.reject')}</p>
              <h2 className="text-xl font-semibold text-slate-950">{rejectingRequest.itemName}</h2>
              <p className="text-sm text-slate-500">
                {rejectingRequest.borrowerName} - {quantityWithUnit(rejectingRequest.quantity, rejectingRequest.unitSymbol)}
              </p>
              <p className="text-sm text-slate-500">{t('loans.rejectionReasonHelp')}</p>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium text-slate-800">{t('loans.rejectionReason')}</label>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder={t('loans.rejectionReasonPlaceholder')}
                value={rejectionReasonDraft}
                onChange={(event) => setRejectionReasonDraft(event.target.value)}
              />
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:w-auto" onClick={closeRejectDialog}>
                {t('common.cancel')}
              </Button>
              <Button
                className="sm:w-auto"
                disabled={rejectMutation.isPending || !rejectionReasonDraft.trim()}
                onClick={() => rejectMutation.mutate({ id: rejectingRequest.id, notes: rejectionReasonDraft.trim() })}
              >
                {t('loans.reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BorrowerGroupCard({
  group,
  enumLabel,
  t,
}: {
  group: BorrowerLoanGroup
  enumLabel: (namespace: string, value?: string | null) => string
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-slate-950">{group.locationName}</p>
          <p className="text-sm text-slate-500">{t('loans.dueLabel')} {formatDate(group.dueAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.dueSoon && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">{t('borrower.dueSoonBadge')}</span>}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{borrowerGroupStatusLabel(group.status, enumLabel, t)}</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {group.items.map((item) => (
          <div key={item.loanRequestId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-medium text-slate-950">{item.itemName}</p>
                <p className="text-sm text-slate-500">{item.categoryName}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {item.status === 'PENDING' || item.status === 'APPROVED' || item.status === 'REJECTED'
                  ? enumLabel('loanRequestStatus', item.status)
                  : enumLabel('loanStatus', item.status)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <p>{t('borrower.requestedQuantity')}: <strong className="text-slate-950">{quantityWithUnit(item.requestedQuantity, item.unitSymbol)}</strong></p>
              <p>{t('borrower.approvedQuantity')}: <strong className="text-slate-950">{quantityWithUnit(item.approvedQuantity, item.unitSymbol)}</strong></p>
              <p>{t('borrower.returnedQuantityLabel')}: <strong className="text-slate-950">{quantityWithUnit(item.returnedQuantity, item.unitSymbol)}</strong></p>
              <p>{t('borrower.pendingQuantity')}: <strong className="text-slate-950">{quantityWithUnit(item.outstandingQuantity, item.unitSymbol)}</strong></p>
            </div>
            {item.rejectionReason && <p className="mt-2 text-sm text-rose-600">{item.rejectionReason}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function OperatorBorrowerGroupCard({
  actionLabel,
  group,
  onAction,
  statusLabel,
  subtitle,
  title,
}: {
  actionLabel?: string
  group: BorrowerLoanGroup
  onAction?: () => void
  statusLabel: string
  subtitle: string
  title: string
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-950">{title}</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{statusLabel}</span>
          </div>
          <p className="text-sm text-slate-500">{subtitle}</p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <span key={item.loanRequestId} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                {item.itemName}: {quantityWithUnit(item.requestedQuantity, item.unitSymbol)}
              </span>
            ))}
          </div>
        </div>
        {actionLabel && onAction && (
          <Button className="w-full md:w-auto" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

function LoanSectionButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`min-h-11 rounded-2xl px-3 py-2 text-xs font-medium transition sm:text-sm ${active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-300'}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
