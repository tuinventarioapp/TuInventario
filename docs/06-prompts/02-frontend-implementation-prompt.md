# Prompt para implementacion frontend

## Uso

Usar cuando la IA vaya a modificar o ampliar el frontend existente.

## Prompt sugerido

```text
Analiza primero el frontend actual de TuInventario y luego implementa los cambios necesarios sin romper la app.

Lee:
- 00-master/09-ai-execution-rules.md
- 02-frontend/01-screen-map.md
- 02-frontend/02-frontend-architecture.md
- 02-frontend/04-state-management.md
- 02-frontend/05-realtime-and-notifications.md
- 02-frontend/07-forms-and-validation-rules.md

Stack real:
- React + TypeScript + Vite
- React Router
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form + Zod

Haz:
- respetar rutas y pantallas reales
- consumir `src/lib/api.ts` de forma consistente
- mantener responsive y accesibilidad base
- conservar desktop mientras mejoras mobile
- documentar pantallas, contratos y pruebas impactadas

No hagas:
- introducir librerias UI no presentes sin justificacion
- documentar pantallas que no existan
- mover logica de negocio compleja a componentes
```
