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
  email: string
  password: string
}

export function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const schema = z.object({
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: api.login,
    onSuccess: (response) => {
      setSession(response)
      navigate('/app/dashboard')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-white/95">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-700">{t('auth.login.kicker')}</p>
          <h1 className="text-3xl font-semibold text-slate-950">{t('auth.login.title')}</h1>
          <p className="text-sm text-slate-600">{t('auth.login.subtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('common.email')}</label>
            <Input {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('common.password')}</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link className="text-sky-700 hover:underline" to="/register">{t('auth.login.createAccount')}</Link>
          <Link className="text-slate-600 hover:underline" to="/forgot-password">{t('auth.login.forgotPassword')}</Link>
        </div>
      </Card>
    </div>
  )
}
