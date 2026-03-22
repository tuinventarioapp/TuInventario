# Reglas de dominio

## Reglas troncales

- `BR-001`: el historial nunca se elimina fisicamente.
- `BR-002`: el stock no puede quedar negativo.
- `BR-003`: ninguna accion critica puede ejecutarse sin usuario responsable.
- `BR-004`: toda accion sensible debe quedar auditada.
- `BR-005`: una solicitud de prestamo no equivale a una entrega real.
- `BR-006`: una devolucion valida debe devolver disponibilidad al inventario.
- `BR-007`: un articulo en prestamo no puede figurar simultaneamente como disponible para la misma unidad comprometida.
- `BR-008`: toda operacion debe estar aislada por organizacion.

## Reglas por tipo de item

- `BR-009`: un consumible puede tener movimientos de consumo sin ciclo de devolucion.
- `BR-010`: un activo prestable requiere trazabilidad por prestamo, estado y responsable.
- `BR-011`: un item puede definirse como consumible, prestable o mixto solo si las reglas derivadas quedan explicitas.
- `BR-012`: unidades como `kg` o `litros` deben soportar cantidades decimales; unidades discretas deben usar cantidades enteras.

## Reglas de movimientos

- `BR-013`: toda entrada suma stock disponible en la ubicacion destino.
- `BR-014`: toda salida resta stock de la ubicacion origen.
- `BR-015`: un traslado debe generar salida del origen y entrada en el destino como parte de una sola operacion logica.
- `BR-016`: un ajuste debe exigir motivo y responsable.
- `BR-017`: no se permite registrar cantidades menores o iguales a cero.

## Reglas de prestamos

- `BR-018`: no se puede prestar mas de lo disponible.
- `BR-019`: la fecha comprometida de devolucion debe ser igual o posterior a la fecha de entrega.
- `BR-020`: solo roles autorizados pueden aprobar o cerrar prestamos manualmente.
- `BR-021`: un prestamo vencido debe marcarse automaticamente si no hubo devolucion a tiempo.
- `BR-022`: devolver un item danado o perdido no equivale a dejarlo disponible; debe cambiar a su estado real.

## Reglas de seguridad y permisos

- `BR-023`: el usuario solo puede ver datos de su organizacion.
- `BR-024`: un permiso de rol no invalida las restricciones por recurso.
- `BR-025`: usuarios bloqueados o eliminados logicamente no pueden operar.

## Ejemplo operativo

Si una herramienta esta `entregada` en un prestamo, el sistema no debe permitir otro prestamo efectivo sobre la misma disponibilidad hasta que exista devolucion, perdida o mantenimiento.
