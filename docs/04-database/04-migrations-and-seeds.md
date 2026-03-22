# Migraciones y seeds

## Herramienta

Flyway.

## Reglas

- toda mutacion estructural via migracion versionada;
- no editar migraciones ya aplicadas en entornos compartidos;
- usar seeds controlados para datos base;
- mantener scripts idempotentes cuando aplique.

## Datos semilla iniciales

- roles base;
- unidades comunes;
- estados base;
- categoria ejemplo;
- ubicacion principal;
- permisos iniciales si se modelan explicitamente.

## Convencion sugerida

- `V1__init_core_schema.sql`
- `V2__seed_base_roles_units.sql`
- `V3__create_inventory_tables.sql`

## Regla de entorno

Las seeds de desarrollo pueden ser mas ricas que las de produccion, pero nunca deben romper suposiciones del dominio.
