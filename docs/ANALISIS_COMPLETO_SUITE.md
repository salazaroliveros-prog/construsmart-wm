# ANÁLISIS COMPLETO DE LA SUITE — CONSTRUCTORA WM/M&S ERP
**Versión 1.0.0** | **Next.js 16.2.12 + React 19.2.8 + Supabase + Dexie (IndexedDB)**

---

## 1. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Next.js 16)                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │   Capa de Presentación (Componentes React)           │ │
│  │   Dashboard | Proyectos | Presupuestos | Finanzas   │ │
│  │   Nómina | Almacén | Proveedores | Órdenes Compra   │ │
│  │   Analytics | Clientes | Bitácora | Ajustes         │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │   Capa de Estado y Lógica                           │ │
│  │   AuthContext | UISettings | BudgetState            │ │
│  │   APU Calculators | RenglonCalculator               │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │   Capa de Datos Local (Offline-First)               │ │
│  │   Dexie (IndexedDB) — 12 object stores              │ │
│  │   offlineDB.projects, .budgets, .budgetItems,       │ │
│  │   .financialTransactions, .payrollEmployees,         │ │
│  │   .payrollRecords, .warehouseStock, .clients,        │ │
│  │   .projectLogs, .suppliers, .purchaseOrders,         │ │
│  │   .purchaseOrderItems, .pendingDeletes               │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │   Capa de Sincronización                            │ │
│  │   SyncProvider (intervalo 60s + visibilidad +       │ │
│  │   online/offline events)                            │ │
│  │   RealtimeProvider (Postgres Changes — 12 canales)  │ │
│  │   Service Worker (Cache-First production)           │ │
│  └────────────────┬────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────┘
                    │ bidireccional
            ┌───────▼────────┐
            │   Supabase      │
            │   (PostgreSQL)  │
            │   RLS + Realtime│
            └────────────────┘
```

**Patrón**: Offline-First con réplica bidireccional. Toda la data se almacena localmente en IndexedDB (Dexie) y se sincroniza con Supabase cuando hay conexión. Las suscripciones Realtime mantienen actualizados los datos entre dispositivos.

---

## 2. TIPO DE APLICACIÓN

Aplicación **ERP/PMIS de Construcción** (Enterprise Resource Planning + Project Management Information System) con los siguientes módulos funcionales:

| Módulo | Archivo | Función |
|--------|---------|---------|
| Dashboard | `components/dashboard/` | KPIs, gráficos, calendario interactivo, actividad reciente |
| Proyectos | `ProjectManager.tsx` | CRUD de proyectos con tipología, calidad, status |
| Presupuestos | `BudgetCalculator.tsx` | APU, cálculo de costos directos/indirectos, contingencia, utilidad |
| Control de Avance | `ProgressTracker.tsx` | Seguimiento físico-financiero |
| Finanzas | `FinanceManager.tsx` | Ingresos/gastos por proyecto, categorías |
| Nómina | `PayrollManager.tsx` | Empleados, planillas, IGSS, aguinaldo, vacaciones |
| Almacén | `WarehouseManager.tsx` | Inventario, stock mínimo, costos unitarios |
| Proveedores | `SupplierManager.tsx` | Catálogo de proveedores |
| Órdenes Compra | `PurchaseOrderManager.tsx` | OC ligadas a proveedores y proyectos |
| Analytics | `AnalyticsDashboard.tsx` | Métricas y análisis de datos |
| Clientes | `ClientManager.tsx` | CRM básico |
| Bitácora | `ProjectLogManager.tsx` | Registro de avance/incidencias/hitos |
| Ajustes | `SettingsManager.tsx` | Tema, glassmorphism, empresa, finanzas, exportación |

**Framework UI**: Tailwind CSS 3.4 con glassmorphism personalizado, estilo dark-first, animaciones Framer Motion.
**Librerías clave**: `lucide-react` (íconos), `recharts` (gráficos), `jspdf` + `html2canvas` (PDFs).

---

## 3. ESTRUCTURA DE DIRECTORIOS

```
CONTROL_SEGUIMIENTO_APP_VoL_10/
├── app/                           # Next.js App Router
│   ├── login/page.tsx             # Login (auth local)
│   ├── admin/database-cleaner/    # Herramienta admin
│   ├── layout.tsx                 # Layout raíz con providers
│   ├── page.tsx                   # Dashboard principal (13 tabs)
│   └── globals.css                # Estilos globales + glassmorphism
│
├── components/                    # Componentes React
│   ├── analytics/                 # Analytics Dashboard
│   ├── auth/                      # AuthGuard
│   ├── budgets/                   # BudgetCalculator, RenglonAccordion
│   ├── crm/                       # ClientManager
│   ├── csv/                       # CSVGenerator
│   ├── dashboard/                 # DashboardCharts, DashboardNav, etc.
│   ├── finances/                  # FinanceManager
│   ├── payroll/                   # PayrollManager
│   ├── pdf/                       # PDFGenerator
│   ├── progress/                  # ProgressTracker
│   ├── project/                   # ProjectLogManager
│   ├── settings/                  # SettingsManager
│   ├── ui/                        # Componentes base reutilizables
│   └── warehouse/                 # Warehouse, Supplier, PurchaseOrder
│
├── lib/                           # Lógica de negocio
│   ├── auth/auth-context.tsx      # Auth context (localStorage-based)
│   ├── calculators/               # APU, renglón, slab, volumétrico
│   ├── config/app.config.ts       # Configuración global
│   ├── data/                      # Catálogos APU
│   ├── db/offlineStore.ts         # Dexie (IndexedDB schema)
│   ├── hooks/                     # useBusinessSettings, useUISettings, etc.
│   ├── state/budgetState.ts       # Estado de presupuesto activo
│   ├── supabase/client.ts         # Cliente Supabase
│   ├── types/                     # TypeScript interfaces
│   └── utils/offlineSync.ts       # Motor de sincronización bidireccional
│
├── public/                        # Assets estáticos
│   ├── assets/branding/           # Logos corporativos
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   └── VERSION.txt
│
├── supabase/                      # Migraciones SQL
│   ├── migrations/                # 14 migraciones oficiales
│   └── legacy/                    # SQL legacy
│
├── scripts/                       # Scripts de utilería
├── docs/                          # Documentación técnica
└── [config files]                 # next.config, tailwind.config, etc.
```

---

## 4. RUTAS EXTERNAS (BASE DE DATOS)

### 4.1 Base de datos principal: Supabase (PostgreSQL)

**URL**: `https://yibjsruoxjlgdnkgylld.supabase.co`

