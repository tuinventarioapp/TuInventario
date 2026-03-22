import { PageHeader } from '../components/shared/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Exporta CSV y PDF con el estado operativo del sistema." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Inventario CSV</h2>
          <Button onClick={() => window.open(`${API_BASE_URL}/reports/inventory.csv`, '_blank')}>Descargar</Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Prestamos CSV</h2>
          <Button onClick={() => window.open(`${API_BASE_URL}/reports/loans.csv`, '_blank')}>Descargar</Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Inventario PDF</h2>
          <Button onClick={() => window.open(`${API_BASE_URL}/reports/inventory.pdf`, '_blank')}>Descargar</Button>
        </Card>
      </div>
    </div>
  )
}
