# Manejo de errores y observabilidad

## Errores de dominio prioritarios

- stock insuficiente;
- transicion de estado invalida;
- recurso no encontrado;
- acceso denegado;
- duplicado unico;
- conflicto de concurrencia.

## Estrategia

- excepciones de dominio tipadas;
- mapper central a respuestas HTTP;
- mensajes utiles para frontend;
- `traceId` en logs y respuestas cuando aplique;
- logs estructurados por request.

## Observabilidad minima

- logs de aplicacion;
- logs de negocio;
- health checks;
- metricas basicas de error y latencia;
- trazabilidad de jobs programados.

## Ejemplo

Una devolucion duplicada no debe terminar en error generico 500; debe responder como conflicto o transicion invalida con causa entendible.
