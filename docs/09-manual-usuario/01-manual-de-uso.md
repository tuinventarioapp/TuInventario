# Manual de uso de TuInventario

## Que hace la aplicacion

TuInventario sirve para controlar articulos, stock, movimientos, prestamos, devoluciones, usuarios y reportes dentro de una empresa que puede tener una o muchas sedes.

Piensa la app asi:

- `Inventario` te muestra lo que tienes.
- `Movimientos` te muestra por que subio o bajo el stock.
- `Prestamos` te muestra a quien se le entrego algo y si ya lo devolvio.
- `Auditoria` te muestra quien hizo cada cambio importante.

La regla mas importante de todo el sistema es esta:

- el `Administrador` puede ver toda la empresa;
- el `Gestor` y el `Colaborador` trabajan solo en su sede asignada.

Ejemplo:

- si una persona pertenece a `Exito Laureles`, vera y operara solo lo de `Exito Laureles`;
- si eres `Administrador`, puedes ver `Exito Laureles`, `Exito Envigado`, `Exito Itagui` o toda la empresa junta.

## Antes de empezar

1. Inicia sesion.
2. Revisa tu rol.
3. Revisa tu sede.
4. Si eres `Administrador`, configura primero catalogos, sedes y usuarios.
5. Despues crea articulos y empieza la operacion.

## Que significa cada menu

### Panel

Es el resumen general. Te muestra rapidamente cuantos articulos tienes, como va el inventario y cuantos prestamos siguen activos o vencidos.

Tambien muestra las `alertas de stock minimo`.

Eso significa:

- cada articulo puede tener una cantidad minima permitida;
- cuando el stock disponible llega a esa cantidad o baja de ella, el panel lo avisa;
- la alerta respeta la unidad del articulo.

Ejemplos:

- `Computadores`: minimo 2 unidades. Si quedan 2, aparece la alerta.
- `Tomate`: minimo 10 kg. Si quedan 10 kg, aparece la alerta.

Tambien tiene accesos rapidos para:

- abrir inventario ya filtrado por stock minimo;
- entrar directo a movimientos;
- entrar directo a prestamos.
- descargar el manual de uso actualizado.

### Inventario

Es la lista completa de articulos. Aqui ves nombre, SKU, tipo, estado, ubicacion y cantidades.

Ahora puedes ver inventario en dos formatos:

- `Vista tarjetas`, para leer rapido cada articulo;
- `Vista tabla`, para trabajar mejor cuando la empresa tiene muchos registros.

Tambien puedes ordenar por:

- nombre;
- disponible;
- stock minimo;
- ultimo movimiento.

En cada tarjeta de articulo, el campo `Disponible` ahora debe leerse asi:

- `150 kg` significa que hay 150 kilogramos disponibles;
- `5 un` significa que hay 5 unidades disponibles.

La `Cantidad` siempre se interpreta junto con la `Unidad`.

Ejemplos:

- `Cantidad 5` + `Unidad` = 5 pesas.
- `Cantidad 5` + `Kilogramo` = 5 kg de tomate.

Cada articulo tambien puede tener un campo `Stock minimo`.

Ese valor sirve para que el sistema detecte cuando el articulo ya llego al limite operativo permitido y lo muestre como alerta en el `Panel`.

### Catalogos

Sirve para crear y mantener la base del sistema:

- categorias de articulos;
- unidades;
- categorias de ubicacion;
- ubicaciones o sedes.

Las `categorias de ubicacion` son personalizables. Cada empresa decide si usa nombres como `Bodega`, `Tienda`, `Showroom`, `Camion`, `Punto de venta` u otros.

### Movimientos

Sirve para registrar cambios de stock:

- `Entrada`: entra mercancia;
- `Salida`: sale mercancia;
- `Ajuste`: corriges cantidades;
- `Traslado`: mueves stock entre sedes.

Cuando vayas a crear un movimiento, el campo de articulo ya no depende solo de un listado largo. Puedes buscar por:

- nombre;
- SKU;
- sede.

Eso ayuda mucho cuando la empresa tiene cientos o miles de articulos.

Tambien puedes filtrar el historial por:

- articulo o SKU;
- tipo de movimiento;
- cantidad minima;
- cantidad maxima;
- fecha inicial;
- fecha final.

Asi puedes responder preguntas como:

- que movimientos tuvo el tomate esta semana;
- que salidas hubo el ultimo mes;
- que ajustes se hicieron entre dos fechas.

### Prestamos

Sirve para pedir, aprobar, entregar y recibir de vuelta articulos prestables.

El flujo se entiende asi:

1. primero se crea la solicitud;
2. despues se aprueba;
3. despues se entrega;
4. al final se registra la devolucion total o parcial.

Dentro de la pantalla veras tres pestañas operativas:

- `Solicitudes`: lo que aun no ha sido aprobado;
- `Prestamos activos`: lo aprobado, entregado o vencido;
- `Prestamos cerrados`: lo devuelto, cancelado o rechazado.

Cada pestaña tiene sus filtros por:

- categoria;
- cantidad minima;
- cantidad maxima;
- rango de fechas.

