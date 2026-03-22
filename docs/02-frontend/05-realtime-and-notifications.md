# Tiempo real y notificaciones

## Objetivo

Reflejar cambios relevantes de inventario y prestamos sin recargar manualmente.

## Casos prioritarios

- cambios de stock visibles en listas y detalle;
- cambios de estado de prestamos;
- alertas de vencimiento;
- confirmaciones operativas.

## Estrategia

- autenticacion del canal WebSocket;
- canales por organizacion;
- eventos tipados;
- invalidacion o parche ligero de cache en frontend;
- toasts para eventos inmediatos y panel de notificaciones para eventos consultables.

## Reglas

- no usar tiempo real para evitar refetch obligatorio en eventos complejos si eso puede dejar datos inconsistentes;
- preferir evento + refetch en operaciones sensibles;
- deduplicar eventos por id;
- degradar de forma elegante si el socket falla.

## Ejemplo de evento

```json
{
  "type": "loan.overdue",
  "organizationId": "org_123",
  "loanId": "loan_456",
  "occurredAt": "2026-03-21T10:00:00Z"
}
```
