# Servicios y casos de uso reales

## Casos de uso backend visibles hoy

- crear organizacion y cuenta admin
- verificar email y emitir sesion
- recuperar contrasena de admin
- crear usuarios internos
- crear y actualizar catalogos
- crear items y ajustar stock inicial
- importar items desde archivo
- registrar movimientos
- crear solicitudes y grupos de prestamos
- aprobar, rechazar, entregar y devolver
- generar dashboard y reportes
- consultar auditoria

## Rasgos de implementacion

- la mayor parte de la logica vive en servicios por modulo
- movimientos y prestamos son transaccionales
- el backend publica auditoria y eventos realtime despues de cambios relevantes

## Nota

La arquitectura real no usa nombres como `InventoryCommandService` o `LoanLifecycleService`; la documentacion debe referirse a los servicios reales del codigo y no a servicios hipoteticos.
