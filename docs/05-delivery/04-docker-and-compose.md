# Docker y Compose

## Servicios reales

- `db`: `postgres:16-alpine`
- `api`: build desde `apps/api/Dockerfile`
- `web`: build desde `apps/web/Dockerfile`

## Puertos

- `db`: `55432:5432`
- `api`: `8080:8080`
- `web`: `5173:80`

## Particularidades

- `api` depende del healthcheck de `db`
- `web` recibe variables Vite como `build args`
- `db` usa volumen `postgres-data`
- `api` recibe variables de mail, JWT y CORS desde compose

## Resultado real esperado

Con una sola orden se levantan frontend, backend y PostgreSQL local.
