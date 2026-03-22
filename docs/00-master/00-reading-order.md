# Orden de lectura recomendado

Este archivo define el orden minimo para que una IA entienda el proyecto antes de escribir codigo.

## Lectura obligatoria

1. `01-project-charter.md`
2. `02-mvp-scope.md`
3. `09-ai-execution-rules.md`
4. `04-architecture-overview.md`
5. `../01-business/03-domain-rules.md`
6. `../01-business/04-core-workflows.md`
7. `../03-backend/02-modules-and-responsibilities.md`
8. `../04-database/03-relational-schema.md`
9. `../05-delivery/01-monorepo-structure.md`

## Lectura por especialidad

- Frontend: revisar `../02-frontend/`.
- Backend: revisar `../03-backend/`.
- Datos: revisar `../04-database/`.
- DevOps y despliegue: revisar `../05-delivery/`.
- QA y ejecucion por IA: revisar `../06-prompts/` y `../07-skills/`.

## Orden recomendado para construir

1. Confirmar huecos con `../06-prompts/01-discovery-and-gap-analysis-prompt.md`.
2. Crear estructura del monorepo.
3. Configurar Docker, PostgreSQL, migraciones y variables.
4. Implementar autenticacion, organizaciones y roles.
5. Implementar catalogos base: categorias, unidades, ubicaciones.
6. Implementar articulos, movimientos y auditoria.
7. Implementar prestamos, prestatarios, estados y recordatorios.
8. Implementar dashboard, reportes y tiempo real.
9. Cubrir con pruebas y documentar.
10. Preparar despliegue.

## Regla de prioridad

Si hay conflicto entre documentos:

1. prevalece `09-ai-execution-rules.md`;
2. luego reglas de negocio;
3. luego arquitectura y restricciones tecnicas;
4. luego prompts y skills.
