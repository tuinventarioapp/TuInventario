# Estrategia real de pruebas frontend

## Suite actual

Archivos presentes:

- `src/pages/login-page.test.tsx`
- `src/lib/api.test.ts`

Cobertura validada hoy:

- render y flujo principal de login
- comportamiento base del cliente API

## Comandos

```powershell
npm run test -- --run
npm run lint
```

## Estado real

- las pruebas frontend existen, pero su cobertura aun es limitada
- no hay Playwright ni otra suite E2E en el repo
- lint pasa con warnings conocidos de hooks

## Prioridad recomendada

Ampliar cobertura sobre:

- registro y verificacion de admin
- forgot-password y reset-password
- flujos de inventario
- prestamos
- responsive de pantallas principales
