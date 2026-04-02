# Guia de despliegue

## Estado del repo

El repo esta preparado para:

- desplegar frontend estatico en Vercel
- desplegar backend Java en una plataforma que acepte Docker o buildpacks
- conectarse a PostgreSQL administrado

## Archivos utiles ya presentes

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/web/vercel.json`

## Flujo recomendado

1. crear base PostgreSQL administrada
2. desplegar backend y configurar variables
3. desplegar frontend apuntando al backend publico
4. actualizar `FRONTEND_ORIGIN` del backend con la URL final del frontend

## Nota

La documentacion de despliegue debe tratar Render, Railway, Neon o Vercel como opciones compatibles, pero no como infraestructura ya automatizada dentro del repo.
