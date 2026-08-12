# Reporte de Prueba E2E Extremo a Extremo (MEJORADO) - Módulo de Presupuesto
**Fecha:** 2026-08-12T02:23:44.850Z

## Log de Actividad
- **LOGIN**: Iniciando sesión - INICIANDO
  
- **LOGIN**: Login exitoso - EXITOSO
  
- **PROYECTO**: Navegando a módulo de Proyectos - INICIANDO
  
- **PROYECTO**: Formulario de proyecto abierto - EXITOSO
  
- **PROYECTO**: Llenando formulario de proyecto - INICIANDO
  
- **PROYECTO**: Nombre del proyecto ingresado - EXITOSO
  Torre Beta Extremo Test IMPROVED 1786501331330
- **PROYECTO**: Presupuesto base ingresado - EXITOSO
  $75,000,000
- **PROYECTO**: Fecha inicio ingresada - EXITOSO
  2026-10-01
- **PROYECTO**: Fecha fin ingresada - EXITOSO
  2029-06-30
- **PROYECTO**: Proyecto guardado - EXITOSO
  
- **LIMPIEZA**: 1 modal(es) cerrado(s) - EXITOSO
  
- **LIMPIEZA**: 1 toast(s) cerrado(s) - EXITOSO
  
- **PRESUPUESTO**: Navegando a módulo de Presupuestos - INICIANDO
  
- **PRESUPUESTO**: Formulario de presupuesto abierto - EXITOSO
  
- **LIMPIEZA**: 1 toast(s) cerrado(s) - EXITOSO
  
- **PRESUPUESTO**: Agregando items de presupuesto - INICIANDO
  10 items planificados
- **PRESUPUESTO**: Item 1 agregado - EXITOSO
  Cemento tipo I - 8000 ton @ $4200
- **LIMPIEZA**: 1 modal(es) cerrado(s) - EXITOSO
  
- **PRESUPUESTO**: Item 2 agregado - EXITOSO
  Varilla de acero - 3500 ton @ $13500
- **PRESUPUESTO**: Item 3 agregado - EXITOSO
  Concreto premezclado - 15000 m3 @ $1800
- **PRESUPUESTO**: Item 4 agregado - EXITOSO
  Block de concreto - 1200000 mil @ $4.2
- **PRESUPUESTO**: Item 5 agregado - EXITOSO
  Piso laminado - 35000 m2 @ $150
- **PRESUPUESTO**: Item 6 agregado - EXITOSO
  Muro cortina - 18000 m2 @ $650
- **PRESUPUESTO**: Item 7 agregado - EXITOSO
  Hidrosanitarias - 1 conjunto @ $5500000
- **PRESUPUESTO**: Item 8 agregado - EXITOSO
  Electromecánicas - 1 conjunto @ $7200000
- **PRESUPUESTO**: Item 9 agregado - EXITOSO
  Elevadores de pasajeros - 6 unidad @ $950000
- **PRESUPUESTO**: Item 10 agregado - EXITOSO
  Montacargas - 2 unidad @ $420000
- **PRESUPUESTO**: Cálculo de total estimado - CALCULADO
  $149,080,000
- **PRESUPUESTO**: Presupuesto guardado - EXITOSO
  
- **TRANSICIÓN**: Iniciando transición de fase - INICIANDO
  
- **TRANSICIÓN**: Proyecto seleccionado - EXITOSO
  
- **ERROR**: Error crítico durante prueba - ERROR
  locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('option:has-text("Ejecución"), option:has-text("execution"), button:has-text("Ejecución")').first()[22m
[2m    - locator resolved to <option value="execution">En Ejecución</option>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    58 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m


## Problemas Detectados
- **[CRÍTICO] Formulario Presupuesto**: Selector de proyecto no encontrado
  - Impacto: No se puede vincular presupuesto
  - Solución: Verificar visibilidad del selector
- **[MEDIO] Validación Presupuesto**: Diferencia significativa entre presupuesto base y items
  - Impacto: Variance: 98.77%
  - Solución: Implementar validación en tiempo real que alerte cuando los items excedan el presupuesto base

## Mejoras Propuestas
- **[ALTA] Alerta de exceso de presupuesto**
  - Los items exceden el presupuesto base en 98.77% ($74,080,000)
  - Esfuerzo: BAJO

## Resumen
- Total de acciones: 32
- Problemas detectados: 2
- Mejoras propuestas: 1
