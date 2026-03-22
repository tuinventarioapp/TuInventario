# Estrategia de testing backend

## Piramide recomendada

- unit tests para reglas y servicios;
- integration tests para API, JPA y PostgreSQL;
- pruebas E2E para flujos principales.

## Herramientas sugeridas

- JUnit 5;
- Mockito;
- Testcontainers;
- Spring Boot Test;
- Rest Assured o MockMvc;
- cobertura con JaCoCo.

## Flujos obligatorios

- login y refresh;
- permisos;
- crear item;
- entrada;
- salida;
- traslado;
- prestamo;
- devolucion;
- job de vencimientos;
- exportacion de reportes.

## Cobertura

- meta minima backend: 70 por ciento;
- priorizar calidad de escenarios criticos por encima del numero bruto.
