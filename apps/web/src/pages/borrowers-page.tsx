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
import { api } from '../lib/api'

type FormValues = {
  name: string
  email: string
  phone: string
  notes: string
}

export function BorrowersPage() {
  const { t } = useI18n()
  const schema = z.object({
    name: z.string().min(3, t('validation.name')),
    email: z.union([z.string().email(t('validation.email')), z.literal('')]),
    phone: z.string(),
    notes: z.string(),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  })

  const borrowersQuery = useQuery({ queryKey: ['borrowers'], queryFn: api.borrowers })
  const mutation = useMutation({
    mutationFn: api.createBorrower,
    onSuccess: async () => {
      reset({ name: '', email: '', phone: '', notes: '' })
      await queryClient.invalidateQueries({ queryKey: ['borrowers'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('borrowers.title')} description={t('borrowers.description')} />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <form className="space-y-3" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <Input placeholder={t('common.name')} {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}

            <Input placeholder={t('common.email')} {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}

            <Input placeholder={t('common.phone')} {...register('phone')} />
            <Input placeholder={t('common.notes')} {...register('notes')} />

            {mutation.isError && <Notice variant="error">{mutation.error.message}</Notice>}
            {mutation.isSuccess && <Notice variant="success">{t('borrowers.success')}</Notice>}

            <Button className="w-full" disabled={mutation.isPending} type="submit">
              {t('borrowers.submit')}
            </Button>
          </form>
        </Card>
        <Card>
          <div className="space-y-3">
            {borrowersQuery.data?.length ? borrowersQuery.data.map((borrower) => (
              <div key={borrower.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{borrower.name}</p>
                <p className="text-sm text-slate-500">{borrower.email ?? t('common.notAvailable')} - {borrower.phone ?? t('common.notAvailable')}</p>
              </div>
            )) : <Notice>{t('borrowers.empty')}</Notice>}
          </div>
        </Card>
      </div>
    </div>
  )
}
