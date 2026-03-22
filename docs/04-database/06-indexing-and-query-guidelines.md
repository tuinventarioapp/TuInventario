# Indices y reglas de consulta

## Indices prioritarios

- `items(organization_id, sku)`
- `items(organization_id, name)`
- `stock_movements(organization_id, item_id, occurred_at desc)`
- `loans(organization_id, status, due_at)`
- `loan_items(loan_id, item_id)`
- `audit_logs(organization_id, created_at desc)`
- `borrowers(organization_id, email)`

## Reglas de consulta

- filtrar siempre por `organization_id`;
- paginar listas grandes;
- evitar N+1 en historiales y detalle;
- preferir proyecciones para dashboards;
- usar indices compatibles con filtros y ordenamientos reales.

## Ejemplo

El listado de prestamos vencidos debe poder filtrar por organizacion, estado y fecha sin escanear la tabla completa.
