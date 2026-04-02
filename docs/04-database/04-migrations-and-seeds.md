# Migraciones y seeds reales

## Migraciones presentes

- `V1__init_core_schema.sql`
- `V2__seed_roles.sql`
- `V3__loan_returns_and_item_filters.sql`
- `V4__user_location_scope_and_local_items.sql`
- `V5__location_categories_and_filters.sql`
- `V6__minimum_stock_alerts.sql`
- `V7__soft_delete_borrowers.sql`
- `V8__remove_damaged_stock_concept.sql`
- `V9__admin_auth_email_codes.sql`
- `V10__expand_refresh_token_length.sql`
- `V11__borrower_accounts_and_grouped_loans.sql`

## Seed real

`V2` siembra estos roles:

- `ADMIN`
- `MANAGER`
- `COLLABORATOR`
- `BORROWER`

## Seed demo opcional

`DemoDataSeeder` crea:

- organizacion `TuInventario`
- categorias de ubicacion base
- ubicacion `Sede Principal`
- usuarios demo

Se activa cuando:

- `APP_DEMO_SEED_ENABLED=true`, o
- el entorno no es `production` y la variable no esta definida

## Observaciones

- `V8` no elimina columnas heredadas; actualiza datos para abandonar el concepto de dano como estado principal
- `V9` introduce `auth_codes` para verificacion y recuperacion por correo
- `V11` agrega soporte para prestatarios con cuenta y prestamos agrupados
