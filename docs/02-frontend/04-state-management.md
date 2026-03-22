# Manejo de estado

## Regla base

Separar estado del servidor de estado de interfaz.

## TanStack Query

Usar para:

- consultas de listas y detalles;
- cache y revalidacion;
- mutaciones de CRUD;
- invalidacion por dominio;
- sincronizacion con tiempo real.

## Zustand

Usar para:

- UI global;
- filtros persistentes;
- drawer o modales globales;
- preferencias de vista;
- estado ligero de sesion cliente.

## Formularios

- React Hook Form para formularios;
- Zod para validaciones de cliente;
- validaciones de backend como autoridad final;
- mapear errores de API al formulario.

## Regla anti-caos

No duplicar en Zustand datos que ya viven correctamente en TanStack Query, salvo que exista una razon concreta y documentada.
