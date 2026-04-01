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
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

## Flujo publico para cuentas ADMIN

- el registro publico solo crea cuentas con rol `ADMIN`;
- una cuenta `ADMIN` nueva queda con `emailVerified=false` hasta validar el codigo recibido por correo;
- el codigo de verificacion expira y tiene cooldown de reenvio para evitar abuso;
- al validar el codigo correctamente, la API devuelve `accessToken`, `refreshToken` y el usuario autenticado;
- el flujo de `forgot-password` y `reset-password` aplica solo a cuentas `ADMIN` verificadas;
- los usuarios internos no admin siguen usando el flujo interno actual administrado por la aplicacion.

## Entrega de correo

- SMTP configurado con Brevo (`smtp-relay.brevo.com`);
- las credenciales se leen desde variables de entorno;
- no se usa la contrasena de Gmail ni un proveedor acoplado a la UI;
- el enlace de recuperacion usa `FRONTEND_ORIGIN` para abrir la pagina publica de reset.

## Medidas de seguridad

- rate limiting;
- control de intentos fallidos;
- expiracion razonable de tokens;
- rotacion de secretos por entorno;
- no exponer detalles sensibles en errores.
