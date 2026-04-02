---
name: database-designer
description: Diseñar, validar y evolucionar PostgreSQL en TuInventario usando el esquema real, migraciones versionadas y restricciones alineadas con el dominio actual.
---

# Database Designer

## Iniciar

Leer:

1. `../../01-business/03-domain-rules.md`
2. `../../04-database/01-data-model-overview.md`
3. `../../04-database/03-relational-schema.md`
4. `../../04-database/04-migrations-and-seeds.md`
5. `references/patterns.md`

## Implementar

- modelar multi-organizacion desde la raiz
- agregar migraciones versionadas
- usar indices segun consultas reales
- documentar legados y diferencias entre esquema y app

## Verificar

- aplicar migraciones desde cero
- revisar constraints
- comparar esquema real con entidades y documentacion

## Documentar

- tablas y columnas nuevas
- impactos en backend y frontend
- riesgos de compatibilidad
