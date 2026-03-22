import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { api } from '../lib/api'

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard })

  const metrics = [
    { label: 'Articulos', value: data?.totalItems ?? 0 },
    { label: 'Stock critico', value: data?.lowStockItems ?? 0 },
    { label: 'Prestamos activos', value: data?.activeLoans ?? 0 },
    { label: 'Prestamos vencidos', value: data?.overdueLoans ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visibilidad operativa del inventario y los prestamos." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{isLoading ? '...' : metric.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Estado del MVP</h2>
            <p className="text-sm text-slate-600">Base operativa lista para probar flujos reales.</p>
          </div>
          <Badge>Tiempo real activo</Badge>
        </div>
      </Card>
    </div>
  )
}
