# Criterios de aceptacion base

## Inventario

- dado un item activo con stock suficiente, cuando registro una salida valida, entonces el saldo disminuye y el historial se actualiza.
- dado un item con stock insuficiente, cuando intento registrar salida o prestamo, entonces el sistema rechaza la operacion con mensaje claro.
- dado un traslado valido, cuando se confirma la operacion, entonces el origen disminuye y el destino aumenta dentro de la misma transaccion logica.

## Prestamos

- dada una solicitud pendiente, cuando un admin la aprueba, entonces pasa a `approved`.
- dado un prestamo aprobado, cuando se realiza entrega, entonces pasa a `delivered`.
- dado un prestamo sin devolucion y con fecha vencida, cuando corre el job de vencimientos, entonces pasa a `overdue`.
- dado un prestamo entregado, cuando se registra devolucion completa, entonces pasa a `returned` y se actualiza disponibilidad.

## Seguridad

- dado un usuario de otra organizacion, cuando intenta acceder a un recurso ajeno, entonces recibe denegacion.
- dado un usuario bloqueado, cuando intenta autenticar, entonces el acceso se rechaza.

## Reportes

- dado un rango de fechas y filtros validos, cuando un usuario autorizado exporta, entonces obtiene un archivo consistente con los datos visibles en pantalla.
