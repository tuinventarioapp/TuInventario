# Guia de despliegue

## Frontend

- proveedor objetivo: Vercel;
- build desde `apps/web`;
- variables apuntando a backend de staging o produccion;
- revisar CORS y URL de WebSocket;
- usar `https://` para API y `wss://` para WebSocket en internet.

## Backend

- proveedor objetivo: Render;
- build de Spring Boot;
- migraciones al inicio del arranque o como job controlado;
- variables seguras por entorno;
- definir `APP_ENV=production`;
- definir `APP_DEMO_SEED_ENABLED=false`;
- configurar `FRONTEND_ORIGIN` con el dominio final del frontend o una lista separada por comas.

## Base de datos

- local con Docker;
- futura nube en Supabase PostgreSQL;
- backups y restauracion deben documentarse al llegar a produccion real.

## Paso a paso resumido

1. desplegar base y configurar credenciales;
2. desplegar backend con variables y migraciones;
3. desplegar frontend con URLs finales;
4. probar login, CRUD base y WebSocket;
5. revisar logs y health checks.
