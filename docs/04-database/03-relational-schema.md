# Esquema relacional inicial

## Tablas principales

- `organizations`
- `users`
- `roles`
- `memberships`
- `categories`
- `units`
- `locations`
- `items`
- `item_images`
- `stock_movements`
- `stock_snapshots`
- `borrowers`
- `loan_requests`
- `loans`
- `loan_items`
- `audit_logs`
- `notifications`
- `refresh_tokens`

## Restricciones unicas

- `organizations.slug`
- `users.email`
- `(organization_id, sku)` en `items`
- `(organization_id, name)` en `categories`
- reglas de unicidad equivalentes para ubicaciones segun estrategia final de jerarquia

## Foreign keys esenciales

- `memberships.organization_id -> organizations.id`
- `memberships.user_id -> users.id`
- `items.organization_id -> organizations.id`
- `items.category_id -> categories.id`
- `items.unit_id -> units.id`
- `items.primary_location_id -> locations.id`
- `stock_movements.item_id -> items.id`
- `loans.borrower_id -> borrowers.id`
- `loan_items.loan_id -> loans.id`
- `loan_items.item_id -> items.id`

## Soft delete

Usar columnas como:

- `deleted_at`
- `deleted_by`

en entidades que deban ocultarse sin perder historial.

## Nota

`stock_snapshots` es opcional al inicio, pero recomendable si los reportes historicos requieren acelerar calculos.
