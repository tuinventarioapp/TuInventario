# Manejo de estado

## Estado del servidor

TanStack Query se usa para:

- listas y detalles
- mutaciones y revalidacion
- invalidacion despues de acciones
- refresco despues de eventos WebSocket

## Estado cliente

Zustand se usa hoy principalmente para:

- sesion autenticada
- tokens
- usuario actual

## Formularios

- React Hook Form para captura
- Zod para validacion del lado cliente
- el backend sigue siendo autoridad final

## Observacion actual

No hay una capa compleja de estado global de UI. La mayor parte del comportamiento sigue concentrada en las paginas y hooks por modulo.
