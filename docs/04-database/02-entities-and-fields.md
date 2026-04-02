# Entidades y campos clave

## Identidad y acceso

- `organizations`: `id`, `name`, `slug`, `timezone`, `status`, `created_at`, `updated_at`, `deleted_at`
- `users`: `id`, `email`, `password_hash`, `full_name`, `phone`, `avatar_url`, `status`, `email_verified`, `created_at`, `updated_at`, `deleted_at`
- `roles`: `id`, `name`, `description`
- `memberships`: `id`, `organization_id`, `user_id`, `role_id`, `assigned_location_id`, `status`
- `refresh_tokens`: `id`, `user_id`, `organization_id`, `token`, `expires_at`, `revoked_at`
- `auth_codes`: `id`, `user_id`, `purpose`, `code_hash`, `expires_at`, `consumed_at`, `attempt_count`, `send_count`, `last_sent_at`

## Catalogos y ubicaciones

- `categories`: `id`, `organization_id`, `name`, `description`, `deleted_at`
- `units`: `id`, `organization_id`, `name`, `symbol`, `allows_decimal`
- `location_categories`: `id`, `organization_id`, `name`, `description`, `deleted_at`
- `locations`: `id`, `organization_id`, `name`, `type`, `description`, `location_category_id`, `deleted_at`

## Inventario

- `items`: `id`, `organization_id`, `category_id`, `unit_id`, `primary_location_id`, `name`, `sku`, `description`, `image_url`, `type`, `status`, `is_consumable`, `is_lendable`, `total_stock`, `available_stock`, `reserved_stock`, `loaned_stock`, `minimum_stock`, `last_movement_at`, `version`, `deleted_at`
- `item_images`: `id`, `item_id`, `image_url`
- `stock_movements`: `id`, `organization_id`, `item_id`, `movement_type`, `quantity`, `source_location_id`, `target_location_id`, `reason`, `notes`, `performed_by_user_id`, `occurred_at`
- `stock_snapshots`: `id`, `organization_id`, `item_id`, `captured_at`, `total_stock`, `available_stock`, `reserved_stock`, `loaned_stock`

## Prestamos

- `borrowers`: `id`, `organization_id`, `user_id`, `name`, `email`, `phone`, `notes`, `deleted_at`
- `loan_requests`: `id`, `organization_id`, `borrower_id`, `item_id`, `quantity`, `approved_quantity`, `request_group_id`, `requested_by_user_id`, `status`, `requested_at`, `due_at`, `notes`
- `loans`: `id`, `organization_id`, `borrower_id`, `loan_request_id`, `request_group_id`, `status`, `approved_by_user_id`, `delivered_by_user_id`, `loaned_at`, `due_at`, `returned_at`, `notes`
- `loan_items`: `id`, `loan_id`, `item_id`, `quantity`, `returned_quantity`, `returned_good_quantity`, `returned_damaged_quantity`, `lost_quantity`, `return_condition`, `return_notes`

## Soporte

- `audit_logs`: `id`, `organization_id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `payload`
- `notifications`: `id`, `organization_id`, `recipient_user_id`, `type`, `title`, `body`, `read_at`

## Diferencias entre esquema y uso actual

- `items.damaged_stock` sigue existiendo en la base, pero el backend actual ya no la mapea en `ItemEntity`
- `loan_items.returned_damaged_quantity` tambien existe como legado, aunque `ReturnCondition` hoy solo usa `GOOD` y `LOST`
