# Requisitos no funcionales

## Rendimiento

- respuestas CRUD comunes debajo de 500 ms en escenarios normales;
- busquedas y tablas con paginacion server-side;
- dashboard inicial debajo de 2 segundos con datos moderados;
- actualizaciones en tiempo real sin duplicar eventos visibles.

## Integridad

- no permitir stock negativo;
- toda operacion critica debe ser transaccional;
- auditoria obligatoria en eventos sensibles;
- estados invalidos deben rechazarse con errores claros.

## Seguridad

- contrasenas con hashing fuerte;
- JWT corto y refresh token seguro;
- rate limiting;
- bloqueo por intentos fallidos;
- aislamiento por organizacion;
- autorizacion por rol y recurso.

## Mantenibilidad

- arquitectura por modulos;
- DTOs separados;
- pruebas en flujos criticos;
- convenciones de nombres consistentes;
- documentacion sincronizada con cambios importantes.

## Operacion

- desarrollo local con un comando;
- Docker desde el inicio;
- variables de entorno documentadas;
- logs estructurados;
- readiness de despliegue en staging y produccion.
