# Arquitectura backend

## Stack real

- Spring Boot 3.4.5
- Java 21
- Spring Security
- Spring Data JPA / Hibernate
- Flyway
- Spring Mail
- WebSocket STOMP
- springdoc OpenAPI
- OpenPDF y Apache POI para reportes
- H2 y Testcontainers en pruebas

## Estructura real de paquetes

```text
com.tuinventario.api
  audit/
  auth/
  bootstrap/
  catalog/
  config/
  dashboard/
  domain/
  inventory/
  loan/
  movement/
  report/
  security/
  settings/
  shared/
  users/
```

## Rasgos actuales

- controllers relativamente delgados
- reglas operativas concentradas en servicios por modulo
- entidades JPA en `domain/entity`
- repositorios Spring Data en `domain/repository`
- configuracion transversal en `config/`
- autenticacion JWT y contexto actual del usuario en `security/` y `shared/`

## Lo que no forma parte de la arquitectura actual

- no hay `application/` separado
- no se usa MapStruct
- no hay microservicios
- no hay cola de eventos externa ni bus dedicado
