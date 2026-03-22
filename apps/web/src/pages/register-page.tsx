import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'
import { useI18n } from '../i18n/use-i18n'
import { useAuthStore } from '../store/auth-store'

type FormValues = {
  fullName: string
  email: string
  password: string
  organizationName: string
  timezone: string
}

export function RegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const schema = z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
    organizationName: z.string().min(3, t('validation.name')),
    timezone: z.string().min(3, t('validation.required')),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: 'America/Bogota' },
  })

  const mutation = useMutation({
    mutationFn: api.register,
    onSuccess: (response) => {
      setSession(response)
      navigate('/app/dashboard')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl bg-white/95">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">{t('auth.register.kicker')}</p>
          <h1 className="text-3xl font-semibold text-slate-950">{t('auth.register.title')}</h1>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.name')}</label>
            <Input {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.email')}</label>
            <Input {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.password')}</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.timezone')}</label>
            <Input {...register('timezone')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{t('common.organization')}</label>
            <Input {...register('organizationName')} />
            {errors.organizationName && <p className="text-sm text-red-600">{errors.organizationName.message}</p>}
          </div>

          {mutation.isError && <p className="text-sm text-red-600 md:col-span-2">{mutation.error.message}</p>}

          <div className="md:col-span-2">
            <Button className="w-full" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          {t('auth.register.haveAccess')} <Link className="text-sky-700 hover:underline" to="/login">{t('auth.register.login')}</Link>
        </p>
      </Card>
    </div>
  )
}
