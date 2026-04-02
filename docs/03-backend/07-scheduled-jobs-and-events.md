# Jobs programados y eventos

## Jobs reales

- job para marcar prestamos vencidos

## Eventos reales

- el backend publica eventos STOMP por organizacion cuando cambian datos operativos
- el frontend no interpreta eventos ricos; solo invalida cache

## Reglas actuales

- el job de vencidos debe ser idempotente
- los eventos no se almacenan como historial funcional
- no existe mensajeria externa ni cola dedicada

## Pendientes

- recordatorios por correo o notificacion
- eventos mas granulares para UI
- monitoreo del job mas detallado
