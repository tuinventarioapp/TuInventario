import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '../components/shared/page-header'
import { Card } from '../components/ui/card'
import { api } from '../lib/api'

export function SettingsPage() {
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: api.settings })

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracion" description="Resumen del espacio de trabajo activo." />
      <Card>
        <dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div><dt className="font-medium text-slate-900">Organizacion</dt><dd>{settingsQuery.data?.organizationName}</dd></div>
          <div><dt className="font-medium text-slate-900">Rol actual</dt><dd>{settingsQuery.data?.role}</dd></div>
          <div><dt className="font-medium text-slate-900">Zona horaria</dt><dd>{settingsQuery.data?.timezone}</dd></div>
          <div><dt className="font-medium text-slate-900">ID</dt><dd className="break-all">{settingsQuery.data?.organizationId}</dd></div>
        </dl>
      </Card>
    </div>
  )
}
