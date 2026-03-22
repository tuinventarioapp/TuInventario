# TuInventario - Documentacion Maestra para IA

Este directorio contiene la documentacion base para que una IA construya `TuInventario` desde cero, con el menor nivel posible de ambiguedad y con una trazabilidad clara entre negocio, arquitectura, reglas, prompts y skills.

## Objetivo

- Documentar el producto, el negocio y las restricciones del MVP.
- Definir una ruta de implementacion para frontend, backend, base de datos, testing y despliegue.
- Entregar prompts y skills reutilizables para Codex, Cursor, Claude u otra IA equivalente.
- Reducir retrabajo, contradicciones y sobre-diseno durante la construccion.

## Estructura

- `00-master`: documentos rectores del proyecto.
- `01-business`: vision, reglas de negocio, historias y backlog.
- `02-frontend`: arquitectura, pantallas, UX y testing del frontend.
- `03-backend`: arquitectura, modulos, API, seguridad y testing del backend.
- `04-database`: modelo relacional, migraciones, indices y uso por MCP.
- `05-delivery`: monorepo, Docker, variables, CI/CD y despliegue.
- `06-prompts`: prompts secuenciales para construir, revisar y liberar el sistema.
- `07-skills`: skills reutilizables por area para otra IA.
- `08-templates`: plantillas para nuevas historias, endpoints, entidades y escenarios QA.

## Como usar esta documentacion

1. Leer `00-master/00-reading-order.md`.
2. Usar `00-master/09-ai-execution-rules.md` como reglas globales no negociables.
3. Cargar contexto de negocio antes de escribir codigo.
4. Ejecutar los prompts de `06-prompts` en el orden sugerido.
5. Usar las skills de `07-skills` por area de trabajo.
6. Mantener la documentacion sincronizada con cada cambio importante.

## Resultado esperado

Una IA debe poder:

- crear el monorepo completo;
- levantar frontend, backend y PostgreSQL local con Docker;
- modelar y migrar la base de datos;
- implementar flujos criticos del MVP;
- cubrirlos con pruebas;
- documentar lo construido y dejarlo listo para despliegue.

## Ejemplo de uso

Una IA orquestadora puede leer este directorio y ejecutar la secuencia:

1. analizar huecos;
2. validar reglas de negocio;
3. construir base tecnica;
4. implementar modulos por prioridad;
5. probar;
6. documentar;
7. preparar release.
