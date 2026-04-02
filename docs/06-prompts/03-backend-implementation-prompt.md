# Prompt para implementacion backend

## Uso

Usar cuando la IA vaya a modificar o ampliar el backend Spring Boot existente.

## Prompt sugerido

```text
Analiza primero el backend real de TuInventario y luego implementa los cambios necesarios sin romper autenticacion, stock ni prestamos.

Lee:
- 00-master/09-ai-execution-rules.md
- 03-backend/01-backend-architecture.md
- 03-backend/02-modules-and-responsibilities.md
- 03-backend/04-auth-and-authorization.md
- 03-backend/09-endpoints-and-dtos-overview.md
- 04-database/03-relational-schema.md

Stack real:
- Spring Boot
- Java 21
- Spring Security
- JPA/Hibernate
- Flyway
- JavaMail

Haz:
- controllers delgados
- servicios por modulo
- DTOs separados
- seguridad por organizacion, rol y sede cuando aplique
- migraciones solo cuando el esquema lo requiera
- pruebas backend relevantes
- documentacion sincronizada

No hagas:
- exponer entidades JPA
- documentar endpoints que no existan
- asumir infraestructura de observabilidad que hoy no esta implementada
```
