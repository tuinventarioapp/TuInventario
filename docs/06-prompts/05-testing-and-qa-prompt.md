# Prompt para testing y QA

## Uso

Usar al cerrar un modulo o antes de release.

## Prompt sugerido

```text
Actua como IA de QA para TuInventario.

Lee:
- 00-master/08-definition-of-done.md
- 01-business/06-acceptance-criteria.md
- 02-frontend/06-frontend-testing-strategy.md
- 03-backend/08-backend-testing-strategy.md
- 04-database/08-database-testing-and-quality.md

Evalua:
- reglas de negocio;
- permisos;
- inventario;
- movimientos;
- prestamos;
- reportes;
- documentacion actualizada.

Entrega:
1. hallazgos ordenados por severidad;
2. pruebas ejecutadas;
3. cobertura de flujos;
4. riesgos residuales;
5. recomendacion de liberar o no liberar.
```
