# Prompt para uso de MCP sobre la base de datos

## Uso

Usar cuando la IA tenga acceso MCP al esquema o a la base local.

## Prompt sugerido

```text
Usa el acceso MCP de base de datos para inspeccionar el estado actual de TuInventario antes de proponer cambios.

Haz:
- listar tablas relevantes;
- validar relaciones e indices;
- comparar contra la documentacion de 04-database/;
- detectar diferencias entre esquema real y esperado;
- proponer migraciones necesarias.

No hagas:
- escrituras destructivas sin una tarea expresa;
- cambios manuales sin migracion;
- suposiciones sobre nombres de columnas sin verificar.

Entrega:
- resumen del esquema real;
- diferencias contra documentacion;
- cambios sugeridos;
- riesgos de datos.
```
