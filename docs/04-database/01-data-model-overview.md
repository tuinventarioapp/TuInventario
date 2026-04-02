# Panorama del modelo de datos

## Tablas reales

Tablas de negocio y soporte:

- `organizations`
- `roles`
- `users`
- `memberships`
- `categories`
- `units`
- `locations`
- `location_categories`
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
- `auth_codes`

Tabla tecnica:

- `flyway_schema_history`

## Modulos del modelo

- identidad y acceso: `users`, `roles`, `memberships`, `refresh_tokens`, `auth_codes`
- organizacion y catalogos: `organizations`, `categories`, `units`, `locations`, `location_categories`
- inventario: `items`, `item_images`, `stock_movements`, `stock_snapshots`
- prestamos: `borrowers`, `loan_requests`, `loans`, `loan_items`
- soporte: `audit_logs`, `notifications`

## Observaciones importantes

- `notifications` existe en base de datos, pero hoy no tiene flujo completo en backend y frontend
- `item_images` y `stock_snapshots` existen en el esquema, pero no tienen protagonismo funcional en la app actual
- el esquema todavia conserva columnas heredadas del concepto de dano, aunque el backend actual ya no las usa como parte central del dominio
