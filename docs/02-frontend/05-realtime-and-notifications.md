# Realtime y notificaciones

## Lo que existe hoy

- el backend expone WebSocket STOMP en `/ws`
- el broker simple publica en `/topic/organizations/{organizationId}`
- el frontend se suscribe por organizacion
- al llegar un evento, el frontend invalida queries de TanStack Query

## Lo que no existe hoy

- autenticacion dedicada del WebSocket
- payloads ricos por evento en UI
- centro de notificaciones
- tabla o inbox visible de notificaciones
- toasts persistentes derivados de la tabla `notifications`

## Implicacion practica

El realtime actual sirve para refrescar datos abiertos por otros usuarios de la misma organizacion, pero no debe documentarse como un sistema completo de notificaciones en tiempo real.
