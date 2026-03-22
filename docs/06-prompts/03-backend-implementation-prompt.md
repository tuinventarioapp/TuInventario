# Prompt para implementacion backend

## Uso

Usar cuando la IA vaya a construir o ampliar el backend Spring Boot.

## Prompt sugerido

```text
Implementa el backend de TuInventario siguiendo la documentacion del proyecto.

Lee:
- 00-master/09-ai-execution-rules.md
- 03-backend/01-backend-architecture.md
- 03-backend/02-modules-and-responsibilities.md
- 03-backend/03-api-contract-guidelines.md
- 03-backend/04-auth-and-authorization.md
- 03-backend/05-domain-services.md
- 04-database/03-relational-schema.md

Stack obligatorio:
- Spring Boot;
- Java 21;
- JPA/Hibernate;
- Flyway;
- OpenAPI.

Haz:
- modulos por dominio;
- controllers delgados;
- servicios de aplicacion y dominio;
- DTOs separados;
- seguridad por rol, recurso y organizacion;
- auditoria;
- pruebas unitarias e integracion.

No hagas:
- exponer entidades JPA directamente;
- mezclar reglas complejas en controllers;
- ignorar transacciones en movimientos o prestamos.

Documenta:
- endpoints creados;
- reglas implementadas;
- migraciones asociadas;
- pruebas ejecutadas.
```
