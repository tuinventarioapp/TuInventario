import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { queryClient } from '../app/query-client'
import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { canManageUsers } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import type { UserSummary } from '../types/api'

type UserRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR'

type CreateValues = {
  fullName: string
  email: string
  password: string
  role: UserRole
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
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
  const createSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
    role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATOR']),
    assignedLocationId: z.string().optional(),
  }).superRefine((values, ctx) => requireAssignedLocation(values, ctx, t('users.locationRequired'))), [t])

  const editSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATOR']),
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

      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <Notice variant="error">{createMutation.error?.message ?? updateMutation.error?.message ?? deleteMutation.error?.message}</Notice>
      )}
      {createMutation.isSuccess && <Notice variant="success">{t('users.success')}</Notice>}
      {updateMutation.isSuccess && <Notice variant="success">{t('users.updated')}</Notice>}
      {deleteMutation.isSuccess && <Notice variant="success">{t('users.updated')}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          {editingUser ? (
            <form className="space-y-3" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
              <h2 className="text-lg font-semibold">{t('users.editing')}</h2>
              <Input placeholder={t('common.name')} {...editForm.register('fullName')} />
              <Input placeholder={t('common.email')} {...editForm.register('email')} />
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...editForm.register('role')}>
                {(['ADMIN', 'MANAGER', 'COLLABORATOR'] as const).map((role) => (
                  <option key={role} value={role}>{enumLabel('role', role)}</option>
                ))}
              </select>
              {editRole !== 'ADMIN' && (
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...editForm.register('assignedLocationId')}>
                  <option value="">{t('users.selectLocation')}</option>
                  {locationsQuery.data?.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              )}
              {editForm.formState.errors.assignedLocationId && <p className="text-sm text-red-600">{editForm.formState.errors.assignedLocationId.message}</p>}
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...editForm.register('status')}>
                <option value="ACTIVE">{t('users.status.ACTIVE')}</option>
                <option value="BLOCKED">{t('users.status.BLOCKED')}</option>
              </select>
              <div className="flex gap-2">
                <Button className="flex-1" disabled={updateMutation.isPending} type="submit">{t('users.update')}</Button>
                <Button className="flex-1 bg-secondary text-secondary-foreground" type="button" onClick={() => setEditingUser(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <Input placeholder={t('common.name')} {...createForm.register('fullName')} />
              <Input placeholder={t('common.email')} {...createForm.register('email')} />
              <Input type="password" placeholder={t('common.password')} {...createForm.register('password')} />
              <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('role')}>
                {(['ADMIN', 'MANAGER', 'COLLABORATOR'] as const).map((role) => (
                  <option key={role} value={role}>{enumLabel('role', role)}</option>
                ))}
              </select>
              {createRole !== 'ADMIN' && (
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...createForm.register('assignedLocationId')}>
                  <option value="">{t('users.selectLocation')}</option>
                  {locationsQuery.data?.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              )}
              {createForm.formState.errors.assignedLocationId && <p className="text-sm text-red-600">{createForm.formState.errors.assignedLocationId.message}</p>}
              <Button className="w-full" disabled={createMutation.isPending} type="submit">
                {t('users.submit')}
              </Button>
            </form>
          )}
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
                  <div className="flex gap-2">
                    <Button className="bg-secondary text-secondary-foreground" onClick={() => setEditingUser(entry)}>{t('common.edit')}</Button>
                    {entry.id !== user?.id && (
                      <Button
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
