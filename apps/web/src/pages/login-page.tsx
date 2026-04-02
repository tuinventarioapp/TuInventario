import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { BrandLogo } from '../components/branding/brand-logo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'

type FormValues = {
  email: string
  password: string
}

export function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage
  const schema = z.object({
    email: z.string().email(t('validation.email')),
    password: z.string().min(8, t('validation.password')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(27,125,167,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(223,241,234,0.88),transparent_28%),linear-gradient(180deg,#f7fbfd_0%,#eef5f7_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[392px] rounded-[30px] border-[#d8e1e8] bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:max-w-[420px] xl:max-w-[470px] 2xl:max-w-[500px]">
        <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7 xl:px-9 xl:py-8 2xl:px-10">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-12 w-12 shrink-0" variant="mark" />
            <div>
              <p className="text-[1.06rem] font-semibold leading-none text-slate-950">{t('app.name')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('shell.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-500">{t('auth.login.kicker')}</p>
            <h1 className="text-[2.05rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 xl:text-[2.25rem]">{t('auth.login.title')}</h1>
            <p className="max-w-[18rem] text-[15px] leading-7 text-slate-500 xl:max-w-[22rem]">{t('auth.login.subtitle')}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SoftAuthChip>{t('auth.login.chipOperations')}</SoftAuthChip>
            <SoftAuthChip>{t('auth.login.chipLoans')}</SoftAuthChip>
            <SoftAuthChip>{t('auth.login.chipTraceability')}</SoftAuthChip>
          </div>

          {successMessage && (
            <div className="rounded-[18px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
              {successMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-[15px] font-semibold text-slate-900">{t('common.email')}</label>
              <Input autoComplete="email" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" placeholder={t('auth.login.emailPlaceholder')} {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-semibold text-slate-900">{t('common.password')}</label>
              <PasswordInput autoComplete="current-password" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" placeholder={t('auth.login.passwordPlaceholder')} {...register('password')} />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

            <Button className="mt-1 h-12 w-full rounded-[16px] bg-[#2688b4] text-sm font-semibold shadow-none hover:bg-[#227ca4]" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <Link className="font-medium text-sky-700 hover:underline" to="/register">
              {t('auth.login.createAccount')}
            </Link>
            <Link className="text-slate-500 hover:underline" to="/forgot-password">
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

function SoftAuthChip({ children }: { children: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{children}</span>
}
