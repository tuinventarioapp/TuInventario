# Arquitectura backend

## Objetivo

Construir un backend consistente, auditable y orientado al dominio para operaciones de inventario y prestamos.

## Stack recomendado

- Spring Boot 3.x;
- Java 21;
- Spring Security;
- Spring Data JPA;
- Hibernate;
- Flyway;
- MapStruct;
- Lombok;
- OpenAPI;
- WebSocket STOMP o equivalente;
- Testcontainers para integracion.

## Capas sugeridas

- `api`: controllers, request/response DTOs;
- `application`: casos de uso y orquestacion;
- `domain`: entidades, reglas y servicios de dominio;
- `infrastructure`: persistencia, mensajeria, email, storage;
- `shared`: errores, utilidades, seguridad y observabilidad.

## Reglas

- mantener controllers delgados;
- ubicar la logica de negocio en application y domain;
- no exponer entidades JPA directamente;
- encapsular transacciones en servicios claros;
- modelar multi-organizacion desde la raiz.
