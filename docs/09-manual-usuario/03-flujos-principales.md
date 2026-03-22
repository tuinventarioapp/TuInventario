# Flujos principales

## Flujo 1: crear catalogos globales

1. Inicia sesion como `Administrador`.
2. Entra a `Catalogos`.
3. Crea categorias.
4. Crea unidades.
5. Crea ubicaciones o sedes.
6. Si hace falta, edita o elimina catalogos que no tengan uso.

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

5. Si tienes existencia inicial, agrega stock inicial.
6. Guarda.

Resultado esperado:

- el articulo aparece en inventario;
- queda asociado a una sede;
- el panel muestra el total correcto.

## Flujo 4: filtrar inventario cuando hay muchos articulos

1. Entra a `Inventario`.
2. Usa buscador por nombre o SKU.
3. Filtra por categoria.
4. Filtra por estado.
5. Filtra por tipo.
6. Filtra por sede si eres `Administrador`.
7. Filtra por stock critico, sin stock, reservado, prestado o danado.
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
2. Selecciona prestatario.
3. Selecciona articulo prestable con stock.
4. Escribe cantidad.
5. Elige fecha de devolucion.
6. Agrega notas si hace falta.
7. Guarda.

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

## Flujo 10: registrar una devolucion total o parcial

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

## Flujo 11: registrar movimientos

1. Entra a `Movimientos`.
2. Selecciona articulo.
3. Elige tipo:

- `Entrada`;
- `Salida`;
- `Ajuste`;
- `Traslado`.

4. Escribe cantidad.
5. Si es traslado, elige la sede destino.
6. Escribe motivo.
7. Agrega notas si hace falta.
8. Guarda.

Resultado esperado:

- el movimiento queda guardado;
- el stock cambia;
- el panel y el inventario reflejan el cambio.

Importante:

- el traslado entre sedes es una accion de control global y debe revisarse con cuidado.

## Flujo 12: descargar reportes

1. Entra a `Reportes`.
2. Si eres `Administrador`, decide si quieres toda la empresa o una sede.
3. Elige CSV o PDF.
4. Pulsa `Descargar`.

Resultado esperado:

- el archivo se descarga con el alcance correcto.

## Flujo 13: revisar auditoria

1. Entra a `Auditoria`.
2. Revisa accion, actor, fecha y payload.

Resultado esperado:

- puedes entender quien hizo que, cuando y sobre que registro.
