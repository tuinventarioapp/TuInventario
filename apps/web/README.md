# TuInventario Web

Frontend de TuInventario construido con React, TypeScript y Vite.

## Responsabilidad actual

- autenticacion y sesion cliente
- registro y verificacion de administradores
- recuperacion de contrasena para administradores
- gestion de inventario, catalogos, movimientos, prestamos, prestatarios, usuarios, reportes y auditoria
- configuracion visible de organizacion y alcance por sede
- sincronizacion basica por WebSocket
- interfaz multidioma `es`, `en`, `pt`

## Scripts

```powershell
npm install
npm run dev
npm run build
npm run lint
npm run test -- --run
```

## Variables de entorno

- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_APP_NAME`

## Notas importantes

- la app usa `createBrowserRouter`, por eso `vercel.json` incluye rewrite a `index.html`
- el refresh de sesion se hace automaticamente desde `src/lib/api.ts`
- el WebSocket invalida queries completas; no existe aun un centro de notificaciones en UI
