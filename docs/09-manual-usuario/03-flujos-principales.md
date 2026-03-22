# Flujos principales

## Flujo 1: crear catalogos

1. Entra a `Catalogos`.
2. Crea al menos una categoria.
3. Crea al menos una unidad.
4. Crea al menos una ubicacion.

Resultado esperado:

- ya puedes crear articulos correctamente.

## Flujo 2: crear un articulo

1. Entra a `Inventario`.
2. Pulsa `Nuevo articulo`.
3. Llena nombre, SKU, tipo, categoria, unidad y ubicacion.
4. Si lo tienes disponible desde el inicio, agrega stock inicial.
5. Guarda.

Resultado esperado:

- el articulo aparece en inventario;
- el panel muestra articulos;
- si hubo stock inicial, queda disponible para operar.

## Flujo 3: registrar un prestatario

1. Entra a `Prestatarios`.
2. Escribe nombre.
3. Agrega correo y telefono si los tienes.
4. Guarda.

Resultado esperado:

- el prestatario queda disponible para solicitudes y prestamos.

## Flujo 4: crear una solicitud de prestamo

1. Entra a `Prestamos`.
2. Elige prestatario.
3. Elige un articulo prestable con stock.
4. Escribe cantidad.
5. Elige fecha de devolucion.
6. Guarda.

Resultado esperado:

- la solicitud aparece en la lista de solicitudes.

## Flujo 5: aprobar una solicitud

1. Ve a la tarjeta de la solicitud.
2. Pulsa `Aprobar`.

Resultado esperado:

- la solicitud cambia de pendiente a aprobada;
- el stock disponible baja;
- el stock reservado sube.

## Flujo 6: entregar un prestamo

1. En la lista de prestamos, busca uno aprobado.
2. Pulsa `Entregar`.

Resultado esperado:

- el prestamo pasa a entregado;
- el stock reservado baja;
- el stock prestado sube.

## Flujo 7: registrar devolucion

1. Busca un prestamo entregado o vencido.
2. Pulsa `Registrar devolucion`.

Resultado esperado:

- el prestamo pasa a devuelto;
- el stock vuelve a disponible si el retorno fue correcto.

## Flujo 8: registrar movimientos

1. Entra a `Movimientos`.
2. Elige el tipo: entrada, salida, ajuste o traslado.
3. Elige articulo y cantidad.
4. Completa ubicaciones si aplican.
5. Escribe motivo.
6. Guarda.

Resultado esperado:

- el movimiento queda guardado;
- el stock cambia segun la regla del tipo de movimiento;
- el panel se actualiza.

## Flujo 9: descargar reportes

1. Entra a `Reportes`.
2. Elige el archivo que quieres bajar.
3. Pulsa `Descargar`.

Resultado esperado:

- se baja el archivo CSV o PDF en tu equipo.

## Flujo 10: crear usuarios internos

1. Inicia sesion como administrador.
2. Entra a `Usuarios`.
3. Llena nombre, correo, password y rol.
4. Guarda.

Resultado esperado:

- el usuario aparece en la lista.

Importante:

- los prestatarios externos no se crean aqui;
- se crean en `Prestatarios`.

## Flujo 11: usar el enlace publico

1. Comparte la URL publica con `organizationId`.
2. La persona externa completa nombre, articulo, cantidad y fecha.
3. Envia la solicitud.

Resultado esperado:

- la solicitud entra al panel interno para revision.

## Flujo 12: revisar auditoria

1. Entra a `Auditoria`.
2. Revisa accion, actor y payload.

Resultado esperado:

- puedes entender quien hizo que cosa y cuando la hizo.
