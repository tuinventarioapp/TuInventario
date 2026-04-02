# Esquema relacional real

## Relacion principal

- `organizations` 1:N `memberships`
- `users` 1:N `memberships`
- `roles` 1:N `memberships`
- `locations` 1:N `memberships` por `assigned_location_id`

## Catalogos e inventario

- `organizations` 1:N `categories`
- `organizations` 1:N `units`
- `organizations` 1:N `location_categories`
- `organizations` 1:N `locations`
- `location_categories` 1:N `locations`
- `organizations` 1:N `items`
- `categories` 1:N `items`
- `units` 1:N `items`
- `locations` 1:N `items`
- `items` 1:N `item_images`
- `items` 1:N `stock_movements`
- `items` 1:N `stock_snapshots`

## Prestamos

- `organizations` 1:N `borrowers`
- `users` 1:1 `borrowers` por `borrowers.user_id` cuando el prestatario tambien tiene cuenta
- `borrowers` 1:N `loan_requests`
- `items` 1:N `loan_requests`
- `users` 1:N `loan_requests` por `requested_by_user_id`
- `borrowers` 1:N `loans`
- `loan_requests` 1:N `loans` en el flujo clasico
- `loans` 1:N `loan_items`
- `items` 1:N `loan_items`

## Unicidades reales

- `organizations.slug`
- `users.email`
- `roles.name`
- `memberships (organization_id, user_id)`
- `categories (organization_id, name)`
- `units (organization_id, name)`
- `location_categories (organization_id, name)`
- `locations (organization_id, name)`
- `items (organization_id, primary_location_id, sku)`
- `borrowers.user_id`
- `refresh_tokens.token`

## Notas

- `notifications` esta relacionada con `organizations` y `users`, pero hoy no hay un flujo funcional completo consumiendola
- `loan_requests.request_group_id` y `loans.request_group_id` soportan agrupacion de solicitudes/prestamos de prestatarios con cuenta
