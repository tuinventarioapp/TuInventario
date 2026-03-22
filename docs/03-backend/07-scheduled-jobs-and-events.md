# Jobs programados y eventos

## Jobs del MVP

- marcar prestamos vencidos;
- enviar recordatorios de devolucion;
- generar reportes periodicos si se habilita por configuracion;
- tareas de limpieza tecnica seguras.

## Eventos funcionales sugeridos

- `item.created`
- `stock.changed`
- `loan.requested`
- `loan.approved`
- `loan.delivered`
- `loan.returned`
- `loan.overdue`

## Reglas

- los jobs deben ser idempotentes;
- no emitir eventos duplicados sin control;
- registrar resultado y errores de cada job;
- evitar que un job cambie datos de otra organizacion por error.

## Ejemplo

El job de vencimientos debe recalcular solo prestamos activos o entregados con fecha comprometida expirada y sin devolucion final.
