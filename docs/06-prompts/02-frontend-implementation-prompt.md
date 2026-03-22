# Prompt para implementacion frontend

## Uso

Usar cuando la IA vaya a construir o ampliar la aplicacion React.

## Prompt sugerido

```text
Implementa el frontend de TuInventario siguiendo la documentacion del proyecto.

Lee:
- 00-master/09-ai-execution-rules.md
- 02-frontend/01-screen-map.md
- 02-frontend/02-frontend-architecture.md
- 02-frontend/03-ui-ux-guidelines.md
- 02-frontend/04-state-management.md
- 02-frontend/07-forms-and-validation-rules.md

Stack obligatorio:
- React + TypeScript + Vite;
- React Router;
- Tailwind + shadcn/ui;
- TanStack Query;
- Zustand.

Haz:
- estructura de rutas;
- layouts;
- features por dominio;
- formularios;
- tablas;
- manejo de estados loading, error y vacio;
- consumo consistente de API;
- pruebas relevantes.

No hagas:
- logica de negocio pesada en componentes;
- estilos improvisados sin seguir las guias;
- soluciones que ignoren responsive o accesibilidad.

Documenta:
- pantallas construidas;
- contratos consumidos;
- decisiones de UX;
- pruebas ejecutadas.
```
