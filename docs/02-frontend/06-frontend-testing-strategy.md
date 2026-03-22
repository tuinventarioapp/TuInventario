# Estrategia de testing frontend

## Herramientas recomendadas

- Vitest;
- React Testing Library;
- Playwright para E2E.

## Cobertura objetivo

- componentes y hooks criticos;
- formularios de item, movimiento y prestamo;
- rutas protegidas;
- estados vacios, errores y loading;
- flujo E2E de login y operaciones principales.

## Casos prioritarios

- login correcto e incorrecto;
- creacion de item;
- validacion de movimiento invalido;
- flujo de prestamo y devolucion;
- permisos visibles en UI;
- actualizacion de estado tras evento en tiempo real.

## Regla

No buscar cobertura extrema de componentes triviales. Invertir primero en flujos que puedan romper operacion o confianza del usuario.
