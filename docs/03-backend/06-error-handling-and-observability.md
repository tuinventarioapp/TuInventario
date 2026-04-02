# Manejo de errores y observabilidad

## Lo que existe hoy

- `ApiException` para errores de negocio y autorizacion
- `GlobalExceptionHandler` para convertir excepciones a respuestas HTTP
- actuator con `health` e `info`
- logs del proceso Spring Boot

## Lo que no esta implementado hoy

- `traceId` en respuestas
- logging estructurado con MDC
- dashboards de observabilidad
- trazas distribuidas
- metricas personalizadas por dominio

## Recomendacion documental

Cuando se describa observabilidad del proyecto, debe hablarse de un nivel basico de health checks y logs de aplicacion, no de una plataforma completa de monitoreo.
