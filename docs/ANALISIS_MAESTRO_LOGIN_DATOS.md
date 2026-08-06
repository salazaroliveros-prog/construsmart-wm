# 🔍 ANÁLISIS Y MAPEO MAESTRO — LOGIN, INPUTS, LECTURA Y RENDERIZADO DE DATOS

> **Sistema:** CONSTRUCTORA WM/M&S — "CONSTRUYENDO EL FUTURO"
> **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Dexie.js (offline-first)
> **Fecha de análisis:** 2026-08-05 · **Moneda:** GTQ

---

## 1. FLUJO DE LOGIN Y ENTRADA CORRECTA A LA SUITE (MAPEO)

### 1.1 Componentes y capas implicadas

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Middleware (borde) | `proxy.ts` (raíz) + `lib/proxy.ts` | Intercepta TODAS las rutas, lee la cookie de sesión de Supabase y redirige a `/login` si no hay usuario. Excluye `/login` y `/api/auth`. |
| Layout raíz | `app/layout.tsx` | Envuelve toda la app en `AuthProvider` → `AuthGuard` → `ErrorBoundary`, más `SyncProvider` y `RealtimeProvider`. |
| Proveedor auth | `lib/auth/auth-context.tsx` | Estado global (`user`, `loading`, `isAuthenticated`), `signIn`, `signOut`, `onAuthStateChange`. |
| Guard de rutas | `components/auth/AuthGuard.tsx` | Redirige a `/login` si no hay sesión; fuerza solo admin (`salazaroliveros@gmail.com`). |
| Página login | `app/login/page.tsx` | Formulario de credenciales; muestra error `unauthorized`. |
| Sync de cookie | `app/api/auth/session/route.ts` | Recibe tokens del cliente y escribe la cookie httpOnly de sesión en el servidor. |
| Clientes Supabase | `lib/supabase/client.ts` · `server.ts` · `admin.ts` | Cliente navegador / servidor / service-role. |

### 1.2 Flujo paso a paso (happy path)

```
1. El usuario abre la app (ej. https://construsmart-wm.vercel.app/).
2. Middleware (proxy.ts) → updateSession():
     - Crea server client con las cookies del request.
     - supabase.auth.getClaims() → obtiene el user (claims del JWT).
     - Si NO hay user → redirige a /login?next=<ruta_original>.
     - Si hay user → deja pasar; refresca cookie si el JWT cambió.
3. Sin sesión → app/login/page.tsx se renderiza (ruta pública).
4. El usuario escribe email/password y envía el <form>.
5. LoginForm.handleSubmit → auth-context.signIn(email, password):
     - supabase.auth.signInWithPassword({email, password}).
     - Si OK, hace POST /api/auth/session con access_token + refresh_token.
     - /api/auth/session → createServerClient → supabase.auth.setSession → escribe la
       cookie de sesión en el servidor (httpOnly).
     - auth-context actualiza estado: setUser, setIsAuthenticated(true).
6. useEffect de LoginForm detecta isAuthenticated → navega a '/' (window.location.href).
   En paralelo AuthGuard (ruta pública + admin) ejecuta router.replace('/').
7. La página '/' carga el Dashboard principal (app/page.tsx) con sus 13 tabs.
8. AuthProvider vuelve a confirmar sesión (getSession) y el onAuthStateChange mantiene
   el estado sincronizado con Supabase Auth.
9. El Dashboard monta SyncProvider (push+pull inicial) y RealtimeProvider (suscribe
   a las tablas del tab activo) → datos locales (Dexie) + remotos (Supabase).
```

### 1.3 Flujo de cierre de sesión

```
1. DashboardNav.handleSignOut → auth-context.signOut() → supabase.auth.signOut().
2. Estado local se limpia (user=null, isAuthenticated=false).
3. router.push('/login').
4. Middleware ya no encuentra user en las cookies → mantiene en /login.
```

### 1.4 Protecciones (defensa en profundidad)

- **Borde (middleware):** corta el acceso sin sesión a todas las rutas excepto login y `/api/auth`.
- **Cliente (AuthGuard):** sin sesión → `/login`; usuario distinto del admin → `/login?error=unauthorized`.
- **Servidor (API admin `database-cleaner`):** verifica sesión real por cookie (`auth.getUser()`), valida el admin email contra la sesión y limita por rate-limit (5 req/min). El service-role **solo** se usa después de ese gate.

