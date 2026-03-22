# Servicios de dominio y casos de uso

## Casos de uso esenciales

- crear organizacion e inicializar datos semilla;
- crear item;
- registrar stock inicial;
- registrar movimiento;
- aprobar solicitud de prestamo;
- entregar prestamo;
- registrar devolucion;
- cerrar o marcar vencimiento;
- exportar reporte.

## Reglas de modelado

- encapsular cambios de estado en metodos con intencion;
- no permitir que el controller cambie estados directamente;
- centralizar validaciones de negocio repetibles;
- publicar eventos de dominio solo despues de cambios exitosos.

## Ejemplo de servicios

- `InventoryCommandService`
- `MovementApplicationService`
- `LoanLifecycleService`
- `AccessControlService`
- `ReportGenerationService`

## Regla de transaccion

Movimientos, prestamos y devoluciones deben ser transaccionales. Si falla una parte, la operacion completa debe revertirse.
