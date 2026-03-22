# ADR-001 - Modular Monolith en monorepo

## Estado

Aprobado.

## Contexto

El MVP necesita salir rapido, pero sin caer en una base imposible de escalar. El dominio incluye inventario, movimientos, prestamos, auditoria, notificaciones y multi-organizacion, lo que exige separacion de responsabilidades.

## Decision

Usar un monorepo con:

- frontend React independiente;
- backend Spring Boot como modular monolith por dominios;
- base de datos PostgreSQL compartida;
- contratos API claros y versionados.

## Motivos

- reduce complejidad operativa inicial;
- facilita transacciones consistentes en stock y prestamos;
- mejora velocidad de desarrollo del MVP;
- permite evolucionar a servicios separados si el crecimiento lo exige.

## Consecuencias positivas

- despliegue mas simple;
- trazabilidad tecnica mas clara;
- menor costo inicial;
- menos friccion entre dominios muy acoplados.

## Consecuencias negativas

- disciplina arquitectonica obligatoria para no terminar en un bloque desordenado;
- cuidado extra con dependencias cruzadas;
- necesidad de reglas claras de modulo.

## Regla practica

Compartir librerias solo para utilidades transversales. No mover logica de negocio de un dominio a otro sin una razon fuerte y documentada.
