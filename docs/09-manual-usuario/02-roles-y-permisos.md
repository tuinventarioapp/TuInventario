# Roles y permisos

## Administrador

Puede:

- ver todo;
- crear usuarios internos;
- crear y editar articulos;
- administrar catalogos;
- registrar movimientos;
- aprobar, entregar y cerrar prestamos;
- descargar reportes;
- revisar auditoria;
- cambiar idioma y revisar configuracion.

## Gestor

Puede:

- crear y editar articulos;
- administrar catalogos;
- registrar movimientos;
- crear, aprobar, entregar y devolver prestamos;
- crear prestatarios;
- descargar reportes;
- revisar auditoria operativa.

No puede:

- crear usuarios internos.

## Colaborador

Puede:

- consultar inventario;
- ver movimientos;
- crear prestatarios;
- crear solicitudes de prestamo;
- revisar reportes si su organizacion lo permite.

No puede:

- crear usuarios internos;
- administrar catalogos;
- aprobar o cerrar prestamos si el backend no se lo permite.

## Prestatario externo

En esta version se gestiona desde `Prestatarios` como tercero, no como cuenta interna del panel.

Puede:

- aparecer en solicitudes y prestamos;
- usar el formulario publico si se comparte la URL correcta.

No puede:

- entrar al panel interno para administrar inventario.
