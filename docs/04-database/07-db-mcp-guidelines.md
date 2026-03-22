# Guia de uso de base de datos via MCP para otra IA

## Objetivo

Permitir que una IA explore y valide la base de datos de forma segura y util.

## Reglas

1. Leer esquema antes de proponer cambios.
2. No ejecutar escrituras destructivas sin una tarea explicitamente autorizada.
3. Validar tablas, columnas, constraints e indices antes de asumir nombres.
4. Verificar migraciones existentes antes de crear nuevas.
5. Consultar datos con limites y filtros por organizacion.
6. No depender de datos manuales si la misma informacion debe existir como seed o fixture.

## Flujo recomendado

1. inspeccionar tablas y relaciones;
2. comparar contra `03-relational-schema.md`;
3. detectar desalineaciones;
4. crear migracion necesaria;
5. correr pruebas o validaciones;
6. documentar el cambio.

## Preguntas que la IA debe poder responder

- que tablas implementan inventario y prestamos;
- como se calcula disponibilidad;
- donde se guardan tokens y auditoria;
- que constraints protegen unicidad y aislamiento por organizacion.
