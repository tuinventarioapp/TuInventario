import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { BrandLogo } from '../components/branding/brand-logo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

type FormValues = {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

export function ResetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const schema = z.object({
    email: z.string().email(t('validation.email')),
    code: z.string().regex(/^\d{6}$/, t('auth.verify.codeRule')),
    newPassword: z.string().regex(strongPasswordRegex, t('validation.passwordStrong')),
    confirmPassword: z.string(),
  }).superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: t('auth.register.passwordMismatch') })
    }
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      code: searchParams.get('code') ?? '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    form.reset({
      email: searchParams.get('email') ?? '',
      code: searchParams.get('code') ?? '',
      newPassword: '',
      confirmPassword: '',
    })
  }, [form, searchParams])

  const mutation = useMutation({
    mutationFn: (payload: { email: string; code: string; newPassword: string }) => api.resetPassword(payload),
    onSuccess: () => {
      navigate('/login', {
        state: { successMessage: t('auth.reset.success') },
      })
    },
  })

  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(27,125,167,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(223,241,234,0.88),transparent_28%),linear-gradient(180deg,#f7fbfd_0%,#eef5f7_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[460px] rounded-[30px] border-[#d8e1e8] bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="space-y-6 px-7 py-7">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-12 w-12 shrink-0" variant="mark" />
            <div>
              <p className="text-[1.06rem] font-semibold leading-none text-slate-950">{t('app.name')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('shell.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-500">{t('auth.reset.kicker')}</p>
            <h1 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950">{t('auth.reset.title')}</h1>
            <p className="text-[15px] leading-7 text-slate-500">{t('auth.reset.subtitle')}</p>
          </div>

          {successMessage && (
            <div className="rounded-[20px] border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-700">
              {successMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate({
            email: values.email,
            code: values.code,
            newPassword: values.newPassword,
          }))}>
            <Field label={t('common.email')} error={form.formState.errors.email?.message}>
              <Input autoComplete="email" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" {...form.register('email')} />
            </Field>

            <Field label={t('auth.verify.codeLabel')} error={form.formState.errors.code?.message}>
              <Input className="h-12 rounded-[18px] border-[#d8e1e8] px-4 text-center tracking-[0.35em]" inputMode="numeric" maxLength={6} {...form.register('code')} />
            </Field>

            <Field label={t('auth.reset.newPassword')} error={form.formState.errors.newPassword?.message}>
              <Input autoComplete="new-password" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" type="password" {...form.register('newPassword')} />
            </Field>

            <Field label={t('auth.register.confirmPassword')} error={form.formState.errors.confirmPassword?.message}>
              <Input autoComplete="new-password" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" type="password" {...form.register('confirmPassword')} />
            </Field>

            {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

            <Button className="h-12 w-full rounded-[16px] bg-[#2688b4] text-sm font-semibold shadow-none hover:bg-[#227ca4]" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? t('auth.reset.submitting') : t('auth.reset.submit')}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <Link className="font-medium text-sky-700 hover:underline" to="/login">
              {t('common.backToLogin')}
            </Link>
            <Link className="text-slate-500 hover:underline" to="/forgot-password">
              {t('auth.forgot.title')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-[15px] font-semibold text-slate-900">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
