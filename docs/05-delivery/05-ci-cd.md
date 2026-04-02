# Estado de CI/CD

## Realidad actual

- no existe pipeline CI/CD versionado dentro del repo
- no hay workflows en `.github/workflows`
- no hay `render.yaml` ni `railway.toml`

## Lo que si existe

- comandos reproducibles de build y test
- Dockerfiles para backend y frontend
- `vercel.json` para SPA routing del frontend

## Recomendacion

Cuando se implemente CI/CD real, la documentacion debe actualizarse con:

- validacion de backend
- validacion de frontend
- build de imagenes
- despliegue por entorno
