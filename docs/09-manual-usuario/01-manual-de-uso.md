# Manual de uso de TuInventario

## Como se entrega hoy el manual

El manual operativo ya no es un PDF fijo igual para todos.

Desde la aplicacion, cada usuario descarga un `manual PDF generado segun su rol actual`:

- `ADMIN`: ve funciones globales y administrativas.
- `MANAGER`: ve solo funciones operativas de su sede.
- `COLLABORATOR`: ve consulta y operacion diaria permitida.
- `BORROWER`: ve solo solicitud y seguimiento de sus prestamos.

Esto evita que un gestor o prestatario vean funciones que no forman parte de su alcance real.

## Que hace la aplicacion

TuInventario controla:

- articulos
- stock
- movimientos
- prestamos
- devoluciones
- prestatarios
- reportes
- auditoria

La aplicacion trabaja por organizacion y por sedes.

Regla base:

- `ADMIN` puede operar toda la organizacion.
- `MANAGER`, `COLLABORATOR` y `BORROWER` trabajan con una sede asignada.

## Modulos principales

### Panel

Resume:

- articulos
- prestamos activos
- prestamos vencidos
- alertas de stock minimo

Tambien muestra accesos rapidos y permite descargar el manual actualizado segun el rol.

### Inventario

Muestra articulos en vista tarjeta o tabla.

Permite trabajar con:

- nombre
- SKU
- tipo
- categoria
- unidad
- sede principal
- stock disponible
- stock reservado
- stock prestado
- stock minimo

Tambien soporta:

- filtros por categoria, estado, tipo y cantidades
- orden por nombre, disponible, stock minimo y ultimo movimiento
- carga masiva por Excel usando `SKU` como referencia

### Catalogos

Disponible solo para administradores.

Sirve para administrar:

- categorias
- unidades
- categorias de ubicacion
- ubicaciones

### Movimientos

Registra o consulta:

- entradas
- salidas
- ajustes
- traslados

Los gestores y administradores pueden registrar movimientos.
Los demas roles solo consultan o no acceden, segun su perfil.

### Prestamos

Flujo interno actual:

1. se crea una solicitud
2. se aprueba o rechaza
3. se entrega
4. se registra la devolucion
5. queda cerrada

La devolucion ya no usa cantidades danadas o perdidas.
Solo se registra:

- `cantidad devuelta`
- `nota de devolucion`

Si falta algo, el motivo queda explicado en la nota.

### Prestatarios

Aqui se gestionan:

- fichas simples de prestatario
- cuentas con rol `BORROWER`

Las cuentas con rol `BORROWER` se crean desde `Prestatarios`, no desde `Usuarios`.

### Reportes

Permiten descargar:

- inventario operativo CSV
- inventario operativo PDF
- inventario administrativo CSV
- inventario administrativo PDF
- prestamos CSV

El alcance depende del rol:

- `ADMIN`: toda la empresa o una sede
- `MANAGER` y `COLLABORATOR`: solo su sede

### Usuarios

Disponible solo para administradores.

Administra usuarios internos:

- administradores
- gestores
- colaboradores

No se usa para crear prestatarios con acceso.

### Auditoria

Registra acciones importantes del sistema.

Alcance real:

- `ADMIN`: vista completa
- `MANAGER`: vista operativa filtrada por su alcance
- `COLLABORATOR`: sin acceso

### Configuracion

Muestra:

- organizacion actual
- rol actual
- sede asignada
- idioma

Tambien permite descargar el manual PDF ajustado al rol.

## Flujo de prestatario con cuenta

El rol `BORROWER` ya existe y funciona asi:

1. entra con una cuenta creada desde `Prestatarios`
2. ve solo el inventario disponible de su sede
3. arma una solicitud agrupada con varios articulos
4. define una sola fecha maxima de devolucion
5. envia la solicitud
6. revisa luego si cada articulo fue aprobado, reducido o rechazado
7. consulta prestamos activos, historial y alertas de vencimiento

## Reglas importantes que ya aplican

- `tipo_articulo` soporta `CONSUMABLE`, `LENDABLE`, `HYBRID`
- tambien existe el comportamiento `No prestable` dentro del formulario para articulos que no deben entrar al flujo de prestamo
- la unidad del articulo se respeta en solicitudes, prestamos y devoluciones
- la carga masiva no crea catalogos automaticamente
- si un `SKU` ya existe, primero pasa por revision antes de actualizarse

## Recordatorios operativos

- revisa siempre la sede activa antes de operar
- si no ves datos, revisa filtros y alcance
- si un prestatario devuelve menos, registra solo lo que regreso y explica el faltante en la nota
- si trabajas desde movil, la navegacion visible depende del rol y no muestra modulos fuera de tu alcance
