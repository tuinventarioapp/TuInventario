import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { canManageBorrowers, isAdmin } from '../lib/access'
import { api } from '../lib/api'
import type { Borrower } from '../types/api'
import { useAuthStore } from '../store/auth-store'

type FormValues = {
  name: string
  email: string
  phone: string
  notes: string
}

type BorrowerAccountValues = {
  fullName: string
  email: string
  password: string
  assignedLocationId: string
}

export function BorrowersPage() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isPhone = useIsMobile()
  const canCreateBorrowerAccounts = isAdmin(user?.role)
  const [borrowerMode, setBorrowerMode] = useState<'account' | 'manual'>(canCreateBorrowerAccounts ? 'account' : 'manual')
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null)
  const [borrowerSearch, setBorrowerSearch] = useState('')
  const schema = z.object({
    name: z.string().min(3, t('validation.name')),
    email: z.union([z.string().email(t('validation.email')), z.literal('')]),
    phone: z.string(),
    notes: z.string(),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  })
  const borrowerAccountSchema = z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
    assignedLocationId: z.string().min(1, t('users.locationRequired')),
  })
  const borrowerAccountForm = useForm<BorrowerAccountValues>({
    resolver: zodResolver(borrowerAccountSchema),
    defaultValues: { fullName: '', email: '', password: '', assignedLocationId: '' },
  })

  useEffect(() => {
    if (!editingBorrower) {
      form.reset({ name: '', email: '', phone: '', notes: '' })
      return
    }
    form.reset({
      name: editingBorrower.name,
      email: editingBorrower.email ?? '',
      phone: editingBorrower.phone ?? '',
      notes: editingBorrower.notes ?? '',
    })
  }, [editingBorrower, form])

  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: api.locations,
    enabled: canCreateBorrowerAccounts,
  })

  useEffect(() => {
    if (!canCreateBorrowerAccounts) return
    const firstLocation = locationsQuery.data?.[0]?.id
    if (!firstLocation || borrowerAccountForm.getValues('assignedLocationId')) return
    borrowerAccountForm.setValue('assignedLocationId', firstLocation)
  }, [borrowerAccountForm, canCreateBorrowerAccounts, locationsQuery.data])

  const borrowersQuery = useQuery({
    queryKey: ['borrowers', borrowerSearch],
    queryFn: () => api.borrowers(borrowerSearch),
    enabled: canManageBorrowers(user?.role),
  })
  const createMutation = useMutation({
    mutationFn: api.createBorrower,
    onSuccess: async () => {
      form.reset({ name: '', email: '', phone: '', notes: '' })
      await queryClient.invalidateQueries({ queryKey: ['borrowers'] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => api.updateBorrower(editingBorrower!.id, values),
    onSuccess: async () => {
      setEditingBorrower(null)
      await queryClient.invalidateQueries({ queryKey: ['borrowers'] })
    },
  })
  const createBorrowerAccountMutation = useMutation({
    mutationFn: (values: BorrowerAccountValues) => api.createUser({ ...values, role: 'BORROWER' }),
    onSuccess: async () => {
      borrowerAccountForm.reset({
        fullName: '',
        email: '',
        password: '',
        assignedLocationId: locationsQuery.data?.[0]?.id ?? '',
      })
      await queryClient.invalidateQueries({ queryKey: ['borrowers'] })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: api.deleteBorrower,
    onSuccess: async () => {
      setEditingBorrower(null)
      await queryClient.invalidateQueries({ queryKey: ['borrowers'] })
    },
  })

  if (!canManageBorrowers(user?.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('borrowers.title')} description={t('borrowers.description')} />
        <Notice variant="warning">{t('borrowers.managerOnly')}</Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('borrowers.title')} description={t('borrowers.description')} />

      {(createMutation.isError || updateMutation.isError || deleteMutation.isError || createBorrowerAccountMutation.isError) && (
        <Notice variant="error">{createMutation.error?.message ?? updateMutation.error?.message ?? deleteMutation.error?.message ?? createBorrowerAccountMutation.error?.message}</Notice>
      )}
      {createMutation.isSuccess && <Notice variant="success">{t('borrowers.success')}</Notice>}
      {updateMutation.isSuccess && <Notice variant="success">{t('borrowers.updated')}</Notice>}
      {deleteMutation.isSuccess && <Notice variant="success">{t('borrowers.successDelete')}</Notice>}
      {createBorrowerAccountMutation.isSuccess && <Notice variant="success">{t('borrowers.accountSuccess')}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <MobileDisclosure
              defaultOpen
              isMobile={isPhone}
              title={editingBorrower ? t('borrowers.editTitle') : t('borrowers.title')}
            >
              <div className="space-y-4">
                {canCreateBorrowerAccounts && !editingBorrower && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                      <button
                        className={borrowerMode === 'account'
                          ? 'rounded-[18px] bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm'
                          : 'rounded-[18px] px-3 py-2 text-sm font-medium text-slate-500'}
                        type="button"
                        onClick={() => setBorrowerMode('account')}
                      >
                        {t('borrowers.accountMode')}
                      </button>
                      <button
                        className={borrowerMode === 'manual'
                          ? 'rounded-[18px] bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm'
                          : 'rounded-[18px] px-3 py-2 text-sm font-medium text-slate-500'}
                        type="button"
                        onClick={() => setBorrowerMode('manual')}
                      >
                        {t('borrowers.manualMode')}
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">
                      {borrowerMode === 'account' ? t('borrowers.accountModeHelp') : t('borrowers.manualModeHelp')}
                    </p>
                  </div>
                )}

                {(canCreateBorrowerAccounts && !editingBorrower ? borrowerMode === 'account' : false) ? (
                  <form className="space-y-3" onSubmit={borrowerAccountForm.handleSubmit((values) => createBorrowerAccountMutation.mutate(values))}>
                    <Field label={t('common.name')} error={borrowerAccountForm.formState.errors.fullName?.message}>
                      <Input {...borrowerAccountForm.register('fullName')} />
                    </Field>
                    <Field label={t('common.email')} error={borrowerAccountForm.formState.errors.email?.message}>
                      <Input {...borrowerAccountForm.register('email')} />
                    </Field>
                    <Field label={t('common.password')} error={borrowerAccountForm.formState.errors.password?.message} hint={t('borrowers.accountPasswordHelp')}>
                      <Input type="password" {...borrowerAccountForm.register('password')} />
                    </Field>
                    <Field label={t('items.location')} error={borrowerAccountForm.formState.errors.assignedLocationId?.message} hint={t('borrowers.accountLocationHelp')}>
                      <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...borrowerAccountForm.register('assignedLocationId')}>
                        <option value="">{t('users.selectLocation')}</option>
                        {locationsQuery.data?.map((location) => (
                          <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Button className="w-full" disabled={createBorrowerAccountMutation.isPending} type="submit">
                      {t('borrowers.accountSubmit')}
                    </Button>
                  </form>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit((values) => {
                      if (editingBorrower) updateMutation.mutate(values)
                      else createMutation.mutate(values)
                    })}
                  >
                    <Field label={t('common.name')} error={form.formState.errors.name?.message}>
                      <Input {...form.register('name')} />
                    </Field>
                    <Field label={t('common.email')} error={form.formState.errors.email?.message}>
                      <Input {...form.register('email')} />
                    </Field>
                    <Field label={t('common.phone')}>
                      <Input {...form.register('phone')} />
                    </Field>
                    <Field label={t('common.notes')} hint={t('borrowers.notesHelp')}>
                      <Input {...form.register('notes')} />
                    </Field>

                    <div className={editingBorrower ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
                      <Button className="flex-1" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                        {editingBorrower ? t('borrowers.update') : t('borrowers.submit')}
                      </Button>
                      {editingBorrower && (
                        <Button className="flex-1 bg-secondary text-secondary-foreground" type="button" onClick={() => setEditingBorrower(null)}>
                          {t('common.cancel')}
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </MobileDisclosure>
          </Card>
        </div>
        <Card>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.search')}</label>
              <Input
                placeholder={t('borrowers.searchPlaceholder')}
                value={borrowerSearch}
                onChange={(event) => setBorrowerSearch(event.target.value)}
              />
              <p className="text-xs text-slate-500">{t('borrowers.searchHelp')}</p>
            </div>
            {borrowersQuery.data?.length ? borrowersQuery.data.map((borrower) => (
              <div key={borrower.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{borrower.name}</p>
                    <p className="text-sm text-slate-500">{borrower.email ?? t('common.notAvailable')} - {borrower.phone ?? t('common.notAvailable')}</p>
                    {borrower.notes && <p className="mt-2 text-sm text-slate-600">{borrower.notes}</p>}
                  </div>
                  <div className="flex w-full flex-wrap gap-2 md:w-auto">
                    <Button className="flex-1 bg-secondary text-secondary-foreground md:flex-none" onClick={() => {
                      setBorrowerMode('manual')
                      setEditingBorrower(borrower)
                    }}>{t('common.edit')}</Button>
                    <Button
                      className="flex-1 md:flex-none"
                      onClick={() => {
                        if (window.confirm(t('borrowers.deleteConfirm'))) {
                          deleteMutation.mutate(borrower.id)
                        }
                      }}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            )) : <Notice>{t('borrowers.empty')}</Notice>}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
