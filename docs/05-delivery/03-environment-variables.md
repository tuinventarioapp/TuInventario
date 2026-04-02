# Variables de entorno reales

## Backend

- `APP_ENV`
- `APP_DEMO_SEED_ENABLED`
- `APP_BASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_ORIGIN`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `MAIL_FROM_NAME`

## Frontend

- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_APP_NAME`

## Defaults del repo

Ver `.env.example`.

Puntos clave:

- el backend usa `DB_PORT=5432` dentro de Docker
- la base se expone al host en `55432`
- el correo esta preparado para SMTP compatible con Brevo
- `APP_DEMO_SEED_ENABLED=true` crea data demo si el entorno no es produccion

## Variables no activas

No existe hoy en `.env.example` una variable real como `STORAGE_PROVIDER`. No debe documentarse como obligatoria.
