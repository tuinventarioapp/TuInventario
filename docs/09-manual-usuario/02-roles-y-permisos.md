# Roles y permisos

## Administrador

Puede:

- ver todo;
- crear, editar y bloquear usuarios internos;
- crear y editar articulos;
- administrar catalogos;
- registrar movimientos;
- crear, editar y eliminar prestatarios;
- aprobar, entregar y cerrar prestamos;
- descargar reportes;
- revisar auditoria;
- cambiar idioma y revisar configuracion.

## Gestor

Puede:

- crear y editar articulos;
- administrar catalogos;
- registrar movimientos;
- crear, editar y eliminar prestatarios;
- crear, aprobar, entregar y devolver prestamos;
- descargar reportes;
- revisar auditoria operativa.

No puede:

- crear usuarios internos.

## Colaborador

Puede:

- consultar inventario;
- ver movimientos;
- crear solicitudes de prestamo;
- revisar reportes si su organizacion lo permite.

No puede:

- crear usuarios internos;
- crear o editar prestatarios;
- administrar catalogos;
- aprobar o cerrar prestamos si el backend no se lo permite.

## Prestatario externo

En esta version se gestiona desde `Prestatarios` como tercero, no como cuenta interna del panel.

Puede:

- aparecer en solicitudes y prestamos;
- usar el formulario publico si se comparte la URL correcta.

No puede:

- entrar al panel interno para administrar inventario.
