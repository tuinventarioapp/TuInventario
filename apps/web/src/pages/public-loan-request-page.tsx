import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { Notice } from '../components/shared/notice'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'
import { useI18n } from '../i18n/use-i18n'

type FormValues = {
  borrowerName: string
  borrowerEmail?: string
  borrowerPhone?: string
  itemId: string
  quantity: number
  dueAt: string
  notes?: string
}

export function PublicLoanRequestPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const organizationId = searchParams.get('organizationId') ?? ''
  const schema = z.object({
    borrowerName: z.string().min(3, t('validation.name')),
    borrowerEmail: z.string().email(t('validation.email')).optional().or(z.literal('')),
    borrowerPhone: z.string().optional(),
    itemId: z.string().min(1, t('validation.required')),
    quantity: z.coerce.number().positive(t('validation.quantity')),
    dueAt: z.string().min(1, t('validation.date')),
    notes: z.string().optional(),
  })

  const itemsQuery = useQuery({
    queryKey: ['public-items', organizationId],
    queryFn: () => api.publicItems(organizationId),
    enabled: Boolean(organizationId),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.publicLoanRequest({
        ...values,
        dueAt: new Date(values.dueAt).toISOString(),
      }),
    onSuccess: () => reset(),
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl bg-white/95">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">{t('auth.publicRequest.kicker')}</p>
          <h1 className="text-3xl font-semibold">{t('auth.publicRequest.title')}</h1>
          <p className="text-sm text-slate-600">{t('auth.publicRequest.subtitle')}</p>
        </div>

        {!organizationId && (
          <Notice variant="warning">
            {t('auth.publicRequest.missingOrganization')}
          </Notice>
        )}

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.name')}</label>
            <Input {...register('borrowerName')} />
            {errors.borrowerName && <p className="text-sm text-red-600">{errors.borrowerName.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.email')}</label>
            <Input {...register('borrowerEmail')} />
            {errors.borrowerEmail && <p className="text-sm text-red-600">{errors.borrowerEmail.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.phone')}</label>
            <Input {...register('borrowerPhone')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Item</label>
            <select className="h-11 w-full rounded-xl border border-border bg-white px-3" {...register('itemId')}>
              <option value="">{t('loans.selectItem')}</option>
              {itemsQuery.data?.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {errors.itemId && <p className="text-sm text-red-600">{errors.itemId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.quantity')}</label>
            <Input type="number" step="1" {...register('quantity')} />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.publicRequest.returnDate')}</label>
            <Input type="datetime-local" {...register('dueAt')} />
            {errors.dueAt && <p className="text-sm text-red-600">{errors.dueAt.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{t('common.notes')}</label>
            <Input {...register('notes')} />
          </div>
          {mutation.isSuccess && <Notice className="md:col-span-2" variant="success">{t('auth.publicRequest.success')}</Notice>}
          {mutation.isError && <Notice className="md:col-span-2" variant="error">{mutation.error.message}</Notice>}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={!organizationId || mutation.isPending} type="submit">{t('auth.publicRequest.submit')}</Button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          {t('common.backToLogin')}: <Link className="text-sky-700 hover:underline" to="/login">Login</Link>
        </p>
      </Card>
    </div>
  )
}
