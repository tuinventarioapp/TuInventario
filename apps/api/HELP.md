# TuInventario API

Backend Spring Boot de TuInventario.

## Responsabilidad actual

- autenticacion JWT con refresh token
- registro publico de administradores con verificacion por correo
- recuperacion de contrasena por correo para administradores
- gestion multi-organizacion y control por rol
- catalogos, inventario, movimientos, prestamos, reportes, auditoria y configuracion
- publicacion de eventos basicos por WebSocket
- migraciones automticas con Flyway

## Ejecutar en local

```powershell
.\mvnw.cmd spring-boot:run
```

## Ejecutar pruebas

```powershell
.\mvnw.cmd test
```

## Endpoints utiles

- health: `/actuator/health`
- swagger: `/swagger-ui.html`
- api base: `/api/v1`

## Variables clave

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `APP_ENV`, `APP_BASE_URL`, `APP_DEMO_SEED_ENABLED`, `FRONTEND_ORIGIN`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_FROM_NAME`
