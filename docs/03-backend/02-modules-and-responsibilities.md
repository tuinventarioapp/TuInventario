# Modulos y responsabilidades

## `auth`

- registro publico de administradores
- verificacion de email por codigo
- login, refresh y `me`
- recuperacion de contrasena para admins
- emision y validacion de `auth_codes`
- envio de correo por SMTP

## `users`

- CRUD de usuarios internos
- reasignacion de rol y sede
- reset interno de contrasena por admin
- borrado logico de usuarios

## `catalog`

- categorias
- unidades
- categorias de ubicacion
- ubicaciones
- prestatarios
- catalogo publico de items prestables

## `inventory`

- CRUD de items
- filtros
- importacion masiva con preview y commit
- plantilla de carga

## `movement`

- listado paginado de movimientos
- registro de entradas, salidas, ajustes y traslados

## `loan`

- solicitudes internas y publicas
- grupos de solicitudes para prestatarios con cuenta
- aprobacion o rechazo
- entrega
- devolucion total o parcial
- marcado de vencidos

## `dashboard`

- metricas operativas principales
- alertas de stock minimo

## `report`

- inventario operativo y administrativo en CSV/PDF
- reportes de prestamos
- localizacion por idioma

## `audit`

- consulta paginada y filtrable del historial auditado

## `settings`

- datos de organizacion, rol y sede visible para el usuario actual

## `bootstrap`

- seed demo opcional

## `config`, `security`, `shared`

- configuracion general
- CORS y seguridad
- excepciones
- contexto actual
- tiempo real y utilidades comunes

## Diferencia importante

Existe tabla `notifications` en base de datos, pero hoy no hay modulo funcional completo de notificaciones en backend ni UI asociada.
