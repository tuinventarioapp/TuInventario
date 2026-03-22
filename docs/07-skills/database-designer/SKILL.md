---
name: database-designer
description: Diseñar, validar y evolucionar la base de datos PostgreSQL de TuInventario con migraciones, constraints, indices y soporte para MCP. Usar cuando la tarea afecte entidades, relaciones, seeds, rendimiento de consultas o consistencia de datos.
---

# Database Designer

## Iniciar

Leer:

1. `../../01-business/03-domain-rules.md`
2. `../../04-database/01-data-model-overview.md`
3. `../../04-database/03-relational-schema.md`
4. `../../04-database/04-migrations-and-seeds.md`
5. `../../04-database/07-db-mcp-guidelines.md`
6. `references/patterns.md`

## Implementar

- modelar multi-organizacion desde la raiz;
- proteger reglas con constraints cuando sea razonable;
- crear migraciones versionadas;
- mantener seeds controladas;
- agregar indices solo con base en consultas reales.

## Verificar

- aplicar migraciones desde cero;
- probar constraints;
- revisar queries criticas;
- comparar esquema real con documentacion.

## Documentar

- tablas nuevas o modificadas;
- impacto en backend y frontend;
- riesgos de datos;
- pruebas de validacion.
