# Vision general del modelo de datos

## Objetivo

Soportar inventario multi-organizacion, movimientos auditables y prestamos con trazabilidad completa.

## Principios

- aislar datos por organizacion;
- evitar borrado fisico en entidades historicas;
- permitir consumibles y activos prestables;
- mantener historial de cambios criticos;
- preparar la base para crecer a nube sin rehacer el modelo.

## Bloques del modelo

- identidad y acceso;
- catalogos;
- inventario;
- movimientos;
- prestamos;
- auditoria;
- notificaciones.

## Diagrama conceptual

```mermaid
erDiagram
    organization ||--o{ membership : has
    user ||--o{ membership : belongs
    organization ||--o{ category : owns
    organization ||--o{ location : owns
    organization ||--o{ item : owns
    item ||--o{ stock_movement : produces
    borrower ||--o{ loan : receives
    loan ||--o{ loan_item : contains
    item ||--o{ loan_item : participates
```
