# Autenticacion y autorizacion

## Endpoints reales

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

## Flujo actual para `ADMIN`

### Registro

1. `register` crea usuario, organizacion y membership `ADMIN`
2. la cuenta queda con `emailVerified=false`
3. se generan datos iniciales de organizacion: categoria, unidad, ubicacion principal y categorias de ubicacion
4. se emite un codigo de 6 digitos por correo
5. `verify-email` valida el codigo y devuelve `accessToken`, `refreshToken` y `user`

### Recuperacion de contrasena

1. `forgot-password` acepta email
2. si el usuario es admin verificado, genera codigo y enlace de reset
3. `reset-password` valida email, codigo y password fuerte
4. el backend revoca los refresh tokens activos del usuario

## Restricciones reales

- `register`, `verify-email`, `resend-verification`, `forgot-password` y `reset-password` solo cubren el flujo publico de administradores
- usuarios internos no admin se gestionan desde el panel
- `AppUserDetailsService` impide autenticar usuarios no verificados, bloqueados o eliminados logicamente
- no existe endpoint publico de logout

## Tokens

- access token con expiracion corta
- refresh token persistido en tabla `refresh_tokens`
- el refresh invalida el token anterior y emite uno nuevo

## Codigos de autenticacion

- se almacenan en `auth_codes`
- el valor real del codigo se guarda hasheado
- expiran a los 15 minutos
- maximo 5 intentos
- maximo 5 envios por codigo
- cooldown de reenvio: 60 segundos

## Roles y alcance

- `ADMIN`: acceso completo en su organizacion
- `MANAGER`: operacion diaria, normalmente restringido a sede
- `COLLABORATOR`: operacion limitada, normalmente restringido a sede
- `BORROWER`: rol soportado por base y backend para cuentas prestatario

## Seguridad implementada hoy

- BCrypt para contrasenas
- JWT
- validacion de organizacion y permisos en servicios
- CORS configurable

## Seguridad pendiente

- rate limiting
- bloqueo por intentos fallidos
- logout con endpoint propio
- autenticacion de WebSocket
