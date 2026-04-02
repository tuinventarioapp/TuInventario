import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
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
import { canManageUsers } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import type { UserSummary } from '../types/api'

type UserRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR' | 'BORROWER'
const createRoleOptions = ['ADMIN', 'MANAGER', 'COLLABORATOR'] as const
const internalRoleOptions = ['ADMIN', 'MANAGER', 'COLLABORATOR'] as const

type CreateValues = {
  fullName: string
  email: string
  password: string
  role: (typeof createRoleOptions)[number]
  assignedLocationId?: string
}

type EditValues = {
  fullName: string
  email: string
  role: UserRole
  status: 'ACTIVE' | 'BLOCKED'
  assignedLocationId?: string
}

function requireAssignedLocation<T extends { role: UserRole; assignedLocationId?: string }>(
  values: T,
  ctx: z.RefinementCtx,
  message: string,
) {
  if (values.role !== 'ADMIN' && !values.assignedLocationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assignedLocationId'],
      message,
    })
  }
}

export function UsersPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isPhone = useIsMobile()
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
  const [passwordDraft, setPasswordDraft] = useState('')
  const createSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
    role: z.enum(createRoleOptions),
    assignedLocationId: z.string().optional(),
  }).superRefine((values, ctx) => requireAssignedLocation(values, ctx, t('users.locationRequired'))), [t])

  const editSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATOR', 'BORROWER']),
    status: z.enum(['ACTIVE', 'BLOCKED']),
    assignedLocationId: z.string().optional(),
  }).superRefine((values, ctx) => requireAssignedLocation(values, ctx, t('users.locationRequired'))), [t])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'COLLABORATOR', assignedLocationId: '' },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: 'COLLABORATOR', status: 'ACTIVE', assignedLocationId: '' },
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: api.users,
    enabled: canManageUsers(user?.role),
  })
  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: api.locations,
    enabled: canManageUsers(user?.role),
  })

  useEffect(() => {
    if (!editingUser) {
      setPasswordDraft('')
      editForm.reset({ fullName: '', email: '', role: 'COLLABORATOR', status: 'ACTIVE', assignedLocationId: '' })
      return
    }
    editForm.reset({
      fullName: editingUser.fullName,
      email: editingUser.email,
      role: editingUser.role as EditValues['role'],
      status: editingUser.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
      assignedLocationId: editingUser.assignedLocationId ?? '',
    })
  }, [editForm, editingUser])

  const createRole = createForm.watch('role')
  const editRole = editForm.watch('role')

  useEffect(() => {
    const firstLocation = locationsQuery.data?.[0]?.id
    if (!firstLocation) return
    if (createRole !== 'ADMIN' && !createForm.getValues('assignedLocationId')) {
      createForm.setValue('assignedLocationId', firstLocation)
    }
  }, [createForm, createRole, locationsQuery.data])

  useEffect(() => {
    if (createRole === 'ADMIN') {
      createForm.setValue('assignedLocationId', '')
    }
  }, [createForm, createRole])

  useEffect(() => {
    if (editRole === 'ADMIN') {
      editForm.setValue('assignedLocationId', '')
    }
  }, [editForm, editRole])

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: async () => {
      createForm.reset({ fullName: '', email: '', password: '', role: 'COLLABORATOR', assignedLocationId: locationsQuery.data?.[0]?.id ?? '' })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: EditValues) => api.updateUser(editingUser!.id, values),
    onSuccess: async () => {
      setEditingUser(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: async () => {
      setEditingUser(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => api.resetUserPassword(id, { newPassword }),
    onSuccess: () => {
      setPasswordDraft('')
    },
  })

  if (!canManageUsers(user?.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('users.title')} description={t('users.description')} />
        <Notice variant="warning">{t('users.adminOnly')}</Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('users.title')} description={t('users.description')} />
      <Notice>{t('users.info')}</Notice>

      {(createMutation.isError || updateMutation.isError || deleteMutation.isError || resetPasswordMutation.isError) && (
        <Notice variant="error">{createMutation.error?.message ?? updateMutation.error?.message ?? deleteMutation.error?.message ?? resetPasswordMutation.error?.message}</Notice>
      )}
      {createMutation.isSuccess && <Notice variant="success">{t('users.success')}</Notice>}
      {updateMutation.isSuccess && <Notice variant="success">{t('users.updated')}</Notice>}
      {deleteMutation.isSuccess && <Notice variant="success">{t('users.updated')}</Notice>}
      {resetPasswordMutation.isSuccess && <Notice variant="success">{t('users.passwordResetSuccess')}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <MobileDisclosure
            defaultOpen
            isMobile={isPhone}
            title={editingUser ? t('users.editing') : t('users.createTitle')}
          >
            {editingUser ? (
              <form className="space-y-3" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
              <Field label={t('common.name')} error={editForm.formState.errors.fullName?.message}>
                <Input {...editForm.register('fullName')} />
              </Field>
              <Field label={t('common.email')} error={editForm.formState.errors.email?.message}>
                <Input {...editForm.register('email')} />
              </Field>
              <Field label={t('common.role')}>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...editForm.register('role')}>
                  {((editingUser?.role === 'BORROWER' ? ['ADMIN', 'MANAGER', 'COLLABORATOR', 'BORROWER'] : internalRoleOptions) as readonly UserRole[]).map((role) => (
                    <option key={role} value={role}>{enumLabel('role', role)}</option>
                  ))}
                </select>
              </Field>
              {editRole !== 'ADMIN' && (
                <Field label={t('items.location')} error={editForm.formState.errors.assignedLocationId?.message} hint={t('users.locationHelp')}>
                  <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...editForm.register('assignedLocationId')}>
                    <option value="">{t('users.selectLocation')}</option>
                    {locationsQuery.data?.map((location) => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label={t('common.status')}>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...editForm.register('status')}>
                  <option value="ACTIVE">{t('users.status.ACTIVE')}</option>
                  <option value="BLOCKED">{t('users.status.BLOCKED')}</option>
                </select>
              </Field>
              <div className="rounded-2xl border border-border p-3">
                <p className="text-sm font-medium text-slate-900">{t('users.passwordResetTitle')}</p>
                <p className="mt-1 text-sm text-slate-500">{t('users.passwordResetHelp')}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="password"
                    placeholder={t('users.newPassword')}
                    value={passwordDraft}
                    onChange={(event) => setPasswordDraft(event.target.value)}
                  />
                  <Button
                    className="shrink-0"
                    disabled={resetPasswordMutation.isPending || passwordDraft.trim().length < 8}
                    type="button"
                    onClick={() => resetPasswordMutation.mutate({ id: editingUser.id, newPassword: passwordDraft })}
                  >
                    {t('users.resetPassword')}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="flex-1" disabled={updateMutation.isPending} type="submit">{t('users.update')}</Button>
                <Button className="flex-1 bg-secondary text-secondary-foreground" type="button" onClick={() => setEditingUser(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <Field label={t('common.name')} error={createForm.formState.errors.fullName?.message}>
                <Input {...createForm.register('fullName')} />
              </Field>
              <Field label={t('common.email')} error={createForm.formState.errors.email?.message}>
                <Input {...createForm.register('email')} />
              </Field>
              <Field label={t('common.password')} error={createForm.formState.errors.password?.message} hint={t('users.passwordHelp')}>
                <Input type="password" {...createForm.register('password')} />
              </Field>
              <Field label={t('common.role')}>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('role')}>
                  {createRoleOptions.map((role) => (
                    <option key={role} value={role}>{enumLabel('role', role)}</option>
                  ))}
                </select>
              </Field>
              {createRole !== 'ADMIN' && (
                <Field label={t('items.location')} error={createForm.formState.errors.assignedLocationId?.message} hint={t('users.locationHelp')}>
                  <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('assignedLocationId')}>
                    <option value="">{t('users.selectLocation')}</option>
                    {locationsQuery.data?.map((location) => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Button className="w-full" disabled={createMutation.isPending} type="submit">
                {t('users.submit')}
              </Button>
            </form>
            )}
          </MobileDisclosure>
        </Card>

        <Card>
          <div className="space-y-3">
            {usersQuery.data?.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{entry.fullName}</p>
                    <p className="text-sm text-slate-500">{entry.email}</p>
                    <p className="text-sm text-slate-500">{enumLabel('role', entry.role)} - {t(`users.status.${entry.status}`)}</p>
                    <p className="text-sm text-slate-500">{t('items.location')}: {entry.assignedLocationName ?? t('users.globalScope')}</p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 md:w-auto">
                    <Button className="flex-1 bg-secondary text-secondary-foreground md:flex-none" onClick={() => setEditingUser(entry)}>{t('common.edit')}</Button>
                    {entry.id !== user?.id && (
                      <Button
                        className="flex-1 md:flex-none"
                        onClick={() => {
                          if (window.confirm(t('users.deleteConfirm'))) {
                            deleteMutation.mutate(entry.id)
                          }
                        }}
                      >
                        {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
