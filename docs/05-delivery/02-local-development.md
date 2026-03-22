# Desarrollo local

## Requisito

El proyecto debe iniciar con un solo comando.

## Propuesta

- Docker Compose para PostgreSQL y servicios auxiliares;
- script de bootstrap para instalar dependencias y levantar entorno;
- perfiles separados para desarrollo y testing.

## Flujo esperado

1. clonar repositorio;
2. copiar variables de entorno;
3. ejecutar comando unico;
4. abrir frontend y backend ya conectados.

## Ejemplo de comando objetivo

```bash
docker compose up --build
```

o un wrapper equivalente:

```bash
./scripts/dev-up.sh
```
