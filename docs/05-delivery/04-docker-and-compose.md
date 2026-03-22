# Docker y Compose

## Objetivo

Garantizar entorno reproducible para desarrollo, testing y despliegue inicial.

## Servicios minimos

- `web`
- `api`
- `db`

## Reglas

- usar imagen oficial de PostgreSQL;
- exponer puertos de desarrollo razonables;
- montar volumen persistente para datos locales;
- separar build de desarrollo y produccion cuando convenga;
- esperar salud de base antes de arrancar API.

## Resultado esperado

Una IA debe dejar `docker-compose.yml` y Dockerfiles listos para levantar frontend, backend y base con una sola orden.