---

## 2. ANÁLISIS DE INPUTS (FORMULARIOS Y VALIDACIÓN)

### 2.1 Mapa de formularios principales

| Módulo | Componente | Campos clave | Validación |
|---|---|---|---|
| Login | `app/login/page.tsx` | email, password | `type=email`, `required`, `auth-context` |
| Proyectos | `ProjectManager.tsx` | code, name, client_name, location, typology, area_m2, quality_level, status, duration_days, total_budget | `validateSchema` (Zod) |
| Presupuestos | `BudgetCalculator.tsx` | project_id, % indirectos/contingencia/utilidad, items (code, description, unit, quantity, unit_cost) | `budgetSchema`, `renglonSchema`, previews |
| Finanzas | `FinanceManager.tsx` | type, category, amount, date, description | `transactionSchema` |
| Nómina | `PayrollManager.tsx` | employee (name, position, base_salary), payroll_records | `employeeSchema`, `payrollRecordSchema` |
| Almacén | `WarehouseManager.tsx` | item_code, name, unit, unit_cost, current_stock, minimum_threshold | `warehouseSchema` |
| Clientes | `ClientManager.tsx` | code, name, client_type, account_balance, credit_limit | `clientSchema` |
| Proveedores | `SupplierManager.tsx` | code, name, categories, is_preferred | `supplierSchema` |
| Órdenes de compra | `PurchaseOrderManager.tsx` | supplier_id, items, status (incl. pending_approval) | `purchaseOrderSchema` |
| Subcontratos | `SubcontractorManager.tsx` | supplier_id, code, name, contract_value, retention_rate, advance_amount, status | `subcontractorSchema` |
| Bitácora | `ProjectLogManager.tsx` | project_id, log_date, activity_type, is_critical_roadblock | `projectLogSchema` |
| Ajustes | `SettingsManager.tsx` | empresa, paleta, moneda/impuestos | `applySettings` |

### 2.2 Observaciones de inputs

- Todos los módulos usan `validateSchema` (de `lib/validation/schemas.ts`, Zod v4) y muestran errores vía `formatValidationErrors`.
- Los estados `sync_status` se asignan con `resolveSyncStatus({ isNewRecord, isOnline })` → `synced` si online, o `created_offline/updated_offline` si offline. La transición se valida con `validateSyncTransition`.
- **Sincronización de pendientes:** los borrados en línea marcan `queueDelete` → `pendingDeletes` (tombstone) que el motor de sync procesa al volver online.
- **Hallazgo:** en `app/admin/database-cleaner/page.tsx` todavía se usa el diálogo nativo `confirm(...)` para la destrucción de datos, mientras el README declara "reemplazo total de alert() por toasts". Conviene alinearlo con `ConfirmDialog` (ver IN12).


---

## 3. ANÁLISIS DE LECTURA DE DATOS Y SUS RUTAS

### 3.1 Modelo de datos

- **Local (offline-first):** Dexie `offlineDB` (`lib/db/offlineStore.ts`) con 13 tablas + `pendingDeletes`.
- **Remoto:** Supabase PostgreSQL con RLS por `auth.uid()` y Realtime habilitado.
- **Rutas de lectura** (patrón dominante en la suite):

```
Componente (useEffect / load)
   └── offlineDB.<tabla>.toArray()     ← LECTURA LOCAL (Dexie) [fuente principal]
           │
           └── window 'wm-dexie-changed' (useRealtimeRefresh) → recarga la vista
           └── SyncProvider (push/pull 5 min + on-visibility) → actualiza Dexie
           └── RealtimeProvider (supabase.channel) → put/delete local → dispara evento
```

### 3.2 Mapa de lectura por módulo

