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
- Latest commit: `11ccf18` - fix: remove deployment-url.txt, add to .gitignore, remove PWA plugin to prevent sw.js overwrite
- Status: Sincronizado con origin
- No cambios pendientes

## Supabase Database Status ✅

**Migration:** Completada exitosamente
- ✅ Todas las 12 tablas existentes
- ✅ Columnas APU agregadas (`apu_result`, `apu_params`)
- ✅ Índices creados
- ✅ Verificado con `supabase migration list`

## Vercel Deploy Status ✅

**URL:** https://construsmart-wm.vercel.app
**Auto-deploy:** ✅ Funcionando (webhook configurado)

### Problemas Detectados y Corregidos

1. **Caché del Service Worker obsoleta** — El `sw.js` usaba nombres de caché versionados (`v2`) que no se actualizaban entre deploys. Se actualizó a `v3` y se mejoró la limpieza de cachés antiguos.
2. **Sin `vercel.json`** — Se creó `vercel.json` con headers de `Cache-Control: max-age=0, must-revalidate` para `sw.js`, `manifest.json` y todas las rutas, forzando al navegador a revalidar en cada visita.
3. **`turbopack` experimental en `next.config.ts`** — Se eliminó la configuración de `turbopack` que podía causar fallos de build en Vercel (luego se restauró porque Next.js 16 lo requiere).
4. **Auto-deploy no funcionaba** — No había webhook de GitHub configurado para Vercel. Se creó un webhook en la repo de GitHub que dispara deploys en cada push a `main`. (Posteriormente se reemplazó por la integración Git de Vercel).
5. **Scroll bloqueado por `overflow-anchor`** — Se agregó `overflow-anchor-none` a todos los contenedores scrollables de la suite para evitar que el navegador bloquee el scroll cuando hay elementos flotantes o modales.
6. **Reordenamiento de tarjetas en dashboard** — Se intercambiaron las posiciones de las tarjetas de nivel (Básico/Moderado/Premium) y los paneles de gráficas (Estado de Proyectos/Distribución de Gastos/Flujo Financiero). Las tarjetas de nivel ahora están en el área de gráficas y las gráficas están en la columna derecha donde estaban las tarjetas.
7. **Plugin PWA sobrescribiendo `sw.js`** — El plugin `@ducanh2912/next-pwa` regeneraba `public/sw.js` durante el build de Vercel, sobrescribiendo los nombres de caché personalizados (`v3`). Se eliminó el plugin de `next.config.ts` para preservar el `sw.js` personalizado y los nombres de caché `v3`.
8. **Políticas RLS excesivamente permisivas** — Todas las tablas tenían políticas `USING (true) WITH CHECK (true)` que permitían acceso completo (lectura + escritura) a cualquier persona con la anon key. Se creó migración `20250201000000_fix_security_rls_policies.sql` que reemplaza las políticas con SELECT-only para anon y INSERT/UPDATE/DELETE solo para usuarios autenticados.

### Pasos para Verificar el Deploy

1. **Hacer push de un cambio** a `main` y verificar que el auto-deploy se dispara automáticamente
2. **Verificar en el sitio en vivo** que se carga la versión más reciente (hard-refresh: Ctrl+Shift+R)

## Estado del Código

**Últimos Commits:**
1. `11ccf18` - fix: remove deployment-url.txt, add to .gitignore, remove PWA plugin to prevent sw.js overwrite
2. `60740ba` - fix: remove @ducanh2912/next-pwa plugin to prevent sw.js overwrite during Vercel builds
3. `01cd5ef` - refactor: swap tier cards and chart panels in dashboard layout
4. `c88ca9f` - docs: update DEPLOYMENT_STATUS.md with webhook fix and overflow-anchor-none
5. `84bffc9` - feat: add overflow-anchor-none to all scrollable containers
6. `d9cdfad` - fix: add overflow-anchor-none to ProjectOverview + globals.css
7. `e50d68e` - fix: vercel.json cache headers, sw.js v3, DEPLOYMENT_STATUS update
8. `244f280` - Refactor: dashboard zero-scroll layout, no sidebar toggle, centered nav
9. `0b6fc84` - Refactor: dashboard zero-scroll layout with responsive sidebar
10. `e14a236` - Fix: correct DB version reference in clear-local-db script (v2 -> v6)
11. `8eece68` - Fix offline sync bugs, add Realtime refresh, idempotent budget save
12. `9052395` - chore: pin node engine to 24.x to silence vercel auto-upgrade warning

**Archivos Nuevos Importantes:**
- `components/dashboard/TierCards.tsx` - Tarjetas de nivel (Básico/Moderado/Premium) extraídas como componente
- `components/dashboard/DashboardCharts.tsx` - Gráficas extraídas como componente (Estado de Proyectos, Distribución de Gastos, Flujo Financiero)
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
El proyecto está configurado con GitHub auto-deploy en Vercel mediante la integración Git de Vercel. Los pushes a `main` disparan deploys automáticamente.

### PWA (Service Worker)
El plugin `@ducanh2912/next-pwa` fue eliminado de `next.config.ts` porque sobrescribía `public/sw.js` durante el build de Vercel. El SW personalizado (`public/sw.js` con cache `v3`) es registrado manualmente por `ServiceWorkerRegistration.tsx`.

## Resumen

| Componente | Estado | Notas |
|-----------|--------|-------|
| Local Build | ✅ | Sin errores |
| GitHub | ✅ | Up to date |
| Supabase DB | ✅ | Migración completada |
| vercel.json | ✅ | Creado con cache headers |
| next.config.ts | ✅ | turbopack restaurado, PWA plugin eliminado |
| sw.js | ✅ | Cache version actualizado a v3, PWA plugin removed to prevent overwrite |
| Auto-deploy | ✅ | Vercel Git Integration funcionando |
| overflow-anchor-none | ✅ | Aplicado a todos los contenedores scrollables |
| Dashboard Layout | ✅ | Tarjetas de nivel y gráficas intercambiadas |
| Vercel Deploy | ✅ | Funcionando |
| Live Site | ✅ | https://construsmart-wm.vercel.app |

## Siguiente Acción

1. ✅ Verificado: auto-deploy funciona (push a `main` dispara deploy automáticamente)
2. Probar el scroll en todos los contenedores de la suite para confirmar que `overflow-anchor-none` resuelve el problema de scroll bloqueado
3. Verificar que el intercambio de tarjetas y gráficas en el dashboard se muestra correctamente
4. Verificar que el service worker v3 se sirve correctamente en producción (Ctrl+Shift+R)
