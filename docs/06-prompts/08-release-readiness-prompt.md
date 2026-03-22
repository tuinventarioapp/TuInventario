# Prompt para readiness de release

## Uso

Usar antes de desplegar a staging o produccion.

## Prompt sugerido

```text
Evalua si TuInventario esta listo para release.

Lee:
- 05-delivery/06-deployment-guide.md
- 05-delivery/07-production-readiness-checklist.md
- 05-delivery/08-observability-and-support.md
- 00-master/08-definition-of-done.md

Valida:
- build;
- variables;
- migraciones;
- tests;
- salud de endpoints;
- seguridad basica;
- documentacion de soporte.

Entrega:
1. checklist aprobado o fallido;
2. bloqueantes;
3. acciones previas al release;
4. recomendacion final.
```
