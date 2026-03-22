# Variables de entorno

## Backend

- `APP_ENV`
- `APP_BASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `STORAGE_PROVIDER`

## Frontend

- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_APP_NAME`

## Reglas

- documentar default y obligatoriedad;
- nunca hardcodear secretos;
- separar `.env.local`, `.env.staging` y `.env.production`;
- mantener un `.env.example` actualizado.
