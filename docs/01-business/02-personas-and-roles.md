# Personas y roles

## Persona 1 - Propietario o Admin

- necesita visibilidad total;
- configura organizacion, catalogos y permisos;
- aprueba prestamos y revisa auditoria;
- responde por la integridad operativa.

## Persona 2 - Gestor de inventario

- trabaja el dia a dia;
- registra entradas, salidas, ajustes y traslados;
- mantiene articulos y ubicaciones;
- atiende prestamos sin tocar configuracion critica.

## Persona 3 - Colaborador

- consulta inventario;
- registra operaciones permitidas;
- no cambia permisos ni configuracion sensible;
- no elimina historicos.

## Persona 4 - Prestatario

- solicita prestamos;
- consulta estado de sus solicitudes y prestamos;
- no administra inventario interno.

## Matriz resumida de permisos

| Accion | Admin | Gestor | Colaborador | Prestatario |
| --- | --- | --- | --- | --- |
| Crear organizacion y usuarios | Si | No | No | No |
| Configurar roles y permisos | Si | No | No | No |
| Crear y editar articulos | Si | Si | Segun permiso | No |
| Registrar movimientos | Si | Si | Segun permiso | No |
| Aprobar prestamos | Si | Segun politica | No | No |
| Registrar devoluciones | Si | Si | Segun permiso | No |
| Ver auditoria | Si | Parcial | Parcial | No |
| Crear solicitud de prestamo | Si | Si | Si | Si |

## Ejemplo

Un gestor puede mover stock entre ubicaciones, pero no puede otorgarse permisos de administrador ni modificar reglas criticas de seguridad.
