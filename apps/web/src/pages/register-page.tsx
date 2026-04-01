import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { BrandLogo } from '../components/branding/brand-logo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

type RegisterFormValues = {
  fullName: string
  email: string
  confirmEmail: string
  password: string
  confirmPassword: string
  organizationName: string
}

type VerifyFormValues = {
  code: string
}

export function RegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)
  const pendingEmail = searchParams.get('email') ?? ''
  const initialStep = searchParams.get('step') === 'verify' && pendingEmail ? 'verify' : 'form'
  const [step, setStep] = useState<'form' | 'verify'>(initialStep)
  const [deliveryMessage, setDeliveryMessage] = useState('')
  const [canResendAt, setCanResendAt] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (step !== 'verify') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [step])

  const registerSchema = z.object({
    fullName: z.string().min(3, t('validation.name')),
    email: z.string().email(t('validation.email')),
    confirmEmail: z.string().email(t('validation.email')),
    password: z.string().regex(strongPasswordRegex, t('validation.passwordStrong')),
    confirmPassword: z.string(),
    organizationName: z.string().min(3, t('validation.name')),
  }).superRefine((values, context) => {
    if (values.email !== values.confirmEmail) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmEmail'], message: t('auth.register.emailMismatch') })
    }
    if (values.password !== values.confirmPassword) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: t('auth.register.passwordMismatch') })
    }
  })

  const verifySchema = z.object({
    code: z.string().regex(/^\d{6}$/, t('auth.verify.codeRule')),
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: pendingEmail,
      confirmEmail: pendingEmail,
      password: '',
      confirmPassword: '',
      organizationName: '',
    },
  })

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: searchParams.get('code') ?? '' },
  })

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (response) => {
      setDeliveryMessage(response.message)
      setCanResendAt(response.canResendAt)
      setStep('verify')
      setSearchParams({ step: 'verify', email: response.email })
      verifyForm.reset({ code: '' })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (payload: { email: string; code: string }) => api.verifyEmail(payload),
    onSuccess: (response) => {
      setSession(response)
      navigate('/app/dashboard')
    },
  })

  const resendMutation = useMutation({
    mutationFn: (email: string) => api.resendVerification({ email }),
    onSuccess: (response) => {
      setDeliveryMessage(response.message)
      setCanResendAt(response.canResendAt)
    },
  })

  const resendDisabled = useMemo(() => {
    if (!canResendAt) return false
    return new Date(canResendAt).getTime() > now
  }, [canResendAt, now])

  const resendRemainingSeconds = useMemo(() => {
    if (!canResendAt) return 0
    return Math.max(0, Math.ceil((new Date(canResendAt).getTime() - now) / 1000))
  }, [canResendAt, now])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(27,125,167,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(223,241,234,0.88),transparent_28%),linear-gradient(180deg,#f7fbfd_0%,#eef5f7_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[420px] rounded-[30px] border-[#d8e1e8] bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:max-w-[460px] xl:max-w-[520px]">
        <div className="space-y-6 px-7 py-7 xl:px-8 xl:py-8">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-12 w-12 shrink-0" variant="mark" />
            <div>
              <p className="text-[1.06rem] font-semibold leading-none text-slate-950">{t('app.name')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('shell.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              {step === 'form' ? t('auth.register.kicker') : t('auth.verify.kicker')}
            </p>
            <h1 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 xl:text-[2.18rem]">
              {step === 'form' ? t('auth.register.title') : t('auth.verify.title')}
            </h1>
            <p className="text-[15px] leading-7 text-slate-500">
              {step === 'form' ? t('auth.register.subtitle') : t('auth.verify.subtitle')}
            </p>
          </div>

          {step === 'form' ? (
            <>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{t('auth.register.passwordRulesTitle')}</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  <li>{t('auth.register.passwordRuleLength')}</li>
                  <li>{t('auth.register.passwordRuleCase')}</li>
                  <li>{t('auth.register.passwordRuleNumber')}</li>
                  <li>{t('auth.register.passwordRuleSpecial')}</li>
                </ul>
              </div>

              <form
                className="space-y-4"
                onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate({
                  fullName: values.fullName,
                  email: values.email,
                  password: values.password,
                  organizationName: values.organizationName,
                }))}
              >
                <Field label={t('common.name')} error={registerForm.formState.errors.fullName?.message}>
                  <Input autoComplete="name" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" {...registerForm.register('fullName')} />
                </Field>
                <Field label={t('common.organization')} error={registerForm.formState.errors.organizationName?.message}>
                  <Input className="h-12 rounded-[18px] border-[#d8e1e8] px-4" {...registerForm.register('organizationName')} />
                </Field>
                <Field label={t('common.email')} error={registerForm.formState.errors.email?.message}>
                  <Input autoComplete="email" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" {...registerForm.register('email')} />
                </Field>
                <Field label={t('auth.register.confirmEmail')} error={registerForm.formState.errors.confirmEmail?.message}>
                  <Input autoComplete="email" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" {...registerForm.register('confirmEmail')} />
                </Field>
                <Field label={t('common.password')} error={registerForm.formState.errors.password?.message}>
                  <Input autoComplete="new-password" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" type="password" {...registerForm.register('password')} />
                </Field>
                <Field label={t('auth.register.confirmPassword')} error={registerForm.formState.errors.confirmPassword?.message}>
                  <Input autoComplete="new-password" className="h-12 rounded-[18px] border-[#d8e1e8] px-4" type="password" {...registerForm.register('confirmPassword')} />
                </Field>

                {registerMutation.isError && <p className="text-sm text-red-600">{registerMutation.error.message}</p>}

                <Button className="h-12 w-full rounded-[16px] bg-[#2688b4] text-sm font-semibold shadow-none hover:bg-[#227ca4]" disabled={registerMutation.isPending} type="submit">
                  {registerMutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[18px] border border-sky-100 bg-sky-50 px-4 py-4 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-900">{deliveryMessage || t('auth.verify.sentTitle')}</p>
                <p className="mt-1">{t('auth.verify.sentHelp', { email: pendingEmail })}</p>
              </div>

              <form className="space-y-4" onSubmit={verifyForm.handleSubmit((values) => verifyMutation.mutate({ email: pendingEmail, code: values.code }))}>
                <Field label={t('auth.verify.codeLabel')} error={verifyForm.formState.errors.code?.message}>
                  <Input className="h-12 rounded-[18px] border-[#d8e1e8] px-4 text-center tracking-[0.35em]" inputMode="numeric" maxLength={6} {...verifyForm.register('code')} />
                </Field>

                {verifyMutation.isError && <p className="text-sm text-red-600">{verifyMutation.error.message}</p>}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="h-12 flex-1 rounded-[16px] bg-[#2688b4] text-sm font-semibold shadow-none hover:bg-[#227ca4]" disabled={verifyMutation.isPending} type="submit">
                    {verifyMutation.isPending ? t('auth.verify.submitting') : t('auth.verify.submit')}
                  </Button>
                  <Button
                    className="h-12 rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-200 sm:px-6"
                    disabled={resendMutation.isPending || resendDisabled}
                    onClick={() => resendMutation.mutate(pendingEmail)}
                    type="button"
                  >
                    {resendMutation.isPending
                      ? t('auth.verify.resending')
                      : resendDisabled
                        ? t('auth.verify.resendWait', { seconds: resendRemainingSeconds })
                        : t('auth.verify.resend')}
                  </Button>
                </div>
              </form>

              <button
                className="text-sm font-medium text-sky-700 hover:underline"
                onClick={() => {
                  setStep('form')
                  setSearchParams({})
                }}
                type="button"
              >
                {t('auth.verify.backToRegister')}
              </button>
            </div>
          )}

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
