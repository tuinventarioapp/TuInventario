# Roles y permisos

## Administrador

Puede:

- ver toda la organizacion
- crear, editar y bloquear usuarios internos
- restablecer contrasenas de usuarios internos
- administrar catalogos globales
- crear y editar articulos
- registrar movimientos
- aprobar, rechazar, entregar y cerrar prestamos
- descargar reportes globales o por sede
- revisar auditoria

## Gestor

Puede:

- operar en su sede asignada
- crear y editar articulos de su sede
- registrar movimientos
- revisar y atender prestamos de su sede
- descargar reportes de su sede

No puede:

- administrar usuarios internos
- ver toda la empresa

## Colaborador

Puede:

- consultar inventario y movimientos de su sede
- crear solicitudes de prestamo dentro de su alcance
- revisar informacion operativa permitida

No puede:

- administrar catalogos
- aprobar o cerrar prestamos
- administrar usuarios

## Prestatario

El proyecto soporta dos escenarios:

- persona externa usando el enlace publico de solicitud
- prestatario con cuenta y rol `BORROWER` soportado por backend

Observacion:

- la experiencia principal visible hoy para prestatarios sigue siendo el flujo publico de solicitud; no existe una interfaz independiente completa documentada para un portal externo dedicado.
