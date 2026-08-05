# CONSTRUCTORA WM/M&S - Sistema de Control de Seguimiento

> **Slogan:** "CONSTRUYENDO EL FUTURO"  
> **Stack:** Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS + Supabase + Dexie.js  
> **Moneda:** GTQ (Quetzales)

---

## Estado actual de la suite

La suite está en producción y compilando sin errores. Los últimos commits aplicados (`c5fe15d`, `9e58722`, `d2388cc`, `2214eda`) agregan: subcontratistas, tracking de pagos/impuestos, validación de stock mínimo, workflow de aprobación de órdenes de compra, reemplazo total de `alert()` por toasts, unificación de `ActionButton`, `ErrorBoundary`, `OnboardingTooltip`, `EmptyState`, `ConfirmDialog`, `Tooltip`, `OfflineSyncIndicator`, correcciones de scroll/overflow y cierre de hallazgos del audit inicial.

**Build:** `npm run build` y `npm run type-check` pasan.  
**Repo:** `https://github.com/salazaroliveros-prog/construsmart-wm.git`  
**Producción:** `https://construsmart-wm.vercel.app`

---

## Módulos

| Módulo | Estado | Notas |
|---|---|---|
| Dashboard Principal | Activo | 6 gráficas, zero-scroll, responsive |
| Proyectos | Activo | CRUD + bitácora integrada + detección de roadblocks |
| Presupuestos / APU | Activo | Cálculos estructurales, library 40 items, breakdown |
| Finanzas | Activo | Categorías ampliadas, campos de pago/tax/doc, sincronización con nómina |
| Nómina | Activo | Generación automática de transacciones financieras |
| Almacén | Activo | Control de stock, mínimo threshold, auto-PO, integración con presupuestos |
| Proveedores | Activo | CRUD + alertas de material + integración OC |
| Órdenes de Compra | Activo | Estado `pending_approval`, aprobar/rechazar, resumen por estado |
| Subcontratistas | Activo | Retenciones/anticipos, registro independiente |
| Clientes | Activo | CRM base + integración con proyectos |
| Bitácora | Activo | Registro de avances + alertas críticas |
| Analytics | Activo | Curva S, Gantt, avance físico/financiero, presupuestado vs real |

---

## Arquitectura técnica

### Offline-first
- **Local:** Dexie.js v9 (`lib/db/offlineStore.ts`) con tablas: `projects`, `budgets`, `budgetItems`, `financialTransactions`, `payrollEmployees`, `payrollRecords`, `warehouseStock`, `clients`, `projectLogs`, `suppliers`, `purchaseOrders`, `purchaseOrderItems`, `subcontractors`, `pendingDeletes`.
- **Remoto:** Supabase PostgreSQL con RLS, Realtime y sync bidireccional.
- **Motor:** `lib/utils/offlineSync.ts` + `SyncProvider` + `RealtimeProvider`.

### UI/UX
- **Glassmorphism:** `.glass-panel`, `.glass-card`, `.glass-button` en `app/globals.css`.
- **Primitivas:** `ActionButton`, `ConfirmDialog`, `EmptyState`, `Tooltip`, `OnboardingTooltip`, `ErrorBoundary`, `OfflineSyncIndicator`.
- **Scroll:** `overflow-anchor-none` en modales y contenedores desplazables.
- **Validaciones:** Zod en formularios + toasts en lugar de `alert()`.

### Seguridad y performance
- RLS alineada en Supabase.
- Índices en `sync_status`, fechas y FKs.
- Validación estricta de transiciones de sincronización (`validateSyncTransition`).

---

## Estructura

```
app/
  layout.tsx
  page.tsx
  login/page.tsx
  admin/database-cleaner/
components/
  analytics/
  budgets/
  crm/
  dashboard/
  finances/
  payroll/
  progress/
  project/
  settings/
  ui/
  warehouse/
lib/
  calculators/
  config/
  db/offlineStore.ts
  hooks/
  supabase/
  types/
  utils/offlineSync.ts
public/
  sw.js
  manifest.json
supabase/
  migrations/
```

---

## Configuración

```env
NEXT_PUBLIC_SUPABASE_URL=https://yibjsruoxjlgdnkgylld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_SITE_URL=https://construsmart-wm.vercel.app
```

```bash
npm install
npm run dev
npm run build
```

---

## Documentación

Toda la documentación del proyecto está centralizada en `/docs`.

- `docs/ANALYSIS_AND_IMPROVEMENTS.md` — auditoría funcional y mejoras aplicadas.
- `docs/ARCHITECTURAL_REFACTORING_REPORT.md` — pipelines inter-módulo.
- `docs/EXPONENTIAL_UPGRADE_ARCHITECTURAL_STRATEGY.md` — roadmap por módulo.
- `docs/DATABASE_SCHEMA.md` — esquema remoto Supabase.
- `docs/DATABASE_ALIGNMENT_REPORT.md` — alineación offline/remote.
- `docs/PWA_OFFLINE_SYNC.md` — modelo de sincronización.
- `docs/SECURITY_PERFORMANCE_FIXES_REPORT.md` — correcciones RLS/performance.
- `docs/SCROLL_VERIFICATION_REPORT.md` — verificación de scroll/overflow.
- `docs/CLICK_INCONSISTENCY_ANALYSIS.md` — corrección de navegación por tabs.
- `docs/FORM_BUTTONS_VALIDATION.md` — validación de botones por formulario.
- `docs/REQUIREMENTS_ANALYSIS_REPORT.md` — cumplimiento de requisitos.

---

## Validación

```bash
npm run type-check
npm run build
```

---

**Versión:** 1.0.0  
**Última actualización:** 2026-08-05  
**Framework:** Next.js 16 + React 19  
**Base de datos:** Supabase + Dexie.js
