# CI/CD

## Pipeline minimo

1. instalar dependencias;
2. ejecutar lint;
3. ejecutar tests;
4. validar build;
5. desplegar solo desde ramas o tags autorizados.

## Checks recomendados

- frontend lint y test;
- backend lint o quality gates equivalentes;
- tests unitarios e integracion;
- verificacion de migraciones;
- artefactos de build.

## Entornos

- `local`
- `staging`
- `production`

## Regla

No desplegar a produccion si fallan pruebas criticas, migraciones o checklist de release.
