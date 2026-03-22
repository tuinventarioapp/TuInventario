---
name: documentation-keeper
description: Mantener sincronizada la documentacion de TuInventario con cada cambio funcional o tecnico. Usar cuando una tarea modifique reglas, pantallas, endpoints, entidades, despliegue o flujos, y se necesite actualizar los documentos afectados y dejar handover claro.
---

# Documentation Keeper

## Iniciar

Leer:

1. `../../00-master/09-ai-execution-rules.md`
2. `../../00-master/08-definition-of-done.md`
3. `references/handover.md`

## Actualizar

- reglas de negocio si cambia el comportamiento;
- frontend si cambian pantallas o UX;
- backend si cambian endpoints o servicios;
- base de datos si cambian tablas, migraciones o seeds;
- delivery si cambia despliegue o variables.

## Entregar

- resumen corto de cambios;
- lista de documentos actualizados;
- pruebas ejecutadas;
- pendientes conocidos.

## Evitar

- dejar documentos desalineados;
- cerrar tareas sin handover;
- actualizar solo el codigo y no la fuente de verdad.