En el formulario de solicitud hay un campo de fecha. Esa fecha significa:

- `fecha maxima que tendra el prestatario para devolver el articulo`.

No es la fecha de creacion ni la fecha de entrega. Es la fecha limite de devolucion.

Al momento de elegir el articulo en una nueva solicitud interna, tambien puedes usar un buscador por:

- nombre;
- SKU.

Eso evita tener que recorrer listas muy largas cuando la empresa maneja cientos o miles de articulos.

Ademas, ahora un prestamo ya creado puede editarse para ajustar datos administrativos como:

- fecha maxima de devolucion;
- fecha de entrega;
- fecha de cierre o devolucion;
- notas del prestamo;
- notas de devolucion.

Esto sirve, por ejemplo, cuando una operacion real se registro tarde o hubo que corregir una fecha.

Consejo:

- trabaja una pestaña a la vez para no mezclar solicitudes nuevas con prestamos ya cerrados.

### Prestatarios

Aqui registras las personas o clientes que pueden recibir articulos en prestamo.

### Reportes

Aqui descargas archivos CSV o PDF para revisar informacion fuera de la app.

Ademas de poner fechas manualmente, ahora tienes botones rapidos para:

- hoy;
- ultimos 7 dias;
- ultimos 30 dias;
- este mes.

Los reportes se pueden sacar por rango de fechas. Eso te permite ver, por ejemplo:

- solo el ultimo mes;
- el ultimo ano;
- una semana puntual;
- cualquier rango especifico.

Ademas, el reporte se genera en el mismo idioma que tengas activo en `Configuracion`.

Ejemplo:

- si la app esta en `Espanol`, el CSV o PDF sale en espanol;
- si la app esta en `English`, el CSV o PDF sale en ingles.

### Usuarios

Aqui administras las cuentas internas del equipo.

El `Administrador` puede:

- crear usuarios;
- editar usuarios;
- cambiar su sede;
- bloquearlos;
- restablecer contrasenas.

### Auditoria

Esta seccion no cambia datos. Solo sirve para revisar el historial de acciones importantes.

Si alguna vez te preguntas:

- quien cambio esto;
- cuando lo cambio;
- que accion hizo;
- sobre cual registro lo hizo;

la respuesta se busca en `Auditoria`.

Cada fila muestra:

- `quien` hizo la accion;
- `que` accion hizo;
- `cuando` la hizo;
- `resumen rapido`, que explica de forma mas humana lo mas importante;
- `payload`, que es el detalle tecnico de soporte.

Si quieres encontrar algo rapido, usa filtros por:

- tipo de entidad;
- accion;
- actor;
- fechas.

### Configuracion

Aqui ves la informacion general del espacio de trabajo y el idioma de la interfaz.

## Como funciona la logica por sedes

### Si eres administrador

Puedes:

- ver toda la empresa;
- filtrar por sede o ver todo junto;
- crear y mover usuarios entre sedes;
- ver reportes globales o por sede;
- ver inventario, movimientos y prestamos de cualquier sede.

### Si eres gestor o colaborador

Tu cuenta queda amarrada a una sola sede.

Eso significa:

- los articulos que creas quedan en tu sede;
- el inventario que ves es el de tu sede;
- los prestamos que ves son los de tu sede;
- los movimientos que ves son los de tu sede;
- los reportes que descargas salen con datos de tu sede.

## Orden facil para empezar a usar la app

1. Entrar a `Configuracion` y revisar rol, empresa y sede.
2. Si eres `Administrador`, entrar a `Catalogos` y crear categorias, unidades, categorias de ubicacion y ubicaciones.
3. Si eres `Administrador`, entrar a `Usuarios` y asignar cada usuario a su sede.
4. Entrar a `Inventario` y crear articulos.
5. Entrar a `Prestatarios` y crear personas o clientes.
6. Entrar a `Prestamos` y crear una solicitud.
7. Aprobar la solicitud.
8. Entregar el articulo.
9. Registrar la devolucion total o parcial.
10. Descargar reportes.
11. Revisar `Auditoria` cuando necesites entender cambios o detectar errores operativos.

## Consejos simples

- Si algo no se guarda, mira el mensaje rojo que aparece en pantalla.
- Si no ves registros, revisa filtros o revisa si tu rol esta limitado a una sede.
- Si un prestamo no se puede crear, revisa que el articulo tenga stock y sea prestable.
- Si una devolucion es parcial, registra separado lo que volvio bien, lo danado y lo perdido.
- Cuando crees un articulo, el campo `Cantidad` depende de la `Unidad`.
- En inventario, mira siempre la cantidad junto al simbolo de la unidad para no confundirte.
- En movimientos, usa buscador por nombre o SKU antes de abrir listas muy largas.
- Si una empresa tiene muchos articulos, usa filtros por categoria, estado, tipo, sede y cantidades.
- Si quieres reportes de toda la empresa, entra como administrador, deja la sede en `Todos` y usa rango de fechas si solo quieres un periodo.
- Si un usuario olvida su clave, el administrador puede entrar a `Usuarios` y restablecer una nueva contrasena temporal.
