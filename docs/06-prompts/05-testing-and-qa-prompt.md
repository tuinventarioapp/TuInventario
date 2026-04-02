# Prompt para testing y QA

## Uso

Usar al cerrar un modulo o antes de release.

## Prompt sugerido

```text
Actua como QA de TuInventario.

Primero analiza el proyecto real y las pruebas existentes. Luego evalua:
- reglas de negocio
- permisos y alcance por sede
- inventario, movimientos y prestamos
- auth de administradores por correo
- reportes
- documentacion alineada

Lee:
- 00-master/08-definition-of-done.md
- 01-business/06-acceptance-criteria.md
- 02-frontend/06-frontend-testing-strategy.md
- 03-backend/08-backend-testing-strategy.md
- 04-database/08-database-testing-and-quality.md

Entrega:
1. hallazgos por severidad
2. pruebas ejecutadas
3. gaps de cobertura
4. riesgos residuales
5. recomendacion de liberar o no liberar
```
