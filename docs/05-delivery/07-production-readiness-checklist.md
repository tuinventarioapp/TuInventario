# Checklist de readiness para produccion

## Listo hoy

- build local de frontend y backend
- migraciones versionadas
- variables de entorno documentadas
- SMTP configurable
- endpoints de health y swagger

## Pendiente antes de produccion seria

- secretos reales por entorno
- `APP_DEMO_SEED_ENABLED=false`
- dominio y HTTPS finales
- politica de backups de base de datos
- CORS ajustado al dominio real
- CI/CD
- monitoreo y logs centralizados
- rate limiting
- endurecimiento de WebSocket
