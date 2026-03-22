# Entidades y campos clave

## organization

- `id`
- `name`
- `slug`
- `timezone`
- `status`

## user

- `id`
- `email`
- `password_hash`
- `full_name`
- `phone`
- `avatar_url`
- `status`

## membership

- `id`
- `organization_id`
- `user_id`
- `role_id`
- `status`

## item

- `id`
- `organization_id`
- `category_id`
- `unit_id`
- `primary_location_id`
- `name`
- `sku`
- `type`
- `description`
- `status`
- `is_consumable`
- `is_lendable`

## stock_movement

- `id`
- `organization_id`
- `item_id`
- `type`
- `quantity`
- `source_location_id`
- `target_location_id`
- `reason`
- `performed_by_user_id`
- `occurred_at`

## loan

- `id`
- `organization_id`
- `borrower_id`
- `status`
- `approved_by_user_id`
- `delivered_by_user_id`
- `loaned_at`
- `due_at`
- `returned_at`

## loan_item

- `id`
- `loan_id`
- `item_id`
- `quantity`
- `returned_quantity`
- `item_condition_on_return`

## audit_log

- `id`
- `organization_id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `payload`
- `created_at`
