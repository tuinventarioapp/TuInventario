# Flujos principales

## Flujo 1: preparar la organizacion

1. Inicia sesion como `ADMIN`.
2. Entra a `Catalogos`.
3. Crea categorias, unidades, categorias de ubicacion y ubicaciones.
4. Entra a `Usuarios` y crea gestores o colaboradores si hace falta.

Resultado esperado:

- la organizacion queda lista para empezar a operar.

## Flujo 2: crear articulos o cargarlos por Excel

1. Entra a `Inventario`.
2. Usa `Nuevo articulo` si vas uno a uno.
3. Usa `Carga masiva` si vas a importar Excel.
4. En carga masiva:
5. descarga la plantilla
6. llena filas con `sku`, `nombre`, `tipo_articulo`, `categoria`, `unidad`, `ubicacion_principal`, `stock_inicial` y `stock_minimo`
7. sube el mismo archivo
8. revisa coincidencias por `SKU`
9. confirma cuales coincidencias quieres actualizar
10. aplica la carga

Resultado esperado:

- se crean articulos nuevos
- se actualizan solo coincidencias confirmadas
- las filas con error quedan reportadas sin romper la importacion

## Flujo 3: crear prestatarios

1. Entra a `Prestatarios`.
2. Elige si crearas:

- una ficha simple `Sin acceso`
- una cuenta `Con acceso`

3. Si es `Con acceso`, define nombre, correo, contrasena inicial y sede.
4. Guarda.

Resultado esperado:

- el prestatario queda disponible para prestamos internos
- o entra al sistema con rol `BORROWER`

## Flujo 4: solicitud interna de prestamo

1. Entra a `Prestamos`.
2. Ve a `Solicitudes`.
3. Selecciona prestatario.
4. Busca el articulo por nombre o SKU.
5. Define cantidad y fecha maxima de devolucion.
6. Guarda.

Resultado esperado:

- la solicitud queda pendiente para revision.

## Flujo 5: solicitud agrupada del prestatario

1. Inicia sesion con una cuenta `BORROWER`.
2. Entra a `Inventario`.
3. Filtra articulos disponibles.
4. Agrega varios articulos al carrito.
5. Define una sola fecha maxima de devolucion.
6. Envia la solicitud.

Resultado esperado:

- se crea una solicitud agrupada con varias lineas de articulo.

## Flujo 6: revision de la solicitud agrupada

1. Entra a `Prestamos` como `ADMIN` o `MANAGER`.
2. Abre `Solicitudes`.
3. Revisa la solicitud agrupada.
4. Por cada articulo decide:

- aprobar
- rechazar
- o reducir la cantidad aprobada

5. Si rechazas una linea, escribe el motivo.
6. Guarda la revision.

Resultado esperado:

- la solicitud queda aprobada total o parcialmente
- cada linea conserva su estado real

## Flujo 7: entrega del prestamo

1. Entra a `Prestamos`.
2. Busca el prestamo en `Activos`.
3. Agrega notas de entrega si hace falta.
4. Pulsa `Entregar`.

Resultado esperado:

- el prestamo sigue en `Activo`
- el inventario pasa de reservado a prestado

## Flujo 8: devolucion parcial o total

1. Busca el prestamo en `Activos`.
2. Registra por articulo:

- cantidad devuelta
- nota de devolucion

3. Guarda.

Resultado esperado:

- vuelve al inventario solo la cantidad devuelta
- el faltante queda explicado en la nota
- cuando termina el flujo, el prestamo pasa a `Cerrado`

## Flujo 9: registrar movimientos

1. Entra a `Movimientos`.
2. Busca el articulo por nombre o SKU.
3. Elige el tipo:

- entrada
- salida
- ajuste
- traslado

4. Registra cantidad, motivo y notas.
5. Guarda.

Resultado esperado:

- el stock queda actualizado
- el historial operativo queda trazable

## Flujo 10: descargar reportes

1. Entra a `Reportes`.
2. Si corresponde, define sede y rango de fechas.
3. Elige CSV o PDF.
4. Descarga el archivo.

Resultado esperado:

- el reporte se genera con el alcance correcto del rol
- el idioma del archivo sigue el idioma activo de la aplicacion

## Flujo 11: descargar el manual de uso

1. Entra a `Panel` o `Configuracion`.
2. Pulsa `Manual de uso`.

Resultado esperado:

- se descarga un PDF distinto segun el rol actual
- el manual no muestra funciones que ese rol no puede usar
