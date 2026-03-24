# Flujos principales

## Flujo 1: crear catalogos globales

1. Inicia sesion como `Administrador`.
2. Entra a `Catalogos`.
3. Crea categorias.
4. Crea unidades.
5. Crea categorias de ubicacion personalizadas.
6. Crea ubicaciones o sedes y asignales una categoria de ubicacion.
7. Si hace falta, edita o elimina catalogos que no tengan uso.

Resultado esperado:

- toda la empresa queda lista para empezar a cargar articulos y usuarios.

## Flujo 2: crear usuarios y asignarlos a sedes

1. Inicia sesion como `Administrador`.
2. Entra a `Usuarios`.
3. Crea un `Gestor` o `Colaborador`.
4. Selecciona la sede asignada.
5. Guarda.
6. Si la persona cambia de sede, edita el usuario y asigna la nueva.

Resultado esperado:

- el usuario queda limitado a su sede;
- al volver a entrar vera solo esa sede.

## Flujo 3: crear un articulo

1. Entra a `Inventario`.
2. Pulsa `Nuevo articulo`.
3. Llena nombre, SKU, tipo, categoria y unidad.
4. Selecciona la ubicacion.

Nota:

- si eres `Administrador`, puedes elegir cualquier sede;
- si eres `Gestor`, la sede queda bloqueada en la tuya.

5. Si tienes existencia inicial, agrega la `Cantidad` inicial.
6. Define el `Stock minimo` si quieres que el panel te avise cuando el articulo llegue al limite operativo.

Ejemplos:

- `Cantidad 5` + `Unidad` para 5 pesas.
- `Cantidad 5` + `Kilogramo` para 5 kg de tomate.

7. Guarda.

Resultado esperado:

- el articulo aparece en inventario;
- queda asociado a una sede;
- el panel muestra el total correcto;
- la tarjeta del articulo muestra `Disponible` junto al simbolo de la unidad;
- si el stock disponible llega al stock minimo, el panel muestra la alerta.

## Flujo 4: filtrar inventario cuando hay muchos articulos

1. Entra a `Inventario`.
2. Usa buscador por nombre o SKU.
3. Filtra por categoria.
4. Filtra por estado.
5. Filtra por tipo.
6. Filtra por sede si eres `Administrador`.
7. Filtra por sin stock, con stock, con prestamos activos, con stock reservado, con stock danado o en stock minimo.
8. Si quieres, limita por cantidad minima y maxima.

Resultado esperado:

- ves solo los articulos que cumplen la necesidad operativa.

## Flujo 5: crear un prestatario

1. Entra a `Prestatarios`.
2. Escribe nombre.
3. Agrega correo, telefono y notas si hace falta.
4. Guarda.

Resultado esperado:

- el prestatario queda disponible para solicitudes y prestamos.

## Flujo 6: editar o eliminar un prestatario

1. Entra a `Prestatarios`.
2. Pulsa `Editar` si vas a cambiar datos.
3. Pulsa `Eliminar` solo si no tiene historial.

Resultado esperado:

- si no tiene historial, se elimina;
- si ya tuvo solicitudes o prestamos, el sistema lo protege y no deja borrarlo.

## Flujo 7: crear una solicitud de prestamo

1. Entra a `Prestamos`.
2. Identifica el bloque correcto:

- `Solicitudes`;
- `Prestamos activos`;
- `Prestamos cerrados`.

3. Usa filtros si hace falta:

- categoria;
- cantidad minima;
- cantidad maxima;
- fechas.

4. Selecciona prestatario.
5. Si hace falta, usa el buscador por nombre o SKU para encontrar el articulo correcto.
6. Selecciona articulo prestable con stock.
7. Escribe cantidad.
8. Elige la fecha maxima que tendra el prestatario para devolver el articulo.
9. Agrega notas si hace falta.
10. Guarda.

Resultado esperado:

- la solicitud queda en estado `PENDIENTE`.

## Flujo 8: aprobar una solicitud

1. Busca la solicitud en `Prestamos`.
2. Pulsa `Aprobar`.

Resultado esperado:

- la solicitud cambia a `APROBADA`;
- el stock disponible baja;
- el stock reservado sube.

## Flujo 9: entregar un prestamo

1. Busca un prestamo `APROBADO`.
2. Escribe notas de entrega si hace falta.
3. Pulsa `Entregar`.

Resultado esperado:

- el prestamo pasa a `ENTREGADO`;
- el stock reservado baja;
- el stock prestado sube.

