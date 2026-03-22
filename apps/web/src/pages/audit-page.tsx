import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '../components/shared/page-header'
import { Card } from '../components/ui/card'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

export function AuditPage() {
  const auditQuery = useQuery({ queryKey: ['audit'], queryFn: () => api.audit() })

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Rastro de acciones criticas para soporte y control." />
      <Card>
        <div className="space-y-3">
          {auditQuery.data?.content.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{entry.entityType} · {entry.action}</p>
                  <p className="text-sm text-slate-500">{entry.actor}</p>
                </div>
                <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{entry.payload}</pre>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
