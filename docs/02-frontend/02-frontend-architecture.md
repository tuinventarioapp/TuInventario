# Arquitectura frontend

## Stack real

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form
- Zod
- STOMP client

## Estructura real

```text
apps/web/src/
  app/
  assets/
  components/
  features/
  hooks/
  i18n/
  lib/
  pages/
  store/
  types/
```

## Criterios actuales

- las rutas viven en `app/router.tsx`
- las paginas siguen siendo el punto principal de composicion
- `components/` agrupa piezas compartidas
- `lib/api.ts` centraliza llamadas HTTP y refresh automatico
- `store/auth-store.ts` guarda la sesion del usuario
- `hooks/use-realtime-sync.ts` escucha WebSocket y refresca cache

## Limitaciones actuales

- no existe una capa `services/` separada de `lib/api.ts`
- no se usa `shadcn/ui`
- no hay E2E en el repo
