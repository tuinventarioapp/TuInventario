# Flujos nucleares del negocio

## 1. Alta de organizacion y administrador

1. un usuario entra a `Crear cuenta`
2. registra nombre, email, password y nombre de organizacion
3. el backend crea `users`, `organizations` y `memberships`
4. la cuenta queda con rol `ADMIN` y `emailVerified=false`
5. se envia un codigo de verificacion por correo
6. al validar el codigo, la API devuelve sesion y el admin entra a la app

## 2. Configuracion inicial

1. el admin crea o ajusta categorias, unidades, categorias de ubicacion y ubicaciones
2. crea usuarios internos y les asigna rol y, si aplica, sede
3. define articulos y stock inicial

## 3. Operacion de inventario

1. el usuario busca el articulo
2. registra entrada, salida, ajuste o traslado
3. el backend recalcula stock agregado
4. auditoria y realtime notifican a clientes conectados

## 4. Prestamos internos

1. se crea una solicitud para un prestatario
2. la solicitud se aprueba o rechaza
3. si se aprueba, el stock pasa a reservado
4. al entregar, el stock pasa a prestado
5. al devolver, el stock vuelve a disponible
6. si no se devuelve a tiempo, el job marca el prestamo como vencido

## 5. Solicitud publica de prestamo

1. la organizacion comparte un enlace con `organizationId`
2. una persona sin login entra a `/public-loan-request`
3. el formulario lista items prestables con stock
4. al enviar, se crea una solicitud pendiente dentro de la organizacion
5. el equipo interno la revisa desde el modulo de prestamos

## 6. Recuperacion de contrasena para administradores

1. el admin entra a `Olvide mi contrasena`
2. ingresa su email
3. el backend valida que sea admin verificado
4. se envia codigo y enlace de recuperacion
5. el admin define una nueva contrasena desde la pantalla publica de reset

## 7. Reportes y control

1. el usuario entra a `Reportes`
2. elige CSV o PDF
3. puede filtrar por fecha y, segun rol, por sede
4. el backend genera el archivo con localizacion basada en el idioma actual
