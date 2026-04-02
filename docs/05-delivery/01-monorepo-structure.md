# Estructura real del monorepo

```text
TuInventario-app/
  apps/
    api/
    web/
  docs/
    00-master/
    01-business/
    02-frontend/
    03-backend/
    04-database/
    05-delivery/
    06-prompts/
    07-skills/
    08-templates/
    09-manual-usuario/
  docker-compose.yml
  .env.example
  README.md
```

## Observaciones

- hoy no existe carpeta `infra/` activa en el repo
- hoy no existe `.github/workflows` con CI/CD real
- el despliegue local se apoya en Dockerfiles dentro de `apps/api` y `apps/web`