**Tablas remotas en Supabase** (14 migraciones):

| Tabla | Propósito | Relaciones |
|-------|-----------|------------|
| `projects` | Proyectos de construcción | PK de budgets, transactions, payroll_records, warehouse_stock, project_logs, purchase_orders |
| `budgets` | Presupuestos por proyecto | FK → projects, PK de budget_items |
| `budget_items` | Partidas presupuestarias | FK → budgets, self-ref parent_id |
| `financial_transactions` | Transacciones financieras | FK → projects |
| `payroll_employees` | Empleados | PK de payroll_records |
| `payroll_records` | Planillas/nómina | FK → projects, FK → payroll_employees |
| `warehouse_stock` | Inventario | FK → projects |
| `clients` | Clientes | Tabla independiente |
| `project_logs` | Bitácora | FK → projects |
| `suppliers` | Proveedores | PK de purchase_orders |
| `purchase_orders` | Órdenes de compra | FK → suppliers, FK → projects |
| `purchase_order_items` | Partidas de OC | FK → purchase_orders |

**Seguridad**: RLS policies habilitadas (migraciones 20250201000000, 20240730000006).
**Realtime**: Publicaciones habilitadas para todas las tablas (12 canales).

### 4.2 Base de datos local: IndexedDB (Dexie)

**Nombre BD**: `ConstructoraWM_OfflineDB`
**Versión schema**: 6
**12 object stores** que reflejan exactamente las tablas remotas + 1 tabla `pendingDeletes`.

### 4.3 Mecanismo de sincronización

