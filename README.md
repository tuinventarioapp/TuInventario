# TuInventario

TuInventario es una aplicacion web para gestionar inventario, movimientos y prestamos en organizaciones con multiples sedes. El proyecto actual vive en un monorepo con frontend React, backend Spring Boot y PostgreSQL.

## Estado actual

- el sistema es multi-organizacion
- soporta roles `ADMIN`, `MANAGER`, `COLLABORATOR` y `BORROWER`
- incluye registro publico de administrador con verificacion por correo
- incluye recuperacion de contrasena por correo para administradores
- maneja catalogos, ubicaciones, articulos, stock minimo, movimientos, prestatarios y prestamos
- exporta reportes CSV y PDF
- tiene sincronizacion basica por WebSocket para invalidar cache del frontend

## Stack real

- frontend: React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS
- backend: Spring Boot 3.4.5, Java 21, Spring Security, JPA/Hibernate, Flyway, WebSocket STOMP, JavaMail
- base de datos: PostgreSQL 16
- entorno local: Docker Compose

## Estructura

```text
TuInventario-app/
  apps/
    api/
    web/
  docs/
  docker-compose.yml
  .env.example
```

## Arranque local con Docker

1. Copia `.env.example` a `.env` si quieres personalizar secretos o correo.
2. Ejecuta:

```powershell
docker compose up -d --build
```

3. Abre:

- frontend: [http://localhost:5173](http://localhost:5173)
- backend: [http://localhost:8080](http://localhost:8080)
- swagger: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Base de datos local

- host externo: `127.0.0.1`
- puerto externo: `55432`
- base: `tuinventario`
- usuario: `tuinventario`
- password por defecto: `tuinventario`

## Usuarios demo

Si `APP_DEMO_SEED_ENABLED=true`, el backend crea una organizacion demo y estos usuarios:

- `admin@admin.com` / `admin123`
- `colaborador@colaborador.com` / `colaborador123`
- `trabajador@trabajador.com` / `trabajador123`

Nota:
- el usuario `trabajador@trabajador.com` hoy se siembra con rol `MANAGER`
- estos usuarios no se crean cuando el seed demo esta deshabilitado

## Flujo de administradores por correo

- `POST /api/v1/auth/register` crea una organizacion nueva y un `ADMIN` con `emailVerified=false`
- el backend envia un codigo de 6 digitos por SMTP
- `POST /api/v1/auth/verify-email` valida el codigo y devuelve sesion
- `POST /api/v1/auth/resend-verification` reenvia el codigo
- `POST /api/v1/auth/forgot-password` envia codigo y enlace de recuperacion para admins
- `POST /api/v1/auth/reset-password` actualiza la contrasena

## Desarrollo sin Docker

### Backend

```powershell
cd apps/api
.\mvnw.cmd spring-boot:run
```

### Frontend

```powershell
cd apps/web
npm install
npm run dev
```

## Pruebas

### Backend

```powershell
cd apps/api
.\mvnw.cmd test
```

### Frontend

```powershell
cd apps/web
npm install
npm run test -- --run
npm run lint
```

## Documentacion

La fuente de verdad documental del estado actual vive en:

- `docs/README.md`
- `docs/09-manual-usuario/README.md`
