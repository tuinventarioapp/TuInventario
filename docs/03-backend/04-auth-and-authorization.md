# Autenticacion y autorizacion

## Autenticacion

- email y contrasena en MVP;
- verificacion por email;
- recuperacion de contrasena;
- JWT corto para acceso;
- refresh token seguro;
- cierre de sesion con invalidacion de refresh cuando aplique.

## Autorizacion

- por rol;
- por organizacion;
- por recurso;
- por estado del usuario.

## Reglas claves

- usuario bloqueado no autentica;
- usuario soft deleted no opera;
- toda consulta y comando deben validar `organizationId`;
- admin tiene acceso completo dentro de su organizacion, no fuera de ella.

## Endpoints criticos

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

## Medidas de seguridad

- rate limiting;
- control de intentos fallidos;
- expiracion razonable de tokens;
- rotacion de secretos por entorno;
- no exponer detalles sensibles en errores.
