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
- Latest commit: `244f280` - Refactor: dashboard zero-scroll layout, no sidebar toggle, centered nav
- Status: Sincronizado con origin
- No cambios pendientes

## Supabase Database Status ✅

**Migration:** Completada exitosamente
- ✅ Todas las 12 tablas existentes
- ✅ Columnas APU agregadas (`apu_result`, `apu_params`)
- ✅ Índices creados
- ✅ Verificado con `supabase migration list`

## Vercel Deploy Status ⏳

**URL:** https://control-constructora-wm.vercel.app

### Problemas Detectados y Corregidos

1. **Caché del Service Worker obsoleta** — El `sw.js` usaba nombres de caché versionados (`v2`) que no se actualizaban entre deploys. Se actualizó a `v3` y se mejoró la limpieza de cachés antiguos.
2. **Sin `vercel.json`** — Se creó `vercel.json` con headers de `Cache-Control: max-age=0, must-revalidate` para `sw.js`, `manifest.json` y todas las rutas, forzando al navegador a revalidar en cada visita.
3. **`turbopack` experimental en `next.config.ts`** — Se eliminó la configuración de `turbopack` que podía causar fallos de build en Vercel.

### Pasos para Verificar el Deploy

1. **Forzar un nuevo deploy** en https://vercel.com/salazaroliveros-prog/Control_Constructora/deployments
2. **Hacer push de un cambio** a `main` y verificar que el auto-deploy se dispara
3. **Verificar en el sitio en vivo** que se carga la versión más reciente (hard-refresh: Ctrl+Shift+R)

## Estado del Código

**Últimos Commits:**
1. `244f280` - Refactor: dashboard zero-scroll layout, no sidebar toggle, centered nav
2. `0b6fc84` - Refactor: dashboard zero-scroll layout with responsive sidebar
3. `e14a236` - Fix: correct DB version reference in clear-local-db script (v2 -> v6)
4. `8eece68` - Fix offline sync bugs, add Realtime refresh, idempotent budget save
5. `9052395` - chore: pin node engine to 24.x to silence vercel auto-upgrade warning

**Archivos Nuevos Importantes:**
- `lib/state/budgetState.ts` - Estado global del presupuesto
- `components/progress/ProgressTracker.tsx` - Módulo de control de avance
- `lib/calculators/apuCalculator.ts` - Motor de cálculo APU
- `lib/data/apuRenglones.ts` - Catálogo de 125 renglones
- `lib/types/apu.ts` - Tipos APU
- `supabase/migrations/add_apu_integration.sql` - Migración APU
- `supabase/migrations/` - Migraciones de base de datos (aplicadas con `supabase db push`)

## Notas Importantes

### Vercel CLI no configurado localmente
Vercel CLI no está vinculado al proyecto localmente. Para verificar deploys automáticamente, configura el CLI:
```bash
npm i -g vercel
vercel login
vercel link
```

### Verificación manual necesaria
Debes verificar manualmente en el dashboard de Vercel usando los pasos arriba.

### GitHub Auto-deploy
Si el proyecto está configurado con GitHub auto-deploy en Vercel, el deploy debería haberse disparado automáticamente al hacer push del último commit.

## Resumen

| Componente | Estado | Notas |
|-----------|--------|-------|
| Local Build | ✅ | Sin errores |
| GitHub | ✅ | Up to date |
| Supabase DB | ✅ | Migración completada |
| vercel.json | ✅ | Creado con cache headers |
| next.config.ts | ✅ | turbopack eliminado |
| sw.js | ✅ | Cache version actualizado a v3 |
| Vercel Deploy | ⏳ | Forzar redeploy manualmente |
| Live Site | ⏳ | Verificar con hard-refresh |

## Siguiente Acción

1. Forzar un redeploy en Vercel Dashboard: https://vercel.com/salazaroliveros-prog/Control_Constructora/deployments
2. Hacer hard-refresh en el sitio: Ctrl+Shift+R
3. Verificar que el dashboard refactorizado se muestra correctamente
4. Probar el auto-deploy haciendo un cambio pequeño y haciendo push a `main`
