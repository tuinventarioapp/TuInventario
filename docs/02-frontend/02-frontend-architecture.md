# Arquitectura frontend

## Objetivo

Construir un frontend rapido, mantenible y orientado a operaciones frecuentes.

## Stack recomendado

- React 19+ con TypeScript;
- Vite;
- React Router;
- Tailwind CSS;
- shadcn/ui;
- TanStack Query;
- Zustand;
- React Hook Form;
- Zod.

## Estructura sugerida

```text
apps/web/src/
  app/
  routes/
  pages/
  features/
  components/
  layouts/
  hooks/
  lib/
  services/
  store/
  types/
```

## Reglas de arquitectura

- organizar por `feature` y no por tipo tecnico cuando el modulo lo justifique;
- mantener paginas delgadas;
- mover llamadas HTTP a `services`;
- encapsular formularios complejos en cada `feature`;
- centralizar transformaciones UI/API;
- evitar logica de negocio pesada en componentes visuales.

## Ejemplo de feature

`features/items/` puede contener:

- tabla;
- filtros;
- formulario;
- hooks de consulta;
- adaptadores de DTO;
- validaciones del formulario.
