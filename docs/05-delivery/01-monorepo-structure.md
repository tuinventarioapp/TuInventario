# Estructura recomendada del monorepo

## Objetivo

Mantener frontend, backend, infraestructura y documentacion en un solo repositorio sin mezclar responsabilidades.

## Estructura sugerida

```text
tuinventario/
  apps/
    web/
    api/
  infra/
    docker/
    db/
  docs/
  scripts/
  .github/
```

## Regla

- `apps/web` para React;
- `apps/api` para Spring Boot;
- `infra/db` para migraciones y seeds si se centralizan;
- `scripts` para automatizaciones de desarrollo y release;
- `docs` para la documentacion viva del proyecto.

## Nota

Si se copia esta carpeta documental dentro del repo final, ubicarla en `docs/` respetando la estructura.
