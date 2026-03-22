# Prompt para implementacion de base de datos

## Uso

Usar cuando la IA modele o modifique PostgreSQL y migraciones.

## Prompt sugerido

```text
Diseña e implementa la base de datos de TuInventario siguiendo la documentacion.

Lee:
- 01-business/03-domain-rules.md
- 04-database/01-data-model-overview.md
- 04-database/02-entities-and-fields.md
- 04-database/03-relational-schema.md
- 04-database/04-migrations-and-seeds.md
- 04-database/06-indexing-and-query-guidelines.md
- 04-database/07-db-mcp-guidelines.md

Haz:
- migraciones versionadas;
- constraints y foreign keys;
- seeds base;
- indices utiles para consultas reales;
- pruebas de integracion o validacion.

No hagas:
- cambios manuales sin migracion;
- columnas ambiguas;
- borrado fisico de historicos;
- romper multi-organizacion.

Documenta:
- tablas y relaciones nuevas o modificadas;
- impacto en reglas de negocio;
- riesgos de migracion;
- validaciones ejecutadas.
```
