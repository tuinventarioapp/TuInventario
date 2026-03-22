# Roles y permisos

## Administrador

Piensalo como el gerente general o el CEO de toda la empresa.

Puede:

- ver todas las sedes;
- filtrar por sede o ver el total de la empresa;
- crear, editar y bloquear usuarios internos;
- asignar o cambiar la sede de gestores y colaboradores;
- crear, editar y eliminar prestatarios;
- crear, editar y eliminar catalogos globales;
- crear y editar articulos;
- registrar movimientos;
- aprobar, entregar y cerrar prestamos;
- descargar reportes globales o por sede;
- revisar auditoria.

No debe:

- borrar sedes, catalogos o prestatarios que ya tengan uso operativo.

## Gestor

Piensalo como el responsable operativo de una sede.

Puede:

- ver inventario de su sede;
- crear y editar articulos de su sede;
- registrar movimientos de su sede;
- ver solicitudes y prestamos de su sede;
- aprobar prestamos de su sede;
- entregar prestamos de su sede;
- registrar devoluciones de su sede;
- crear, editar y eliminar prestatarios;
- descargar reportes de su sede;
- revisar auditoria operativa de lo que puede consultar.

No puede:

- ver toda la empresa;
- administrar usuarios internos;
- administrar catalogos globales;
- cambiar su sede por si mismo.

## Colaborador

Piensalo como una persona que trabaja en una sede puntual.

Puede:

- ver inventario de su sede;
- ver movimientos de su sede;
- crear solicitudes de prestamo para su sede;
- ver prestamos de su sede;
- descargar reportes de su sede si su rol tiene acceso.

No puede:

- crear usuarios internos;
- administrar catalogos;
- aprobar prestamos;
- entregar prestamos;
- cerrar devoluciones;
- operar sobre sedes distintas a la suya.

## Prestatario externo

No entra al panel interno como usuario.

Se gestiona desde `Prestatarios` o desde el formulario publico.

Puede:

- aparecer en solicitudes y prestamos;
- usar el enlace publico cuando se comparte la URL correcta.

No puede:

- administrar inventario;
- entrar al panel interno.