```
SYNC_FLOW:
  Push (local → Supabase):
    1. SyncProvider detecta online
    2. syncOfflineData() itera 13 steps en orden dependiente
       - Projects → Suppliers → Clients → Employees
       - Budgets → BudgetItems → Transactions → PayrollRecords
       - Warehouse → PurchaseOrders → PurchaseOrderItems → Logs
       - PendingDeletes
    3. Cada fila: INSERT si es created_offline/pending, UPDATE si es updated_offline con server UUID
    4. Remapeo de FK locales → server IDs para mantener consistencia
  
  Pull (Supabase → local):
    - RealtimeProvider: 12 canales Postgres Changes
    - forceFullSync(): refresh completo preservando cambios locales pendientes
    - fetchProjectsForOffline(): pull inicial

  Conflict resolution:
    - Local pending changes NUNCA se sobrescriben por Realtime o Pull
    - Gana lo local cuando sync_status ∈ {created_offline, updated_offline, pending}
```

**Trigger de sincronización**: Al montar la app, cada 60s, al recuperar visibilidad, al reconectarse a internet.

### 4.4 Otras dependencias externas

- **Gravatar API** (`www.gravatar.com/avatar/`) — avatar de usuario
- **UI Avatars API** (`ui-avatars.com/api/`) — fallback de avatar

---

## 5. INTERCONEXIONES ENTRE MÓDULOS

```
                     ┌──────────────┐
                     │   AuthGuard   │
                     │  (envuelve)   │
                     └──────┬───────┘
                            │
              ┌─────────────▼──────────────┐
              │      app/layout.tsx        │
              │  AuthProvider              │
              │  UISettingsProvider        │
              │  ToastProvider              │
              │  SyncProvider              │
              │  RealtimeProvider          │
              │  SW Registration           │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │      app/page.tsx          │
              │  Dashboard (activeTab)     │
              └──────┬──────────┬─────────┘
                     │          │
          ┌──────────▼──┐  ┌───▼────────────┐
          │ DashboardNav│  │ DualBrandHeader │
          │ (sidebar)   │  │ (top bar)      │
          └──────┬──────┘  └────┬───────────┘
                 │              │
    ┌────────────┼──────────────┼──────────────────┐
    │            │              │                    │
    ▼            ▼              ▼                    ▼
┌────────┐ ┌────────┐ ┌───────────┐ ┌────────────────┐
│Project │ │Budget  │ │ Finance   │ │ Warehouse      │
│Manager │ │Calc.   │ │ Manager   │ │ Manager        │
│  ──────┤ │  ──────┤ │  ────────┤ │  ─────────────┤
│offline │ │offline │ │ offlineDB │ │ offlineDB      │
│DB.proj.│ │DB.budg.│ │.financia- │ │ .warehouseStock│
│        │ │.items  │ │ Transact. │ │                │
└────────┘ └────────┘ └───────────┘ └────────────────┘
    │            │           │              │
    └────────────┴───────────┴──────────────┘
                    │
          ┌─────────▼─────────┐
          │   offlineSync.ts  │
          │   SyncProvider     │
          │   RealtimeProvider │
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────┐
          │    Supabase       │
          │  (PostgreSQL)     │
          └───────────────────┘
```

**Flujo de datos típico (crear proyecto)**:
1. Usuario llena formulario en `ProjectManager.tsx`
2. Se guarda a `offlineDB.projects.put({..., sync_status: 'created_offline'})`
3. Se dispara evento `wm-dexie-changed`
4. `DashboardNav.loadBadges()` recalcula contadores
5. En próximo ciclo de sync (o inmediato si online), `syncOfflineData()` lo sube a Supabase
6. RealtimeProvider recibe el cambio y lo propaga a otros dispositivos

**Interconexión presupuestos-almacén**:
- `BudgetCalculator` usa `RenglonCalculator` para calcular desglose de materiales
- `calculateMaterialBreakdown()` produce cantidades que alimentarían `warehouse_stock`
- **NOTA**: Esta conexión no está implementada — el almacén opera independientemente

---

## 6. INTERFAZ UI/UX

### 6.1 Estilo visual
- **Tema**: Dark-first con glassmorphism (paneles semitransparentes con blur)
- **Paleta base**: Slate (fondos), Cyan (primario), Violet (secundario/accento)
- **Gradientes**: Fondo `from-slate-900 via-slate-800 to-slate-900`
- **Glass panels**: `bg-white/5 backdrop-blur-xl border border-white/10`
- **Tipografía**: Inter (Google Fonts) con pesos light/regular/bold
- **Iconografía**: Lucide React (consistente, clean)

