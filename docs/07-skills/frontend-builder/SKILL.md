---
name: frontend-builder
description: Implementar o refactorizar el frontend React de TuInventario con arquitectura por features, UX operativa, formularios robustos, estado bien separado y pruebas relevantes. Usar cuando la tarea afecte pantallas, rutas, componentes, formularios, tablas, estado cliente o integracion con la API.
---

# Frontend Builder

## Iniciar

Leer:

1. `../../00-master/09-ai-execution-rules.md`
2. `../../02-frontend/01-screen-map.md`
3. `../../02-frontend/02-frontend-architecture.md`
4. `../../02-frontend/03-ui-ux-guidelines.md`
5. `../../02-frontend/04-state-management.md`
6. `references/patterns.md`

## Implementar

- organizar por feature;
- usar TanStack Query para estado servidor;
- usar Zustand solo para estado de interfaz;
- usar formularios claros y validados;
- reflejar permisos y estados en UI;
- mantener experiencia mobile usable desde el inicio.

## Verificar

- revisar loading, error y empty states;
- probar accesibilidad base;
- validar responsive en flujos principales;
- ejecutar pruebas de componentes y E2E relevantes.

## Documentar

- pantallas cambiadas;
- contratos consumidos;
- decisiones de UX;
- riesgos pendientes.
