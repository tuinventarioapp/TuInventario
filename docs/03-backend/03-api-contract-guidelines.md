# Lineamientos reales de contratos API

## Convenciones vigentes

- base path: `/api/v1`
- requests y responses separados por modulo
- ids serializados como `String` en DTOs
- cantidades modeladas con `BigDecimal`
- fechas serializadas como `Instant`
- validacion de entrada con Bean Validation

## Respuesta de error

La API lanza errores tipados con `ApiException` y `GlobalExceptionHandler`.

Lo que si existe:

- `status`
- `code`
- `message`

Lo que no debe documentarse como implementado:

- `traceId`
- payload estandar enriquecido de observabilidad

## Criterios

- no exponer entidades JPA directamente
- no mezclar DTOs de frontend con entidades persistidas
- preferir respuestas explicitamente adaptadas a la UI
- mantener filtros y paginacion en query params