### 6.2 Diseño responsive
- **Mobile (< 768px)**: Menú hamburguesa (bottom-right), sidebar oculto, tabs navegables horizontalmente con scroll, contenido full-width
- **Tablet (768-1024px)**: Sidebar icon-only, header con logos, grid 2 columnas en dashboard
- **Desktop (> 1024px)**: Sidebar lateral (icon-only siempre), header fijo, grid completo

### 6.3 Componentes UI base
- `ActionButton` — Botón con loading state y variantes
- `AnimatedIcon` — Icono animado (Framer Motion)
- `ConfirmDialog` — Confirmación de acciones destructivas
- `EmptyState` — Estado vacío con icono y mensaje
- `Toast` — Notificaciones toast (éxito/error/info)
- `Tooltip` — Tooltips informativos
- `ServiceWorkerRegistration` — Registro de SW
- `SyncProvider` — Contexto de sincronización
- `RealtimeProvider` — Suscripciones Realtime

### 6.4 Accesibilidad (evaluación preliminar)
- Roles ARIA presentes (`role="main"`, `aria-label`, `aria-current`)
- Contraste de color aceptable (modo oscuro con texto blanco/80)
- Soporte `prefers-reduced-motion` no implementado
- Sin pruebas de lectores de pantalla
- Sin skip-to-content links

---

## 7. OPTIMIZACIÓN PARA MÓVILES

### 7.1 PWA (Progressive Web App)
- **Manifest**: `public/manifest.json` con 12 shortcuts
- **Service Worker**: `public/sw.js` con 4 cachés diferentes (static, data, runtime)
- **Offline**: 100% operativo sin conexión gracias a IndexedDB
- **Instalable**: display=standalone, theme_color, icons

### 7.2 Rendimiento
- **Carga diferida**: Todos los módulos pesados con `dynamic(() => import(...), { ssr: false })`
- **Sin SSR en módulos**: BudgetCalculator, FinanceManager, etc. son client-side
- **Virtual scrolling**: No implementado (tablas largas renderizan todo)
- **Imágenes**: Sin optimización de Next.js Image para los logos
- **Animaciones**: Framer Motion en componentes clave (potencialmente pesado en móviles de gama baja)

### 7.3 UX móvil
- Menú hamburguesa flotante (bottom-right, z-40)
- Sidebar con overlay translúcido al abrir
- Scroll horizontal en tabs de navegación
- `useScrollLock` para prevenir scroll de fondo con menú abierto
- Texto y espaciado responsive (`text-xs sm:text-sm`, `px-2 sm:px-4`)
- Sin gestos táctiles (swipe)
- Sin infinite scroll ni paginación

### 7.4 Puntos débiles en móvil
- Tabla de BudgetCalculator: 1211 líneas, renderizado completo sin virtualización
- DashboardCharts: Gráficos Recharts sin adaptación a pantallas pequeñas
- Sin indicador de carga en transiciones de tab
- Los modales no tienen scroll interno controlado
- Sin soporte para landscape orientation

---

## 8. PATRONES Y DECISIONES TÉCNICAS

### 8.1 Autenticación
- **100% local** via localStorage — no hay validación real contra backend
- No hay JWT, sesiones, ni OAuth
- La contraseña se acepta pero no se valida contra nada
- `AuthGuard` es un gate de UI: cualquiera con acceso físico al navegador puede entrar

### 8.2 Manejo de estado
- `useState` en componentes para UI local
- `localStorage` para persistencia de settings y sesión
- `Dexie (IndexedDB)` para datos de negocio
- Sin estado global compartido (no Redux, no Zustand) — cada módulo lee de IndexedDB directamente
- `budgetState` es un singleton con API get/set/clear sobre localStorage

### 8.3 Cálculos
- **100% client-side**: todos los motores de cálculo APU funcionan sin roundtrips al servidor
- `apuCalculator.ts`: funciones puras para fórmula de APU
- `renglonCalculator.ts`: clase `RenglonCalculator` con métodos static
- `slabCalculators.ts` y `volumetricCalculators.ts`: cálculos especializados
- Cobertura de cálculos: materiales (con desperdicio y factor volumétrico), MO (rendimiento y eficiencia), maquinaria, costos directos/indirectos, contingencia, utilidad

---

## 9. INCONSISTENCIAS DETECTADAS

Ver archivo `INCONSISTENCIAS_Y_CORRECCIONES.md` para el listado completo.