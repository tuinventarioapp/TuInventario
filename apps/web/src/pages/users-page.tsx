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
import { canManageUsers } from '../lib/access'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'

type FormValues = {
  fullName: string
  email: string
  password: string
  role: 'ADMIN' | 'MANAGER' | 'COLLABORATOR'
}

export function UsersPage() {
  const { t, enumLabel } = useI18n()
  const user = useAuthStore((state) => state.user)
  const schema = z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
    role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATOR']),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'COLLABORATOR' },
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: api.users,
    enabled: canManageUsers(user?.role),
  })

  const mutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: async () => {
      reset({ fullName: '', email: '', password: '', role: 'COLLABORATOR' })
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

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <form className="space-y-3" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <Input placeholder={t('common.name')} {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}

            <Input placeholder={t('common.email')} {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}

            <Input type="password" placeholder={t('common.password')} {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}

            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('role')}>
              {(['ADMIN', 'MANAGER', 'COLLABORATOR'] as const).map((role) => (
                <option key={role} value={role}>{enumLabel('role', role)}</option>
              ))}
            </select>

            {mutation.isError && <Notice variant="error">{mutation.error.message}</Notice>}
            {mutation.isSuccess && <Notice variant="success">{t('users.success')}</Notice>}

            <Button className="w-full" disabled={mutation.isPending} type="submit">
              {t('users.submit')}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="space-y-3">
            {usersQuery.data?.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{entry.fullName}</p>
                <p className="text-sm text-slate-500">{entry.email} - {enumLabel('role', entry.role)} - {entry.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
