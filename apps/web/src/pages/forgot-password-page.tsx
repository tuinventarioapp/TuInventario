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

type FormValues = {
  email: string
}

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const schema = z.object({
    email: z.string().email(t('validation.email')),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const mutation = useMutation({
    mutationFn: api.forgotPassword,
    onSuccess: (_, variables) => {
      navigate(`/reset-password?email=${encodeURIComponent(variables.email)}`, {
        state: { successMessage: t('auth.forgot.success') },
      })
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(27,125,167,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(223,241,234,0.88),transparent_28%),linear-gradient(180deg,#f7fbfd_0%,#eef5f7_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[420px] rounded-[30px] border-[#d8e1e8] bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="space-y-6 px-7 py-7">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-12 w-12 shrink-0" variant="mark" />
            <div>
              <p className="text-[1.06rem] font-semibold leading-none text-slate-950">{t('app.name')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('shell.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-500">{t('auth.forgot.kicker')}</p>
            <h1 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950">{t('auth.forgot.title')}</h1>
            <p className="text-[15px] leading-7 text-slate-500">{t('auth.forgot.subtitle')}</p>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-[15px] font-semibold text-slate-900">{t('common.email')}</label>
              <Input autoComplete="email" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
            </div>

            {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

            <Button className="h-12 w-full rounded-[16px] bg-[#2688b4] text-sm font-semibold shadow-none hover:bg-[#227ca4]" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <Link className="font-medium text-sky-700 hover:underline" to="/login">
              {t('common.backToLogin')}
            </Link>
            <Link className="text-slate-500 hover:underline" to="/register">
              {t('auth.login.createAccount')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
