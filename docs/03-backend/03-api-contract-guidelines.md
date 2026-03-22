# API contract guidelines

## Convenciones

- prefijo obligatorio `/api/v1`;
- JSON como formato principal;
- recursos nombrados en plural;
- filtros por query params;
- paginacion estandar;
- respuestas de error uniformes.

## Ejemplo de rutas

- `POST /api/v1/auth/login`
- `GET /api/v1/items`
- `POST /api/v1/movements`
- `POST /api/v1/loans/{loanId}/deliver`
- `POST /api/v1/loans/{loanId}/return`

## Formato sugerido de error

```json
{
  "code": "STOCK_INSUFFICIENT",
  "message": "No hay stock disponible suficiente para completar la operacion.",
  "details": {
    "itemId": "item_123",
    "requested": 5,
    "available": 2
  },
  "traceId": "req_abc"
}
```

## Paginacion sugerida

- `page`
- `size`
- `sort`
- `direction`

## Regla

Si cambia un contrato publico, actualizar este directorio, OpenAPI y los consumidores del frontend dentro de la misma tarea.
