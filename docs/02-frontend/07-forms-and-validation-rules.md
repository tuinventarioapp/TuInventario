# Reglas de formularios y validacion

## Principios

- validar temprano en cliente;
- validar de forma definitiva en backend;
- mostrar errores por campo y errores generales;
- no perder datos por un fallo recuperable.

## Formularios clave

- item;
- movimiento;
- prestamo;
- usuario;
- configuracion de organizacion.

## Reglas UX

- usar valores por defecto razonables;
- marcar obligatorios de forma clara;
- evitar formularios interminables;
- agrupar campos por contexto;
- mantener CTA principal fijo en mobile cuando el formulario sea largo.

## Ejemplo

En prestamo, si el usuario intenta poner fecha de devolucion anterior a la entrega, el cliente debe avisar de inmediato y el backend debe rechazarlo igualmente.
