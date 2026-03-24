import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Notice } from '../components/shared/notice'
import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

type AuditFilters = {
  entityType: string
  action: string
  actor: string
  fromDate: string
  toDate: string
}

const initialFilters: AuditFilters = {
  entityType: '',
  action: '',
  actor: '',
  fromDate: '',
  toDate: '',
}

function prettyPayload(payload: string) {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

export function AuditPage() {
  const { t } = useI18n()
  const [draftFilters, setDraftFilters] = useState<AuditFilters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(initialFilters)
  const [page, setPage] = useState(0)
  const auditQuery = useQuery({
    queryKey: ['audit', appliedFilters, page],
    queryFn: () => api.audit({ ...appliedFilters, page, size: 10 }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('audit.title')} description={t('audit.description')} />

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950">{t('audit.helpTitle')}</h2>
        <p className="text-sm text-slate-600">{t('audit.helpDescription')}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HelpPoint title={t('audit.helpWhoTitle')} description={t('audit.helpWhoDescription')} />
          <HelpPoint title={t('audit.helpWhatTitle')} description={t('audit.helpWhatDescription')} />
          <HelpPoint title={t('audit.helpWhenTitle')} description={t('audit.helpWhenDescription')} />
          <HelpPoint title={t('audit.helpPayloadTitle')} description={t('audit.helpPayloadDescription')} />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FilterField
            label={t('audit.filterEntityType')}
            value={draftFilters.entityType}
            onChange={(value) => setDraftFilters((current) => ({ ...current, entityType: value }))}
          />
          <FilterField
            label={t('audit.filterAction')}
            value={draftFilters.action}
            onChange={(value) => setDraftFilters((current) => ({ ...current, action: value }))}
          />
          <FilterField
            label={t('audit.filterActor')}
            value={draftFilters.actor}
            onChange={(value) => setDraftFilters((current) => ({ ...current, actor: value }))}
          />
          <DateField
            label={t('audit.fromDate')}
            value={draftFilters.fromDate}
            onChange={(value) => setDraftFilters((current) => ({ ...current, fromDate: value }))}
          />
          <DateField
            label={t('audit.toDate')}
            value={draftFilters.toDate}
            onChange={(value) => setDraftFilters((current) => ({ ...current, toDate: value }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => {
            setPage(0)
            setAppliedFilters(draftFilters)
          }}>
            {t('common.apply')}
          </Button>
          <Button className="bg-secondary text-secondary-foreground" onClick={() => {
            setPage(0)
            setDraftFilters(initialFilters)
            setAppliedFilters(initialFilters)
          }}>
            {t('common.clear')}
          </Button>
        </div>
      </Card>

      {auditQuery.isError && <Notice variant="error">{auditQuery.error.message}</Notice>}

      <Card>
        <div className="space-y-3">
          {auditQuery.data?.content.length ? auditQuery.data.content.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{entry.entityType} - {entry.action}</p>
                  <p className="text-sm text-slate-500">{entry.actor}</p>
                </div>
                <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('audit.payloadLabel')}</p>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{prettyPayload(entry.payload)}</pre>
              </div>
            </div>
          )) : <Notice>{t('common.noRecords')}</Notice>}
        </div>
      </Card>

      {!!auditQuery.data?.content.length && (
        <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            {t('audit.resultSummary', {
              count: auditQuery.data.totalElements,
              page: auditQuery.data.page + 1,
              totalPages: Math.max(auditQuery.data.totalPages, 1),
            })}
          </p>
          <div className="flex gap-2">
            <Button
              className="bg-secondary text-secondary-foreground"
              disabled={page <= 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
            >
              {t('common.back')}
            </Button>
            <Button
              disabled={page + 1 >= (auditQuery.data.totalPages || 1)}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function HelpPoint({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  )
}

function FilterField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
