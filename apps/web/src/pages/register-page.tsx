import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { BrandLogo } from '../components/branding/brand-logo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(27,125,167,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(223,241,234,0.9),transparent_32%),linear-gradient(180deg,#f8fbfd_0%,#eef5f7_100%)] px-4 py-10">
      <Card className="w-full max-w-[900px] overflow-hidden border-slate-200 bg-white/95 p-0 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="border-b border-white/10 bg-slate-950 px-8 py-8 text-white">
          <BrandLogo className="h-9 w-auto" variant="horizontal" />
          <p className="mt-5 text-sm text-slate-200">{t('shell.subtitle')}</p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-700">{t('auth.register.kicker')}</p>
            <h1 className="text-[2.05rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950">{t('auth.register.title')}</h1>
            <p className="max-w-[42ch] text-[15px] leading-6 text-slate-600">{t('shell.subtitle')}</p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('common.name')}</label>
              <Input autoComplete="name" className="h-12 rounded-2xl px-4" {...register('fullName')} />
              {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('common.email')}</label>
              <Input autoComplete="email" className="h-12 rounded-2xl px-4" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('common.password')}</label>
              <Input autoComplete="new-password" className="h-12 rounded-2xl px-4" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('common.timezone')}</label>
              <Input className="h-12 rounded-2xl px-4" {...register('timezone')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">{t('common.organization')}</label>
              <Input className="h-12 rounded-2xl px-4" {...register('organizationName')} />
              {errors.organizationName && <p className="text-sm text-red-600">{errors.organizationName.message}</p>}
            </div>

            {mutation.isError && <p className="text-sm text-red-600 md:col-span-2">{mutation.error.message}</p>}

            <div className="md:col-span-2">
              <Button className="h-12 w-full rounded-2xl text-sm font-semibold" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
              </Button>
            </div>
          </form>

          <p className="text-sm text-slate-600">
            {t('auth.register.haveAccess')}{' '}
            <Link className="font-medium text-sky-700 hover:underline" to="/login">
              {t('auth.register.login')}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
