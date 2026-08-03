# Instrucciones de implementación de correcciones críticas

## Objetivo

Corregir los puntos más frágiles del flujo de datos offline/online del sistema, priorizando:

1. Consistencia de estados de sincronización.
2. Persistencia segura de registros locales en modo offline.
3. Revisión de los flujos de guardado en módulos clave.
4. Validación continua con pruebas y typecheck.

## Prioridad 1 — Consistencia de sincronización

- Centralizar la lógica de asignación de estados de sincronización con utilidades compartidas.
- Evitar estados literales dispersos en componentes.
- Mantener los registros locales con estados coherentes al crear, editar o eliminar datos.

## Prioridad 2 — Flujos de guardado offline

- Asegurar que los cambios locales se registren con el estado correcto cuando no hay conexión.
- Mantener los registros remotos y locales alineados cuando la conexión vuelva a estar disponible.
- Evitar perder cambios por reescrituras parciales.

## Prioridad 3 — Validación

- Ejecutar pruebas unitarias tras cada cambio relevante.
- Verificar que el proyecto siga compilando sin errores de TypeScript.
- Registrar cualquier regresión antes de avanzar a la siguiente ola de correcciones.

## Pasos recomendados

- Implementar utilidades compartidas para normalizar y resolver estados de sincronización.
- Aplicar las utilidades en módulos de clientes, proyectos, finanzas, nómina, almacén, compras y logs.
- Revalidar con pruebas y typecheck.
- Si aparecen nuevos problemas, corregirlos antes de continuar con la siguiente capa de mejoras.
