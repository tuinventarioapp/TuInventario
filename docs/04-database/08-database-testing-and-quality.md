# Calidad y testing de base de datos

## Validaciones minimas

- constraints de unicidad funcionando;
- foreign keys correctas;
- migraciones aplican desde cero;
- seeds base se cargan sin errores;
- queries principales responden con rendimiento razonable.

## Casos de prueba

- impedir SKU duplicado dentro de una organizacion;
- permitir mismo SKU en organizaciones distintas solo si la politica final lo admite;
- impedir movimiento con item inexistente;
- impedir prestamo con cantidades negativas;
- verificar que soft delete no elimine historial.

## Herramientas recomendadas

- Testcontainers con PostgreSQL real;
- pruebas de repositorio e integracion;
- scripts de smoke test para migraciones.
