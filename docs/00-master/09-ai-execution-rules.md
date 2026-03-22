# Reglas globales para cualquier IA que trabaje este proyecto

## Reglas no negociables

1. Leer contexto antes de escribir codigo.
2. No sobredisenar el MVP.
3. No agregar pagos, ERP, contabilidad ni modulos no solicitados.
4. No romper integridad de stock, historial ni prestamos.
5. No saltar pruebas en flujos criticos.
6. Documentar cada cambio importante antes de cerrar una tarea.
7. Mantener coherencia entre frontend, backend, base de datos y documentacion.
8. Respetar multi-organizacion y permisos por recurso.
9. Tratar consumibles y activos prestables como variantes del mismo dominio, no como productos inconexos.
10. Preferir soluciones legibles, estables y explicables sobre soluciones llamativas.

## Forma de trabajo esperada

- analizar;
- detectar huecos;
- proponer la minima solucion suficiente;
- implementar por fases;
- probar;
- documentar;
- dejar siguiente paso claro.

## Restricciones de diseño

- no ocultar acciones destructivas sin confirmacion;
- no usar estados ambiguos;
- no permitir operaciones silenciosas que alteren stock;
- no duplicar logica de negocio entre frontend y backend;
- no asumir que una solicitud de prestamo equivale a una entrega real.

## Regla de documentacion

Si una IA cambia reglas, contratos, entidades, endpoints, pantallas o despliegue, debe actualizar el documento correspondiente en esta carpeta dentro de la misma tarea.

## Ejemplo de comportamiento correcto

Si se agrega el campo `trackSerialNumber` a `item`, la IA debe:

1. ajustar modelo y migracion;
2. actualizar DTOs y formularios;
3. ajustar validaciones;
4. agregar o adaptar pruebas;
5. documentar el cambio en base de datos, backend y frontend.
