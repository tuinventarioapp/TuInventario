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

## Usuarios demo

- Admin demo
  - email: `demo@tuinventario.local`
  - password: `Demo12345!`
- Gestor demo
  - email: `gestor@tuinventario.local`
  - password: `Gestor12345!`

## Funcionalidades cubiertas

- autenticacion y session JWT
- organizacion demo y onboarding basico
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

## Documentacion

La documentacion del proyecto usada como fuente de verdad vive en `docs/`.

## Manual de uso

Consulta el manual funcional en `docs/09-manual-usuario/`.
