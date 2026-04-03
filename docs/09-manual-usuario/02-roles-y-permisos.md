# Roles y permisos

## ADMIN

Puede:

- ver toda la organizacion o filtrar por sede
- administrar catalogos globales
- crear, editar, bloquear y restablecer contrasenas de usuarios internos
- crear y editar articulos en cualquier sede
- hacer carga masiva de articulos
- registrar movimientos y traslados
- crear, aprobar, rechazar, entregar y cerrar prestamos
- crear prestatarios simples y cuentas `BORROWER`
- descargar reportes operativos y administrativos
- revisar auditoria global

## MANAGER

Puede:

- operar solo en su sede asignada
- crear, editar y eliminar articulos de su sede
- hacer carga masiva limitada a su sede
- registrar entradas, salidas y ajustes
- gestionar prestatarios y cuentas `BORROWER` de su sede
- aprobar o rechazar solicitudes
- entregar prestamos y registrar devoluciones parciales
- descargar reportes de su sede
- revisar auditoria filtrada por su alcance

No puede:

- administrar catalogos globales
- administrar usuarios internos
- ver datos globales de toda la empresa

## COLLABORATOR

Puede:

- consultar panel, inventario y movimientos de su sede
- crear solicitudes internas de prestamo
- consultar el estado de sus solicitudes y prestamos
- descargar reportes operativos de su sede
- cambiar idioma en configuracion

No puede:

- administrar catalogos
- administrar usuarios
- aprobar o cerrar prestamos
- ver auditoria

## BORROWER

Puede:

- iniciar sesion con una cuenta creada desde `Prestatarios`
- ver solo los articulos disponibles de su sede asignada
- armar una solicitud agrupada con varios articulos
- consultar el estado de sus solicitudes
- ver prestamos activos, historial y alertas de vencimiento
- cambiar idioma y revisar sus datos basicos desde configuracion

No puede:

- ver otras sedes
- registrar movimientos
- aprobar prestamos
- acceder a reportes, auditoria, usuarios o catalogos
