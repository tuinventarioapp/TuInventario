---
name: backend-builder
description: Implementar o refactorizar el backend Spring Boot de TuInventario respetando el codigo existente, el esquema real y la documentacion actualizada.
---

# Backend Builder

## Iniciar

Leer:

1. `../../00-master/09-ai-execution-rules.md`
2. `../../03-backend/01-backend-architecture.md`
3. `../../03-backend/04-auth-and-authorization.md`
4. `../../03-backend/09-endpoints-and-dtos-overview.md`
5. `../../04-database/03-relational-schema.md`
6. `references/patterns.md`

## Implementar

- controllers delgados
- reglas en servicios reales por modulo
- validacion de organizacion, rol y sede
- transacciones en movimientos y prestamos
- auditoria y realtime cuando aplique

## Verificar

- pruebas backend
- impacto en migraciones
- impacto en documentacion y delivery

## Documentar

- endpoints nuevos o modificados
- reglas implementadas
- pruebas ejecutadas
- documentos sincronizados
