# TuInventario - Documentacion del estado actual

Este directorio documenta el estado real de TuInventario. La fuente principal de verdad es el codigo del repo; estos documentos deben mantenerse alineados con lo que hoy existe en frontend, backend, base de datos, pruebas y despliegue.

## Objetivo

- describir la arquitectura y los flujos reales del sistema
- dejar claras las funcionalidades implementadas y las pendientes
- evitar contradicciones entre documentos y codigo
- servir como base de mantenimiento, QA, despliegue y handover

## Estructura

- `00-master`: contexto, alcance, arquitectura y criterios globales
- `01-business`: negocio, roles, reglas y flujos operativos
- `02-frontend`: rutas, arquitectura de UI, estado, tiempo real y testing
- `03-backend`: arquitectura Spring Boot, seguridad, modulos, endpoints y pruebas
- `04-database`: modelo real de datos, migraciones e indices
- `05-delivery`: desarrollo local, variables, Docker, despliegue y readiness
- `06-prompts`: prompts de trabajo alineados con el estado actual del producto
- `07-skills`: skills operativas para trabajar sobre el proyecto real
- `08-templates`: plantillas reutilizables
- `09-manual-usuario`: manual funcional orientado a operacion

## Como leerla

1. `00-master/00-reading-order.md`
2. `00-master/02-mvp-scope.md`
3. `00-master/04-architecture-overview.md`
4. `01-business/03-domain-rules.md`
5. `03-backend/09-endpoints-and-dtos-overview.md`
6. `04-database/03-relational-schema.md`
7. `05-delivery/02-local-development.md`

## Reglas de mantenimiento

- si una funcionalidad no existe, debe documentarse como pendiente o no implementada
- si una funcionalidad existe solo en backend o solo en base de datos, debe explicarse asi
- no usar esta carpeta para prometer features que el producto todavia no entrega
- cuando cambie codigo, migraciones, variables o despliegue, actualizar los documentos impactados
