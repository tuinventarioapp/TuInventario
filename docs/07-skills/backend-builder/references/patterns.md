# Patrones backend

## Flujo sugerido

controller -> application service -> domain service -> repository -> event/audit

## Regla de error

Traducir errores de dominio a respuestas HTTP coherentes. No esconder reglas de negocio detras de `500`.

## Regla de transaccion

Agrupar cambios que deban ocurrir juntos, como:

- movimiento y actualizacion de stock;
- entrega de prestamo y reserva/consumo de disponibilidad;
- devolucion y cambio de estado del item.
