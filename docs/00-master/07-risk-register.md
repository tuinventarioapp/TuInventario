# Registro inicial de riesgos

## Riesgos altos

- inconsistencia de stock por errores de concurrencia;
- reglas ambiguas entre consumibles y activos prestables;
- permisos insuficientemente aislados por organizacion;
- prestamos vencidos sin cambio automatico de estado;
- documentacion desactualizada frente al codigo.

## Mitigaciones

- usar transacciones y bloqueo optimista donde aplique;
- separar reglas por tipo de item desde el modelo;
- validar organizacion en cada consulta y comando;
- programar jobs de vencimiento y recordatorios;
- exigir documentacion de cambios como Definition of Done.

## Riesgos medios

- complejidad innecesaria del frontend;
- crecimiento prematuro hacia funcionalidades no MVP;
- dependencia excesiva de archivos adjuntos y branding al inicio;
- pruebas insuficientes en flujos de devolucion.

## Alerta roja

Si el equipo intenta agregar pagos, facturacion, contabilidad o offline antes de estabilizar inventario y prestamos, el alcance debe considerarse fuera de control.
