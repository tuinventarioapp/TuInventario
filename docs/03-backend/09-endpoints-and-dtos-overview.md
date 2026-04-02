# Endpoints y DTOs reales

## Auth

- `POST /api/v1/auth/register` -> `RegisterRequest` -> `RegistrationPendingResponse`
- `POST /api/v1/auth/verify-email` -> `VerifyEmailRequest` -> `AuthResponse`
- `POST /api/v1/auth/resend-verification` -> `ResendVerificationRequest` -> `RegistrationPendingResponse`
- `POST /api/v1/auth/login` -> `LoginRequest` -> `AuthResponse`
- `POST /api/v1/auth/refresh` -> `RefreshTokenRequest` -> `AuthResponse`
- `POST /api/v1/auth/forgot-password` -> `ForgotPasswordRequest` -> `ActionMessageResponse`
- `POST /api/v1/auth/reset-password` -> `ResetPasswordRequest` -> `ActionMessageResponse`
- `GET /api/v1/auth/me` -> `AuthUserResponse`

## Dashboard

- `GET /api/v1/dashboard` -> `DashboardResponse`

## Items

- `GET /api/v1/items` -> `PageResponse<ItemResponse>`
- `GET /api/v1/items/{id}` -> `ItemResponse`
- `POST /api/v1/items` -> `CreateItemRequest` -> `ItemResponse`
- `PUT /api/v1/items/{id}` -> `UpdateItemRequest` -> `ItemResponse`
- `DELETE /api/v1/items/{id}`
- `GET /api/v1/items/import/template`
- `POST /api/v1/items/import/preview`
- `POST /api/v1/items/import/commit`

## Movements

- `GET /api/v1/movements` -> `PageResponse<MovementResponse>`
- `POST /api/v1/movements` -> `CreateMovementRequest` -> `MovementResponse`

## Catalogs

- `GET|POST|PUT|DELETE /api/v1/categories`
- `GET|POST|PUT|DELETE /api/v1/units`
- `GET|POST|PUT|DELETE /api/v1/location-categories`
- `GET|POST|PUT|DELETE /api/v1/locations`
- `GET|POST|PUT|DELETE /api/v1/borrowers`
- `GET /api/v1/public-items?organizationId=...`

## Loans

- `GET /api/v1/loan-requests`
- `POST /api/v1/loan-requests` -> `LoanRequestPayload`
- `POST /api/v1/public-loan-requests` -> `PublicLoanRequestPayload`
- `POST /api/v1/loan-requests/{id}/approve`
- `POST /api/v1/loan-requests/{id}/reject`
- `GET /api/v1/loans`
- `PUT /api/v1/loans/{id}` -> `UpdateLoanPayload`
- `POST /api/v1/loans/{id}/deliver`
- `POST /api/v1/loans/{id}/return` -> `ReturnLoanPayload`
- `POST /api/v1/borrower-loan-requests` -> `BorrowerLoanCartPayload`
- `GET /api/v1/borrower-loan-requests`
- `GET /api/v1/borrower-loan-requests/mine`
- `POST /api/v1/borrower-loan-requests/{groupId}/review` -> `BorrowerLoanReviewPayload`
- `POST /api/v1/borrower-loans/{groupId}/deliver`
- `POST /api/v1/borrower-loans/{groupId}/return` -> `BorrowerLoanReturnPayload`

## Users

- `GET /api/v1/users`
- `POST /api/v1/users` -> `CreateUserRequest`
- `PUT /api/v1/users/{id}` -> `UpdateUserRequest`
- `POST /api/v1/users/{id}/reset-password` -> `ResetPasswordRequest`
- `DELETE /api/v1/users/{id}`

## Reports

- `GET /api/v1/reports/inventory.csv`
- `GET /api/v1/reports/inventory-admin.csv`
- `GET /api/v1/reports/loans.csv`
- `GET /api/v1/reports/inventory.pdf`
- `GET /api/v1/reports/inventory-admin.pdf`

## Settings y audit

- `GET /api/v1/settings`
- `GET /api/v1/audit`

## Nota

Esta lista describe solo endpoints que hoy existen en controladores. No debe mezclarse con endpoints deseados o antiguos.