| Módulo | Tablas que lee (Dexie) | Realtime (tab-activo) |
|---|---|---|
| Dashboard (`DashboardCharts`) | projects, financial_transactions, warehouse_stock, project_logs, budget_items, budgets, purchase_orders, purchase_order_items, payroll_records, payroll_employees, clients, suppliers | projects, financial_transactions, project_logs *(ver IN8)* |
| Proyectos (`ProjectManager`) | projects | projects |
| Presupuestos (`BudgetCalculator`) | projects, clients, budgets, budget_items | projects, budgets, budget_items |
| Finanzas (`FinanceManager`) | financial_transactions, projects (+ **lectura directa a Supabase** al cargar) | financial_transactions, projects |
| Nómina (`PayrollManager`) | payroll_employees, payroll_records (+ **lectura directa a Supabase** al cargar) | payroll_employees, payroll_records |
| Almacén (`WarehouseManager`) | warehouse_stock, projects (+ **lectura directa a Supabase** al cargar) | warehouse_stock, projects |
| Proveedores (`SupplierManager`) | suppliers, purchase_orders | suppliers, purchase_orders |
| OC (`PurchaseOrderManager`) | purchase_orders, purchase_order_items, suppliers, projects | purchase_orders, purchase_order_items, suppliers |
| Subcontratos (`SubcontractorManager`) | subcontractors, suppliers, projects | *(no suscrito — ver IN6/IN7)* |
| Clientes (`ClientManager`) | clients | clients |
| Bitácora (`ProjectLogManager`) | project_logs, projects | project_logs, projects |
| Progreso (`ProgressTracker`) | projects, transactions, budgets, project_logs | projects, project_logs, budgets, budget_items |

### 3.3 Hallazgos de lectura

- La UI lee de Dexie y el motor de sync es la única vía remota, **excepto** en `FinanceManager`, `PayrollManager` y `WarehouseManager`, que además hacen `supabase.from(...).select(...)` al cargar (ver IN9).
- El `DashboardNav` lee `projects`, `budgets`, `warehouseStock` para los *badges*; y `getSyncStats()` para el contador de pendientes.


---

## 4. ANÁLISIS DE RENDERIZADO DE DATOS Y SUS RUTAS

### 4.1 Arquitectura de renderizado

- `app/page.tsx` es el módulo central: estado `activeTab` + query string `?tab=<id>` (dos vías: URL → estado con `syncTabFromUrl` y estado → URL con `router.replace`).
- Cada tab renderiza un componente por **carga dinámica** (`next/dynamic`, `ssr:false`) para evitar SSR de código que depende de IndexedDB/window.
- `renderTabContent()` hace `switch(activeTab)` → componente correspondiente (con `TabSkeleton` durante transiciones).
- El header (`DualBrandHeader`) muestra estado online/offline, contador de pendientes y botón de sync manual.
- La barra lateral (`DashboardNav`) y la barra de tabs superior (`NAVIGATION_TABS`) son **dos fuentes de navegación distintas** que deben estar alineadas.

### 4.2 Mapa de renderizado por tab

| Tab activo | Componente renderizado | Realtime Provider (tablas suscritas) |
|---|---|---|
| dashboard | `DashboardStats` + `DashboardCharts` | projects, financial_transactions, project_logs |
| projects | `ProjectManager` | projects |
| budgets | `BudgetCalculator` | projects, budgets, budget_items |
| progress | `ProgressTracker` | projects, project_logs, budgets, budget_items |
| finances | `FinanceManager` | financial_transactions, projects, budgets, budget_items |
| payroll | `PayrollManager` | payroll_employees, payroll_records |
| warehouse | `WarehouseManager` | warehouse_stock, projects |
| suppliers | `SupplierManager` | suppliers, purchase_orders |
| orders | `PurchaseOrderManager` | purchase_orders, purchase_order_items, suppliers |
| **subcontractors** | `SubcontractorManager` | ❌ **no está mapeado** |
| clients | `ClientManager` | clients |
| logs | `ProjectLogManager` | project_logs, projects |
| settings | `SettingsManager` | (ninguna) |

### 4.3 Hallazgos de renderizado

- El renderizado es correcto y **consistente** entre el switch y las tablas de navegación (ambos usan los mismos `id` de tab), con una excepción: la **barra lateral** no incluye `subcontractors` (ver IN5).
- `RealtimeProvider` tiene una clave `analytics` que no corresponde a ningún tab real (código muerto) y **omite** `subcontractors` (ver IN6/IN7).


---

## 5. INCONSISTENCIAS ENCONTRADAS Y SU CORRECCIÓN

### 🔴 CRÍTICAS / ALTA