## Flujo 10: editar un prestamo existente

1. Busca el prestamo en `Prestamos`.
2. Pulsa `Editar prestamo`.
3. Ajusta los campos que necesites segun el estado del prestamo.

Puedes corregir:

- fecha maxima de devolucion;
- fecha de entrega;
- fecha de cierre o devolucion;
- notas generales;
- notas de devolucion.

4. Guarda.

Resultado esperado:

- el prestamo conserva su historial;
- la informacion administrativa queda corregida;
- auditoria registra el cambio.

## Flujo 11: registrar una devolucion total o parcial

1. Busca un prestamo `ENTREGADO` o `VENCIDO`.
2. Revisa la cantidad pendiente.
3. Escribe cuanto volvio bien.
4. Escribe cuanto volvio danado.
5. Escribe cuanto se perdio.
6. Agrega notas.

Ejemplo:

- prestaste 100 camisas;
- volvieron 80 bien;
- volvieron 4 malas;
- faltaron 16.

7. Pulsa `Registrar devolucion`.

Resultado esperado:

- lo bueno vuelve a stock disponible;
- lo danado queda en stock danado;
- lo perdido baja el stock total;
- las notas quedan guardadas en el prestamo;
- si aun falta devolver, el prestamo sigue abierto;
- si ya no falta nada, el prestamo queda cerrado.

## Flujo 12: registrar movimientos

1. Entra a `Movimientos`.
2. Busca el articulo por nombre o SKU.
3. Selecciona el articulo correcto.
4. Elige tipo:

- `Entrada`;
- `Salida`;
- `Ajuste`;
- `Traslado`.

5. Escribe cantidad.
6. Si es traslado, elige la sede destino.
7. Escribe motivo.
8. Agrega notas si hace falta.
9. Guarda.

Resultado esperado:

- el movimiento queda guardado;
- el stock cambia;
- el panel y el inventario reflejan el cambio.

Importante:

- el traslado entre sedes es una accion de control global y debe revisarse con cuidado.

## Flujo 13: revisar el historial de movimientos

1. Entra a `Movimientos`.
2. Baja a la seccion `Historial`.
3. Si quieres, filtra por articulo o SKU.
4. Filtra por tipo de movimiento.
5. Si hace falta, define cantidad minima y maxima.
6. Si hace falta, define fecha inicial y fecha final.
7. Usa los accesos rapidos de ultimos 7 o 30 dias si te sirven.
8. Pulsa `Aplicar`.

Resultado esperado:

- ves solo los movimientos que cumplen la busqueda.

Ejemplos:

- todos los movimientos del tomate esta semana;
- todas las salidas del ultimo mes;
- todos los ajustes entre dos fechas.

## Flujo 14: descargar reportes

1. Entra a `Reportes`.
2. Si eres `Administrador`, decide si quieres toda la empresa o una sede.
3. Si eres administrador, usa el reporte `Inventario administrativo` para control gerencial.
4. Si eres gestor o colaborador, usa el reporte `Inventario operativo`.
5. Si lo necesitas, define una fecha inicial y una fecha final.
6. Revisa el idioma activo en `Configuracion` si quieres que el reporte salga en espanol, ingles o portugues.
7. Elige CSV o PDF.
8. Pulsa `Descargar`.

Resultado esperado:

- el archivo se descarga con el alcance correcto;
- el contenido del reporte respeta el idioma activo de la aplicacion.

## Flujo 15: restablecer contrasena de un usuario

1. Inicia sesion como `Administrador`.
2. Entra a `Usuarios`.
3. Pulsa `Editar` sobre el usuario.
4. En la seccion `Restablecer contrasena`, escribe una nueva clave temporal.
5. Pulsa `Restablecer contrasena`.

Resultado esperado:

- la clave anterior deja de funcionar;
- el usuario ya puede entrar con la nueva clave temporal.

## Flujo 16: revisar auditoria

1. Entra a `Auditoria`.
2. Lee primero la ayuda superior para entender que significa cada columna.
3. Si hace falta, filtra por tipo de entidad.
4. Filtra por accion.
5. Filtra por actor.
6. Filtra por rango de fechas.
7. Revisa accion, actor, fecha y payload.

Resultado esperado:

- puedes entender quien hizo que, cuando y sobre que registro.

Como leer auditoria:

- `actor`: quien hizo el cambio;
- `action`: que hizo;
- `entityType`: sobre que modulo trabajo;
- `payload`: detalle del cambio.
