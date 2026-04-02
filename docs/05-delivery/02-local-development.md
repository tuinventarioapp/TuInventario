# Desarrollo local

## Opcion recomendada: Docker Compose

```powershell
docker compose up -d --build
```

Servicios expuestos:

- frontend: `http://localhost:5173`
- backend: `http://localhost:8080`
- base externa: `127.0.0.1:55432`

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

## Parada

```powershell
docker compose stop
docker compose down
```
