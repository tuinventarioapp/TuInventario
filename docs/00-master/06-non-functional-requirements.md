# Requisitos no funcionales

## Rendimiento objetivo

- CRUD comunes por debajo de ~500 ms en entornos pequenos o medianos
- dashboard inicial por debajo de ~2 s con datos moderados
- tablas paginadas en inventario, movimientos y auditoria
- exports CSV y PDF generados dentro de tiempos operativos razonables

## Integridad y consistencia

- no permitir stock negativo
- aplicar transacciones en movimientos y prestamos
- auditar acciones sensibles
- aislar datos por organizacion
- respetar alcance por sede para usuarios no admin

## Seguridad implementada hoy

- hashing de contrasena con BCrypt
- JWT de acceso y refresh token persistido
- bloqueo de login para usuarios no verificados, bloqueados o eliminados logicamente
- CORS configurable por `FRONTEND_ORIGIN`
- permisos por rol y contexto de organizacion

## Seguridad pendiente

- rate limiting
- bloqueo por intentos fallidos
- trazabilidad con `traceId`
- autenticacion del WebSocket

## Mantenibilidad

- backend modular por dominio
- DTOs separados de entidades
- migraciones versionadas con Flyway
- documentacion y manual en el mismo repo
- pruebas automticas parciales en frontend y backend