#### IN-1 — Divergencia de nombres de variables de entorno de Supabase
- **Dónde:** `lib/supabase/client.ts` y `lib/supabase/server.ts` usan `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `lib/proxy.ts` y `app/api/auth/session/route.ts` usan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `lib/supabase/admin.ts` usa `SUPABASE_SECRET_KEY`.
- **Problema:** si un entorno carga `.env` (que solo define `ANON_KEY`) sin `.env.local`/`.env.production`, el middleware (`lib/proxy.ts`) recibe `undefined` con aserción `!`, rompiendo toda la autenticación.
- **Corrección:** unificar a una sola variable canónica (recomendado `NEXT_PUBLIC_SUPABASE_ANON_KEY`) o mantener un único helper por capa que resuelva el fallback. Validar en Vercel que ambos nombres existan.

#### IN-2 — El parámetro `next` del middleware nunca se consume
- **Dónde:** `lib/proxy.ts` línea ~51 (`url.searchParams.set('next', pathname)`) y `app/login/page.tsx` / `AuthGuard`.
- **Problema:** tras autenticarse, el usuario **siempre** va a `/`; la ruta original a la que intentaba acceder se pierde.
- **Corrección:** en `login/page.tsx` (o `AuthGuard`), leer `searchParams.get('next')`, validar que sea una URL interna (evitar open-redirect) y navegar a ella tras el login; si no existe, ir a `/`.

#### IN-3 — Doble navegación y recarga completa tras el login
- **Dónde:** `app/login/page.tsx` (éxito → `window.location.href`) y `AuthGuard` (`router.replace('/')`).
- **Problema:** dos mecanismos disparan navegación; un full reload es más lento y puede producir parpadeo/flicker del dashboard.
- **Corrección:** dejar una única vía (p. ej. `router.replace('/')` en `AuthGuard` o un `useEffect` con la navegación del router del cliente, sin reload completo).

#### IN-4 — Email de administrador hardcodeado en varios lugares
- **Dónde:** `components/auth/AuthGuard.tsx` y `app/admin/database-cleaner/page.tsx` (`ADMIN_EMAIL = 'salazaroliveros@gmail.com'`); la API `app/api/admin/database-cleaner/route.ts` usa `process.env.ADMIN_EMAIL`.
- **Problema:** el valor está duplicado y en el cliente **no** se lee de entorno; si cambia el admin, hay que tocar código.
- **Corrección:** centralizar en `lib/config/app.config.ts` con fallback a `process.env.NEXT_PUBLIC_ADMIN_EMAIL` y reutilizarlo en AuthGuard, página y API.

### 🟠 MEDIA

#### IN-5 — La barra lateral no incluye el módulo "Subcontratos"
- **Dónde:** `components/dashboard/DashboardNav.tsx` (`NAV_ITEMS_BASE`) frente a `app/page.tsx` (`NAVIGATION_TABS`, sí incluye `subcontractors`).
- **Problema:** el usuario puede abrir Subcontratos desde la barra de tabs superior, pero **no** desde la barra lateral; la navegación es inconsistente.
- **Corrección:** agregar `{ id: 'subcontractors', label: 'Subcontratos', icon: 'Users' }` a `NAV_ITEMS_BASE` (y su icono en el mapa `ICONS`).

#### IN-6 — RealtimeProvider no suscribe `subcontractors`
- **Dónde:** `components/ui/RealtimeProvider.tsx` (`TABLES` y `TAB_BY_TABLES`).
- **Problema:** `SubcontractorManager` llama `useRealtimeRefresh(['subcontractors', 'suppliers'], ...)`, pero el evento `wm-dexie-changed` para `subcontractors` nunca se dispara porque la tabla no está en `TABLES` ni en el mapa por tab → los cambios de otro dispositivo en subcontratos **no** llegan en vivo.
- **Corrección:** añadir `{ remote: 'subcontractors', local: offlineDB.subcontractors }` a `TABLES` y `subcontractors: ['subcontractors', 'suppliers']` a `TAB_BY_TABLES`.

#### IN-7 — Clave muerta `analytics` en RealtimeProvider
- **Dónde:** `components/ui/RealtimeProvider.tsx` (`TAB_BY_TABLES.analytics`).
- **Problema:** no existe ningún tab `analytics` en `NAVIGATION_TABS`; la clave es código muerto y no alimenta nada.
- **Corrección:** eliminar la clave `analytics` (o renombrarla si se incorpora un tab Analytics futuro).

#### IN-8 — El Dashboard no recibe realtime de todas sus tablas
- **Dónde:** `DashboardCharts.tsx` (usa 12 tablas) vs `RealtimeProvider` `tablesForTab('dashboard')` (solo projects, financial_transactions, project_logs).
- **Problema:** los KPIs basados en `budgets`, `budget_items`, `warehouse_stock`, `purchase_orders`, `payroll_*`, `clients`, `suppliers` solo se refrescan con el sync de 5 min, no en vivo.
- **Corrección:** ampliar el mapa del tab `dashboard` en `TAB_BY_TABLES` para incluir las tablas que realmente consume el dashboard.

#### IN-9 — Lecturas directas de Supabase rompen el patrón offline-first
- **Dónde:** `FinanceManager.tsx` (~168), `PayrollManager.tsx` (~223/254), `WarehouseManager.tsx` (~207).
- **Problema:** estos loaders hacen `supabase.from(...).select(...)` directamente al montar, mientras el resto de la suite lee solo de Dexie. Resulta en comportamiento inconsistente sin conexión y duplicidad de fuentes.
- **Corrección:** unificar la carga inicial con `offlineDB` (offline-first) y depender de `SyncProvider` + Realtime para poblar/sincronizar; la escritura directa cuando está online puede conservarse, pero la lectura debe venir de Dexie.


### 🟡 BAJA

#### IN-10 — El contador de pendientes del header omite subcontratos
- **Dónde:** `components/dashboard/DualBrandHeader.tsx` (~70-74) y `DashboardNav.tsx` (~199).
- **Problema:** `getSyncStats()` expone `pendingSubcontractors` pero el header (y la suma en el nav) no lo cuentan.
- **Corrección:** incluir `stats.pendingSubcontractors` en el cálculo total de pendientes.

#### IN-11 — Lectura local sin filtro por `user_id`
- **Dónde:** todos los `offlineDB.<tabla>.toArray()` de los componentes.
- **Problema:** con la arquitectura multi-tenant (RLS por `auth.uid()`), lo correcto es filtrar también en local por `user_id` para evitar exponer filas de otros usuarios si la sesión cambia.
- **Corrección (recomendada):** añadir `.where('user_id').equals(currentUserId)` en las lecturas principales (o un helper central de consulta). Bajo impacto hoy, ya que la app es de un solo admin.

#### IN-12 — Diálogo nativo `confirm()` en el "limpiar BD"
- **Dónde:** `app/admin/database-cleaner/page.tsx` (~58).
- **Problema:** contradice la política declarada del README ("reemplazo total de alert() por toasts") y el uso de `ConfirmDialog` en el resto de la suite.
- **Corrección:** reemplazar el `confirm(...)` por el componente `ConfirmDialog` (ya existente en `components/ui/ConfirmDialog.tsx`).

---

## 6. PRIORIZACIÓN SUGERIDA DE CORRECCIONES

| Prioridad | Ítem | Esfuerzo | Impacto |
|---|---|---|---|
| Alta | IN-1 (env keys) | Bajo | Crítico (auth) |
| Alta | IN-2 (next param) | Bajo | UX/llegada a rutas |
| Alta | IN-4 (admin email centralizado) | Bajo | Seguridad/mantenimiento |
| Alta | IN-6 (realtime subcontractors) | Bajo | Funcional en vivo |
| Media | IN-3 (doble navegación) | Bajo | UX/rendimiento |
| Media | IN-5 (sidebar subcontractors) | Bajo | Consistencia de navegación |
| Media | IN-8 (dashboard realtime) | Medio | Frescura de KPIs |
| Media | IN-9 (lectura directa Supabase) | Medio | Arquitectura offline-first |
| Baja | IN-7 (analytics muerto) | Bajo | Limpieza |
| Baja | IN-10 (contador pendientes) | Bajo | Información |
| Baja | IN-11 (user_id local) | Medio | Multi-tenant |
| Baja | IN-12 (confirm nativo) | Bajo | Consistencia UI |

---

## 7. RESUMEN

- El **flujo de login** es sólido (middleware + client + server session + guard doble), con la excepción de que el parámetro `next` no se respeta (IN-2) y hay una carga/env de credenciales que conviene unificar (IN-1).
- Los **inputs** están bien validados con Zod y siguen la convención `resolveSyncStatus`.
- La **lectura de datos** está bien encaminada hacia el patrón offline-first, con 3 módulos que aún leen de Supabase directamente (IN-9).
- El **renderizado** está alineado con los tabs, salvo por la omisión de `subcontractors` en la barra lateral (IN-5) y la falta de suscripción realtime para esa tabla (IN-6/IN-7).
- Se documentan **12 inconsistencias** con su corrección y prioridad, listas para implementarse de forma incremental sin romper la suite.


---

## 8. ESTADO DE IMPLEMENTACIÓN DE LAS CORRECCIONES

**Fecha de implementación:** 2026-08-05 · **Validación:** `npx tsc --noEmit` ✅ (sin errores)

| Ítem | Estado | Archivos modificados |
|---|---|---|
| IN-1 (env keys) | ✅ Implementado | `lib/proxy.ts`, `app/api/auth/session/route.ts` (fallback ANON_KEY) |
| IN-2 (next param) | ✅ Implementado | `components/auth/AuthGuard.tsx`, `app/login/page.tsx` (navega a la ruta interna original) |
| IN-3 (doble navegación / recarga completa) | ✅ Implementado | `app/login/page.tsx` (remove `window.location.href`, usa `router.replace`) |
| IN-4 (admin email centralizado) | ✅ Implementado | `lib/config/app.config.ts` (`DEFAULT_ADMIN_EMAIL`), `AuthGuard.tsx`, `app/admin/database-cleaner/page.tsx` |
| IN-5 (sidebar sin subcontractors) | ✅ Implementado | `components/dashboard/DashboardNav.tsx` (agrega item + icono) |
| IN-6 (realtime subcontractors) | ✅ Implementado | `components/ui/RealtimeProvider.tsx` (TABLES + TAB_BY_TABLES) |
| IN-7 (clave muerta analytics) | ✅ Implementado | `components/ui/RealtimeProvider.tsx` (eliminada) |
| IN-8 (dashboard realtime completo) | ✅ Implementado | `components/ui/RealtimeProvider.tsx` (mapa dashboard ampliado a 12 tablas) |
| IN-9 (lecturas directas de Supabase) | ✅ Implementado | `FinanceManager.tsx`, `PayrollManager.tsx`, `WarehouseManager.tsx` (backfill solo en arranque en frío) |
| IN-10 (contador pendientes omite subcontratos) | ✅ Implementado | `DualBrandHeader.tsx`, `DashboardNav.tsx` (+ `pendingSubcontractors`) |
| IN-11 (lecturas locales sin filtro user_id) | ✅ Implementado | Nuevo `lib/utils/userScope.ts` + aplicado en 14 componentes |
| IN-12 (confirm nativo) | ✅ Implementado | `app/admin/database-cleaner/page.tsx` (usa `ConfirmDialog`) |

### Detalle IN-11 (scope por usuario)
Se creó `lib/utils/userScope.ts` con `getUserScope()` y `scopeLocalRows()`. El **guard** `!row.user_id || row.user_id === userId` **no oculta** filas legacy (sin `user_id`) ni las de la propia sesión, y sí oculta filas de otros usuarios. Se aplicó en:
`ProjectManager`, `ProjectOverview`, `DashboardStats`, `DashboardCharts` (12 loaders), `BudgetCalculator`, `FinanceManager`, `PayrollManager`, `WarehouseManager`, `ClientManager`, `SupplierManager`, `SubcontractorManager`, `PurchaseOrderManager`, `ProgressTracker`, `ProjectLogManager`.

---

**Resultado:** Las 12 inconsistencias documentadas en la sección 5 quedaron **corregidas e implementadas** y el proyecto compila correctamente.

---

## 9. ESTADO FINAL DE CONSISTENCIA Y DB REMOTA AL 100%

**Fecha de actualización:** 2026-08-06 · **Validación:** `npx tsc --noEmit` ✅ · `npm run build` ✅ · Deploy Vercel ✅

### 9.1 Correcciones de schema local (causa del fallo de `declarative sync`)

| # | Inconsistencia detectada | Corrección aplicada |
|---|---|---|
| S-1 | `shadow_port=54320` chocaba con Docker Desktop (Windows reserva 54320–54329) | Cambiado a **`55432`** en `supabase/config.toml` |
| S-2 | Columna `payroll_records.project_id` inexistente → rompía la migración 20260803000000 | Agregada columna UUID + índice + FK `ON DELETE SET NULL` |
| S-3 | `sync_status` CHECK de `payroll_records` incompleto (solo 3 estados) | Ampliado a los 6 estados (synced/created_offline/updated_offline/syncing/pending/sync_failed) |
| S-4 | Enum `expense_category` sin la categoría de nómina (11 valores) | Agregado `'Gastos Operativos / Nómina de Mano de Obra'` (12 valores) |
| S-5 | Migración `20260901000000` fallaba (asumía TEXT+CHECK, pero `category` es enum) | Reescrita como **idempotente** (maneja enum y TEXT+CHECK) |
| S-6 | DB local desalineada: solo 15/24 migraciones aplicadas | Aplicadas las **9 migraciones faltantes** en orden → **24/24** |

**Migraciones aplicadas una a una (validadas):** `20260110000000`, `20260201000000`, `20260803000000`, `20260803000001`, `20260803000002`, `20260804000000` (RLS por dueño), `20260804010000` (índices), `20260901000000` (fix nómina), `20260902000000` (subcontractors).

### 9.2 Diseño de la RLS por dueño (migración 20260804000000)

La RLS **no requiere `user_id` en cada tabla**. Usa `projects.user_id` como fuente de verdad y valida las demás tablas del tenant a través de su `project_id → projects.user_id` mediante subqueries `EXISTS`:

```sql
-- Ejemplo (financial_transactions):
CREATE POLICY "Owner select financial_transactions" ON financial_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p
         WHERE p.id = financial_transactions.project_id
           AND p.user_id = auth.uid()));
