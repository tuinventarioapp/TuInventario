# Alcance real del MVP

## Incluido hoy

- autenticacion por email y contrasena
- registro publico de administrador con creacion de organizacion
- verificacion por correo para cuentas `ADMIN`
- recuperacion de contrasena por correo para cuentas `ADMIN`
- multi-organizacion con aislamiento por `organizationId`
- membresias por usuario, rol y sede asignada
- catalogos: categorias, unidades, categorias de ubicacion y ubicaciones
- articulos con stock agregado, stock minimo y carga inicial
- importacion masiva de articulos con plantilla y preview
- movimientos de inventario con entradas, salidas, ajustes y traslados
- prestatarios internos y solicitud publica de prestamos por enlace
- solicitudes, aprobacion, rechazo, entrega y devolucion de prestamos
- dashboard operativo
- reportes CSV y PDF
- auditoria funcional
- sincronizacion basica en tiempo real por WebSocket
- interfaz multidioma `es`, `en`, `pt`
- despliegue local reproducible con Docker Compose

## Incluido de forma parcial

- realtime: existe, pero hoy invalida cache; no hay panel completo de notificaciones
- branding de reportes: existe logo en PDF si el recurso esta disponible
- despliegue cloud: hay guias y archivos puntuales, pero no pipeline completo ni IaC

## No incluido hoy

- app movil nativa
- modo offline
- pagos
- ERP o contabilidad
- integraciones empresariales complejas
- lector de codigo de barras o QR
- centro de notificaciones en UI
- breadcrumbs y buscador global
- CI/CD real dentro del repo
- rate limiting y bloqueo por intentos fallidos

## Definicion de MVP correcto

El MVP esta correctamente implementado si una organizacion puede crear su cuenta administradora, configurar sedes y catalogos, administrar stock, atender prestamos y descargar reportes sin depender de hojas de calculo ni perder trazabilidad operativa.
