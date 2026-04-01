# TuInventario

TuInventario es un MVP funcional para gestionar inventario, movimientos, ubicaciones y prestamos desde una sola aplicacion.

## Stack

- Frontend: React + TypeScript + Vite + React Router + Tailwind + Zustand + TanStack Query
- Backend: Spring Boot + Java 21 + JPA/Hibernate + Flyway + JWT + OpenAPI + WebSocket
- Base de datos: PostgreSQL
- Infra local: Docker Compose

## Estructura

```text
TuInventario-app/
  apps/
    api/
    web/
  docs/
  infra/
  scripts/
  docker-compose.yml
  .env.example
```

## Arranque rapido

1. Copia `.env.example` a `.env` si quieres personalizar valores.
2. Ejecuta:

```powershell
docker compose up --build
```

3. Abre:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8080](http://localhost:8080)
- Swagger: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Usuarios iniciales

- Administrador
  - email: `admin@admin.com`
  - password: `admin123`
- Colaborador
  - email: `colaborador@colaborador.com`
  - password: `colaborador123`
- Trabajador
  - email: `trabajador@trabajador.com`
  - password: `trabajador123`

## Funcionalidades cubiertas

- autenticacion y session JWT
- registro publico de administradores con verificacion por correo
- recuperacion de contrasena para administradores con codigo y enlace por email
- organizacion inicial y onboarding basico
- usuarios y roles
- categorias, unidades, ubicaciones y prestatarios
- catalogos administrables desde el frontend
- items con stock inicial
- movimientos de inventario
- solicitudes, aprobacion, entrega y devolucion de prestamos
- dashboard
- auditoria
- reportes CSV y PDF
- interfaz multidioma (es, en, pt)
- sincronizacion por WebSocket para invalidar datos en tiempo real

## Desarrollo local sin Docker

### Backend

```powershell
cd apps/api
./mvnw.cmd spring-boot:run
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
./mvnw.cmd test
```

### Frontend

```powershell
cd apps/web
npm test
```

## Flujo de correo para administradores

- `POST /api/v1/auth/register` crea una organizacion y una cuenta `ADMIN` pendiente de verificacion.
- el sistema envia un codigo de 6 digitos al correo indicado usando Brevo SMTP.
- `POST /api/v1/auth/verify-email` valida el codigo y crea la sesion del admin inmediatamente.
- `POST /api/v1/auth/resend-verification` reenvia el codigo respetando expiracion, cooldown y limite de reintentos.
- `POST /api/v1/auth/forgot-password` envia un codigo y un enlace al correo del admin.
- `POST /api/v1/auth/reset-password` valida el codigo y actualiza la contrasena.

## Documentacion

La documentacion del proyecto usada como fuente de verdad vive en `docs/`.

## Manual de uso

Consulta el manual funcional en `docs/09-manual-usuario/`.
