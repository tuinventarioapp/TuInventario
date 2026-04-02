# Auditoria e historial

## Lo que existe hoy

La tabla `audit_logs` guarda:

- `organization_id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `payload`
- timestamps base

## Alcance real

- auditoria funcional de cambios relevantes
- consulta paginada desde `/api/v1/audit`
- filtrado por tipo de entidad, accion, actor y rango de fechas

## Lo que no existe hoy

- `payload_before`
- `payload_after`
- `metadata` estructurada

## Regla practica

La auditoria no reemplaza el historial operativo de movimientos y prestamos; ambas capas conviven y responden preguntas distintas.
