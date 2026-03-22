import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

export function ItemDetailPage() {
  const { itemId } = useParams()
  const itemQuery = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => api.item(itemId!),
    enabled: Boolean(itemId),
  })

  if (!itemQuery.data) return <Card>Cargando item...</Card>

  const item = itemQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description={`SKU ${item.sku} · ${item.category}`}
        action={<Link to={`/app/items/${item.id}/edit`}><Button>Editar</Button></Link>}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Estado actual</p>
              <h2 className="mt-1 text-3xl font-semibold">{item.status}</h2>
            </div>
            <Badge>{item.type}</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <p>Disponible: <strong>{item.availableStock}</strong></p>
            <p>Reservado: <strong>{item.reservedStock}</strong></p>
            <p>Prestado: <strong>{item.loanedStock}</strong></p>
            <p>Total: <strong>{item.totalStock}</strong></p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Resumen</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div><dt className="font-medium text-slate-900">Ubicacion</dt><dd>{item.primaryLocation}</dd></div>
            <div><dt className="font-medium text-slate-900">Unidad</dt><dd>{item.unit}</dd></div>
            <div><dt className="font-medium text-slate-900">Ultimo movimiento</dt><dd>{formatDate(item.lastMovementAt)}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  )
}
