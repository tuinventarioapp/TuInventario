# Indices y consultas

## Indices reales relevantes

- `idx_memberships_org_user`
- `idx_categories_org_name`
- `idx_units_org_name`
- `idx_locations_org_name`
- `uq_items_org_location_sku`
- `idx_items_org_name`
- `idx_items_org_minimum_stock`
- `idx_location_categories_org_name`
- `idx_locations_org_category`
- `idx_movements_org_item_date`
- `idx_loan_requests_org_status`
- `idx_loan_requests_group`
- `idx_loan_requests_requested_by`
- `idx_loans_org_status`
- `idx_loans_group`
- `idx_audit_org_date`
- `idx_auth_codes_user_purpose_created_at`

## Reglas practicas

- filtrar siempre por organizacion cuando sea posible
- usar paginacion en listados grandes
- no documentar indices hipoteticos como si ya existieran
- distinguir entre indices de negocio y tablas legadas poco usadas

## Observacion

El backend busca muchas vistas por organizacion y, en algunos casos, por sede efectiva. La documentacion de consultas debe reflejar eso.
