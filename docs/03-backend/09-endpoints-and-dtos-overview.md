# Vista inicial de endpoints y DTOs

## Auth

- `POST /auth/register` -> `RegisterRequest`, `AuthResponse`
- `POST /auth/login` -> `LoginRequest`, `AuthResponse`
- `POST /auth/refresh` -> `RefreshTokenRequest`, `AuthResponse`
- `GET /auth/me` -> `CurrentUserResponse`

## Items

- `GET /items` -> `PagedItemResponse`
- `POST /items` -> `CreateItemRequest`, `ItemDetailResponse`
- `GET /items/{id}` -> `ItemDetailResponse`
- `PUT /items/{id}` -> `UpdateItemRequest`, `ItemDetailResponse`

## Movements

- `POST /movements` -> `CreateMovementRequest`, `MovementDetailResponse`
- `GET /movements` -> `PagedMovementResponse`

## Loans

- `POST /loan-requests` -> `CreateLoanRequestRequest`, `LoanRequestResponse`
- `POST /loan-requests/{id}/approve` -> `ApproveLoanRequest`, `LoanResponse`
- `POST /loans/{id}/deliver` -> `DeliverLoanRequest`, `LoanResponse`
- `POST /loans/{id}/return` -> `ReturnLoanRequest`, `LoanResponse`

## DTO guidelines

- separar request y response;
- no filtrar entidades internas directamente;
- incluir ids, estados y metadatos necesarios para UI;
- representar cantidades con precision compatible con PostgreSQL.

## Ejemplo de campos utiles en `ItemDetailResponse`

- `id`
- `name`
- `sku`
- `type`
- `category`
- `unit`
- `status`
- `availableStock`
- `reservedStock`
- `loanedStock`
- `primaryLocation`
- `lastMovementAt`
