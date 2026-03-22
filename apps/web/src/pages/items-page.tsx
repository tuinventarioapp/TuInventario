import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '../components/shared/page-header'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'

export function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const itemsQuery = useQuery({
    queryKey: ['items', query],
    queryFn: () => api.items(query),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Consulta articulos, stock y ubicaciones principales."
        action={<Link to="/app/items/new"><Button>Nuevo item</Button></Link>}
      />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Buscar por nombre o SKU"
            defaultValue={query}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setSearchParams({ query: event.currentTarget.value })
              }
            }}
          />
          <Button onClick={() => setSearchParams({ query: '' })} className="bg-secondary text-secondary-foreground">Limpiar</Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {itemsQuery.data?.content.map((item) => (
            <Link key={item.id} to={`/app/items/${item.id}`}>
              <Card className="h-full border-slate-200 transition hover:border-sky-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.sku} · {item.category}</p>
                  </div>
                  <Badge>{item.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <p>Disponible: <strong className="text-slate-950">{item.availableStock}</strong></p>
                  <p>Reservado: <strong className="text-slate-950">{item.reservedStock}</strong></p>
                  <p>En prestamo: <strong className="text-slate-950">{item.loanedStock}</strong></p>
                  <p>Ubicacion: <strong className="text-slate-950">{item.primaryLocation}</strong></p>
                </div>
                <p className="mt-4 text-xs text-slate-500">Ultimo movimiento: {formatDate(item.lastMovementAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
