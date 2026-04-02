# Estrategia real de pruebas backend

## Suite actual

Archivos presentes:

- `AuthControllerTest`
- `MailConfigTest`
- `MovementControllerTest`
- `OperationalFlowTest`

## Cobertura observable

- autenticacion y flujo publico de admins
- configuracion de mail
- operaciones de movimientos
- flujo operativo integrado de inventario y prestamos

## Comando

```powershell
.\mvnw.cmd test
```

## Estado real

- las pruebas backend actuales pasan
- hay mezcla de pruebas de controlador e integracion
- no toda regla de negocio tiene cobertura aislada