```

Tablas aisladas por dueño (8): `projects`, `budgets`, `budget_items`, `budget_item_breakdowns`, `financial_transactions`, `project_logs`, `purchase_orders`, `payroll_records`.

Catálogos/globales (acceso authenticated-all, por diseño 1-tenant): `warehouse_stock`, `payroll_employees`, `suppliers`, `clients`.

### 9.3 Scripts seguros para DB remota (producción)

Para preparar el remoto y activar la RLS de forma segura se crearon dos scripts **idempotentes y no destructivos**:

| Script | Propósito | Estado |
|---|---|---|
| `supabase/PATCH_REMOTO_nomina_category.sql` | Agrega la categoría de nómina al enum/CHECK de `financial_transactions` (evita que la Nómina falle en producción) | ✅ Aplicado en producción |
| `supabase/PATCH_REMOTO_backfill_user_id.sql` | Rellena `projects.user_id` con el UUID del admin desde `auth.users` (evita que la RLS oculte datos existentes) | ✅ Aplicado en producción |

**Plan de activación RLS en producción (3 pasos, ejecutado manualmente con éxito):**
1. `PATCH_REMOTO_nomina_category.sql` → fix de categoría de nómina.
2. `PATCH_REMOTO_backfill_user_id.sql` → backfill de `projects.user_id`.
3. `supabase/migrations/20260804000000_scope_rls_by_owner.sql` → activación de RLS por dueño.
   - Verificación previa: `SELECT count(*) FROM public.projects WHERE user_id IS NULL;` → **0** (confirmado).

### 9.4 Despliegue en producción

- **URL:** https://construsmart-wm.vercel.app
- **Estado:** Build 21s, Ready in 40s, sin errores.
- **Rutas:** `/`, `/login`, `/admin/database-cleaner`, `/api/auth/session`, `/api/admin/database-cleaner` + Proxy middleware.
- La ruta raíz redirige correctamente a `/login` sin sesión (AuthGuard + middleware).

### 9.5 Estado real vs. remoto (validado vía `supabase migration list`)

| Métrica | Local | Remoto |
|---|---|---|
| Migraciones aplicadas | 24/24 | 24/24 (tras los 3 pasos) |
| Schema `expense_category` | 12 valores | 12 valores (PATCH aplicado) |
| `projects.user_id` | ✅ FK a auth.users | ✅ Backfilleado |
| RLS por dueño | ✅ Activa (M6) | ✅ Activa (paso 3) |
| Enum/CHECK nómina | ✅ | ✅ |

**Conclusión:** la suite quedó **funcionando al 100% en el entorno real**, con la DB local y remota alineadas, la RLS por dueño activa de forma segura (sin dejar datos huérfanos), el módulo de Nómina operativo y la app desplegada en Vercel sin errores.

