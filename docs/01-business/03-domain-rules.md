# Reglas de dominio

## Reglas troncales

- `BR-001`: el sistema trabaja aislado por `organizationId`
- `BR-002`: ningun cambio operativo debe dejar stock negativo
- `BR-003`: las acciones criticas deben quedar auditadas en backend
- `BR-004`: una solicitud de prestamo no equivale a una entrega real
- `BR-005`: una devolucion correcta debe devolver disponibilidad al inventario
- `BR-006`: usuarios bloqueados, no verificados o eliminados logicamente no pueden autenticar

## Reglas de catalogos y ubicaciones

- `BR-007`: categorias, unidades, categorias de ubicacion y ubicaciones pertenecen a una sola organizacion
- `BR-008`: un `ITEM` pertenece a una ubicacion principal concreta
- `BR-009`: el SKU del item es unico por organizacion y ubicacion principal
- `BR-010`: un usuario `MANAGER` o `COLLABORATOR` puede quedar restringido a una sola sede mediante `assignedLocationId`

## Reglas de inventario

- `BR-011`: `ENTRY` suma stock disponible
- `BR-012`: `EXIT` descuenta stock disponible
- `BR-013`: `ADJUSTMENT` exige motivo y responsable
- `BR-014`: `TRANSFER` mueve stock entre sedes como una sola operacion logica
- `BR-015`: el stock minimo es una alerta operativa, no una reserva automatica
- `BR-016`: el estado del item se deriva de la operacion y del stock agregado

## Reglas de prestamos

- `BR-017`: no se puede aprobar ni entregar mas cantidad que la disponible
- `BR-018`: una solicitud puede ser aprobada o rechazada
- `BR-019`: un prestamo aprobado consume stock reservado
- `BR-020`: un prestamo entregado consume stock prestado
- `BR-021`: una devolucion parcial o total devuelve stock disponible
- `BR-022`: el flujo actual solo reconoce `GOOD` y `LOST` como condicion de devolucion
- `BR-023`: prestamos vencidos se marcan automaticamente por job backend

## Reglas de acceso

- `BR-024`: el registro publico crea solo cuentas `ADMIN`
- `BR-025`: una cuenta `ADMIN` nueva debe verificar su correo antes de operar
- `BR-026`: `forgot-password` y `reset-password` publicos aplican solo a administradores
- `BR-027`: usuarios internos no admin se gestionan desde el panel por un administrador
- `BR-028`: los enlaces publicos de solicitud de prestamo requieren `organizationId`
