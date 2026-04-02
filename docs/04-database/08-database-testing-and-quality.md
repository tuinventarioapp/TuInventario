# Calidad y testing de base de datos

## Validaciones minimas

- migraciones aplican desde cero
- esquema queda alineado con entidades JPA usadas
- constraints de unicidad funcionan
- claves foraneas evitan referencias invalidas
- seeds base cargan sin error

## Riesgos actuales a vigilar

- columnas heredadas que siguen en la base aunque ya no se usen desde el backend
- tablas reales sin modulo funcional completo, como `notifications`
- divergencia entre lo que usa la app y lo que conserva el esquema por compatibilidad

## Herramientas usadas hoy

- Flyway
- H2 y Testcontainers en backend
- pruebas integradas que ejercitan flujos reales
