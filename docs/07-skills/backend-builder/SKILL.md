---
name: backend-builder
description: Implementar o refactorizar el backend Spring Boot de TuInventario con modulos por dominio, reglas de negocio claras, seguridad por organizacion y auditoria. Usar cuando la tarea afecte endpoints, servicios, reglas, seguridad, jobs, eventos o integracion con PostgreSQL.
---

# Backend Builder

## Iniciar

Leer:

1. `../../00-master/09-ai-execution-rules.md`
2. `../../03-backend/01-backend-architecture.md`
3. `../../03-backend/02-modules-and-responsibilities.md`
4. `../../03-backend/03-api-contract-guidelines.md`
5. `../../04-database/03-relational-schema.md`
6. `references/patterns.md`

## Implementar

- mantener controllers delgados;
- encapsular reglas en servicios de aplicacion y dominio;
- validar organizacion y permisos en cada operacion;
- usar transacciones en movimientos y prestamos;
- emitir errores tipados y entendibles;
- registrar auditoria en acciones criticas.

## Verificar

- ejecutar pruebas unitarias e integracion;
- validar contratos API;
- revisar impacto en migraciones y seeds;
- confirmar que no se rompe historial.

## Documentar

- endpoints nuevos o modificados;
- reglas implementadas;
- pruebas ejecutadas;
- documentos sincronizados.
