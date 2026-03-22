# Auditoria e historial

## Objetivo

Poder responder:

- quien hizo la accion;
- cuando ocurrio;
- sobre que entidad;
- cual era el contexto;
- que cambio.

## Entidades con historial obligatorio

- items;
- movimientos;
- prestamos;
- devoluciones;
- cambios de permisos;
- eliminaciones logicas;
- autenticacion sensible si la politica lo requiere.

## Modelo sugerido de auditoria

- `entity_type`
- `entity_id`
- `action`
- `actor_user_id`
- `organization_id`
- `payload_before`
- `payload_after`
- `metadata`
- `created_at`

## Regla

La auditoria no reemplaza los movimientos de inventario. Son capas distintas: una explica el cambio tecnico y la otra el cambio operativo.
