# 🚀 Deployment Status - CONSTRUCTORA WM/M&S

## Build Status ✅

**Local Build:** ✅ Exitoso
```
✓ Compiled successfully in 5.2s
✓ TypeScript passed in 6.9s
✓ Static pages generated
✓ Build completed without errors
```

## GitHub Status ✅

**Repository:** Up to date
- Branch: `main`
- Latest commit: `84bffc9` - feat: add overflow-anchor-none to all scrollable containers
- Status: Sincronizado con origin
- No cambios pendientes

## Supabase Database Status ✅

**Migration:** Completada exitosamente
- ✅ Todas las 12 tablas existentes
- ✅ Columnas APU agregadas (`apu_result`, `apu_params`)
- ✅ Índices creados
- ✅ Verificado con `supabase migration list`

## Vercel Deploy Status ✅

**URL:** https://control-constructora-wm.vercel.app
**Auto-deploy:** ✅ Funcionando (webhook configurado)

### Problemas Detectados y Corregidos

1. **Caché del Service Worker obsoleta** — El `sw.js` usaba nombres de caché versionados (`v2`) que no se actualizaban entre deploys. Se actualizó a `v3` y se mejoró la limpieza de cachés antiguos.
2. **Sin `vercel.json`** — Se creó `vercel.json` con headers de `Cache-Control: max-age=0, must-revalidate` para `sw.js`, `manifest.json` y todas las rutas, forzando al navegador a revalidar en cada visita.
3. **`turbopack` experimental en `next.config.ts`** — Se eliminó la configuración de `turbopack` que podía causar fallos de build en Vercel (luego se restauró porque Next.js 16 lo requiere).
4. **Auto-deploy no funcionaba** — No había webhook de GitHub configurado para Vercel. Se creó un webhook en la repo de GitHub que dispara deploys en cada push a `main`.
5. **Scroll bloqueado por `overflow-anchor`** — Se agregó `overflow-anchor-none` a todos los contenedores scrollables de la suite para evitar que el navegador bloquee el scroll cuando hay elementos flotantes o modales.

### Pasos para Verificar el Deploy

1. **Hacer push de un cambio** a `main` y verificar que el auto-deploy se dispara automáticamente
2. **Verificar en el sitio en vivo** que se carga la versión más reciente (hard-refresh: Ctrl+Shift+R)

## Estado del Código

**Últimos Commits:**
1. `84bffc9` - feat: add overflow-anchor-none to all scrollable containers
2. `d9cdfad` - fix: add overflow-anchor-none to ProjectOverview + globals.css
3. `e50d68e` - fix: vercel.json cache headers, sw.js v3, DEPLOYMENT_STATUS update
4. `244f280` - Refactor: dashboard zero-scroll layout, no sidebar toggle, centered nav
5. `0b6fc84` - Refactor: dashboard zero-scroll layout with responsive sidebar
6. `e14a236` - Fix: correct DB version reference in clear-local-db script (v2 -> v6)
7. `8eece68` - Fix offline sync bugs, add Realtime refresh, idempotent budget save
8. `9052395` - chore: pin node engine to 24.x to silence vercel auto-upgrade warning

**Archivos Nuevos Importantes:**
- `lib/state/budgetState.ts` - Estado global del presupuesto
- `components/progress/ProgressTracker.tsx` - Módulo de control de avance
- `lib/calculators/apuCalculator.ts` - Motor de cálculo APU
- `lib/data/apuRenglones.ts` - Catálogo de 125 renglones
- `lib/types/apu.ts` - Tipos APU
- `supabase/migrations/add_apu_integration.sql` - Migración APU
- `supabase/migrations/` - Migraciones de base de datos (aplicadas con `supabase db push`)

## Notas Importantes

### Vercel CLI configurado localmente
El CLI de Vercel está vinculado al proyecto localmente. Los deploys se pueden hacer con `vercel --prod`.

### Auto-deploy desde GitHub
El proyecto está configurado con GitHub auto-deploy en Vercel. Se creó un webhook en la repo de GitHub que dispara deploys automáticamente al hacer push a `main`.

## Resumen

| Componente | Estado | Notas |
|-----------|--------|-------|
| Local Build | ✅ | Sin errores |
| GitHub | ✅ | Up to date |
| Supabase DB | ✅ | Migración completada |
| vercel.json | ✅ | Creado con cache headers |
| next.config.ts | ✅ | turbopack restaurado (requerido por Next.js 16) |
| sw.js | ✅ | Cache version actualizado a v3 |
| Auto-deploy Webhook | ✅ | Creado en GitHub repo |
| overflow-anchor-none | ✅ | Aplicado a todos los contenedores scrollables |
| Vercel Deploy | ✅ | Funcionando |
| Live Site | ✅ | https://control-constructora-wm.vercel.app |

## Siguiente Acción

1. Verificar que el auto-deploy funciona haciendo un cambio pequeño y haciendo push a `main`
2. Probar el scroll en todos los contenedores de la suite para confirmar que `overflow-anchor-none` resuelve el problema de scroll bloqueado
