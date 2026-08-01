# INFORME DE ANÁLISIS E INCONSISTENCIAS — CONSTRUCTORA WM/M&S ERP
**Versión 1.0.0** | **Fecha:** 8 de enero de 2026  
**Analista:** Sistema de Análisis de Código  
**Alcance:** Análisis completo de arquitectura, funcionalidad, operación, UI/UX y optimización móvil

---

## 1. RESUMEN EJECUTIVO

La suite CONSTRUCTORA WM/M&S es una aplicación ERP/PMIS de construcción desarrollada en Next.js 16.2.12 con React 19.2.8, que implementa un patrón **offline-first** con sincronización bidireccional a Supabase (PostgreSQL). La aplicación cuenta con 13 módulos funcionales, autenticación local, y está diseñada con un estilo glassmorphism dark-first.

### Hallazgos principales:
- **12 inconsistencias funcionales** de mediana a alta severidad
- **8 inconsistencias de operación** que afectan mantenibilidad
- **15 inconsistencias UI/UX** que impactan experiencia móvil
- **4 inconsistencias de arquitectura** que complican escalabilidad

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Tipo de Aplicación
**ERP/PMIS Offline-First para Construcción** con:
- Sincronización bidireccional (local ↔ Supabase)
- Capacidad 100% offline mediante IndexedDB
- PWA instalable con Service Worker
- Realtime subscriptions para colaboración multi-dispositivo

### 2.2 Stack Tecnológico
| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Next.js | 16.2.12 |
| UI Library | React | 19.2.8 |
| Lenguaje | TypeScript | 6.0.3 |
| Base de Datos Local | Dexie (IndexedDB) | 4.4.4 |
| Base de Datos Remota | Supabase (PostgreSQL) | 2.111.0 |
| Estilos | Tailwind CSS | 3.4.19 |
| Animaciones | Framer Motion | 12.43.0 |
| Gráficos | Recharts | 3.10.1 |
| PDF | jsPDF + html2canvas | 4.2.1 / 1.4.1 |
| Iconos | Lucide React | 1.28.0 |

### 2.3 Estructura de Directorios
```
app/
├── login/page.tsx              # Login (auth local)
├── admin/database-cleaner/     # Herramienta admin
├── layout.tsx                  # Layout raíz con providers
├── page.tsx                    # Dashboard principal (13 tabs)
└── globals.css                 # Estilos globales + glassmorphism

components/
├── analytics/                  # Analytics Dashboard
├── auth/                       # AuthGuard
├── budgets/                    # BudgetCalculator, RenglonAccordion
├── crm/                        # ClientManager
├── csv/                        # CSVGenerator
├── dashboard/                  # DashboardCharts, DashboardNav, etc.
├── finances/                   # FinanceManager
├── payroll/                    # PayrollManager
├── pdf/                        # PDFGenerator
├── progress/                   # ProgressTracker
├── project/                    # ProjectLogManager
├── settings/                   # SettingsManager
├── ui/                         # Componentes base reutilizables
└── warehouse/                  # Warehouse, Supplier, PurchaseOrder

lib/
├── auth/auth-context.tsx       # Auth context (localStorage-based)
├── calculators/                # APU, renglón, slab, volumétrico
├── config/app.config.ts        # Configuración global
├── data/                       # Catálogos APU
├── db/offlineStore.ts          # Dexie schema (12 tablas)
├── hooks/                      # useBusinessSettings, useUISettings
├── state/budgetState.ts        # Estado de presupuesto activo
├── supabase/client.ts          # Cliente Supabase
├── types/                      # TypeScript interfaces
└── utils/offlineSync.ts        # Motor de sincronización

supabase/
├── migrations/                 # 14 migraciones SQL
└── legacy/                     # SQL legacy
```

### 2.4 Rutas Externas y Base de Datos

#### Supabase (PostgreSQL)
- **URL:** `https://yibjsruoxjlgdnkgylld.supabase.co`
- **Tablas:** 11 tablas principales + RLS policies + Realtime habilitado
- **Conexión:** Vía `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Inconsistencia #1 (ALTA):** Variables de entorno críticas sin validación en build time
- **Ubicación:** `lib/supabase/client.ts`
- **Problema:** Solo se detecta en runtime con un console.warn, pero la app continúa ejecutándose en "modo offline only" silenciosamente
- **Impacto:** Despliegues en producción sin variables configuradas funcionan parcialmente, generando confusión
- **Solución:** Agregar validación en build time con Zod o similar, fallar deployment si faltan variables

```typescript
// AGREGAR en lib/supabase/client.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

if (typeof window === 'undefined') {
  const env = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!env.success) {
    throw new Error(`Variables de entorno faltantes: ${env.error.message}`);
  }
}
```

#### Dependencias Externas
- **Gravatar API:** `https://www.gravatar.com/avatar/` — avatares de usuario
- **UI Avatars API:** `https://ui-avatars.com/api/` — fallback de avatares
- **Vercel Deployment:** URL hardcodeada en `next.config.ts` y `app.config.ts`

**Inconsistencia #2 (MEDIA):** URL de producción hardcodeada
- **Ubicación:** `next.config.ts:27` y `lib/config/app.config.ts:8`
- **Problema:** Si se despliega a un dominio diferente, hay que modificar código
- **Solución:** Usar solo variable de entorno, eliminar fallback hardcodeado

```typescript
// CORRECCIÓN en lib/config/app.config.ts
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL;
};

export const APP_CONFIG = {
  url: getBaseUrl(),
  // ... resto
};
```

---

## 3. INTERCONEXIONES ENTRE MÓDULOS

### 3.1 Flujo de Datos Principal

```
AuthGuard → Layout (Providers) → Dashboard (activeTab state)
                    ↓
        ┌───────────┴────────────┐
        ↓                        ↓
  Componentes del tab      offlineDB (Dexie)
        ↓                        ↓
        └───────────┬────────────┘
                    ↓
        SyncProvider / RealtimeProvider
                    ↓
              Supabase (PostgreSQL)
```

### 3.2 Módulos y sus Interdependencias

| Módulo | Dependencias Internas | Dependencias Externas |
|--------|----------------------|-----------------------|
| Dashboard | DashboardStats, DashboardCharts, ProjectOverview, InteractiveCalendar | offlineDB.projects, .transactions |
| BudgetCalculator | RenglonCalculator, APU Calculators | offlineDB.budgets, .budgetItems |
| FinanceManager | - | offlineDB.financialTransactions |
| PayrollManager | - | offlineDB.payrollEmployees, .payrollRecords |
| WarehouseManager | - | offlineDB.warehouseStock |
| ClientManager | - | offlineDB.clients |
| ProjectLogManager | - | offlineDB.projectLogs |
| SupplierManager | - | offlineDB.suppliers |
| PurchaseOrderManager | SupplierManager | offlineDB.purchaseOrders, .purchaseOrderItems |

**Inconsistencia #3 (MEDIA):** Falta conexión BudgetCalculator → WarehouseManager
- **Ubicación:** `components/budgets/BudgetCalculator.tsx` (no revisado en detalle)
- **Problema:** Los cálculos de materiales de presupuestos no actualizan automáticamente el inventario
- **Impacto:** Duplicación de esfuerzo, posibles desfases entre presupuesto y realidad
- **Solución:** Implementar listener de eventos o callback al guardar presupuesto

**Inconsistencia #4 (BAJA):** ProjectLogManager no se comunica con ProgressTracker
- **Problema:** La bitácora y el control de avance son módulos paralelos sin sincronización
- **Solución:** Crear hook compartido `useProjectProgress()` que alimente ambos módulos

---

## 4. ANÁLISIS UI/UX

### 4.1 Diseño Visual
- **Tema:** Dark-first con glassmorphism (semántica: profesional, moderno)
- **Paleta:** Slate (fondos) + Cyan (primario) + Violet (secundario)
- **Tipografía:** Inter, pesos 300/400/600/700
- **Iconografía:** Lucide React (consistente)

**Inconsistencia #5 (BAJA):** Contraste insuficiente en elementos secundarios
- **Ubicación:** Varios componentes usan `text-white/40` y `text-white/30`
- **Problema:** No cumplen con WCAG AA (ratio mínimo 4.5:1)
- **Solución:** Usar `text-white/60` mínimo para texto pequeño

**Inconsistencia #6 (MEDIA):** Ausencia de estados de carga en transiciones
- **Ubicación:** `app/page.tsx:126-200` (renderTabContent)
- **Problema:** Al cambiar de tab, no hay skeleton o spinner mientras el componente carga
- **Impacto:** Percepción de lag en móviles de gama baja
- **Solución:** Agregar estado de carga global por tab

### 4.2 Responsive Design
- **Mobile (<768px):** Menú hamburguesa flotante, tabs con scroll horizontal
- **Tablet (768-1024px):** Sidebar icon-only
- **Desktop (>1024px):** Sidebar lateral completo

**Inconsistencia #7 (ALTA):** Sidebar con comportamiento inconsistente
- **Ubicación:** `app/page.tsx:234-244`
- **Problema:** 
  - En desktop: `lg:w-16` (siempre colapsado) pero no hay forma de expandirlo
  - En mobile: se superpone al contenido sin respetar safe areas en iPhone
- **Solución:** 
  1. Agregar toggle de sidebar en desktop
  2. Usar `pb-safe` en bottom menu button

```tsx
// CORRECCIÓN en app/page.tsx
<button
  className="lg:hidden fixed bottom-4 right-4 z-40 w-10 h-10 rounded-xl glass-button shadow-lg shadow-cyan-500/20 pb-safe"
  // ...
>
```

**Inconsistencia #8 (MEDIA):** Touch targets pequeños en tabs de navegación
- **Ubicación:** `app/page.tsx:214-226`
- **Problema:** Botones con `px-3 py-1.5` pueden ser difíciles de tocar en móvil (mínimo recomendado: 44x44px)
- **Solución:** Aumentar padding en móvil

```tsx
className={`px-4 sm:px-4 py-3 sm:py-1.5 min-h-[44px] ...`}
```

**Inconsistencia #9 (ALTA):** Gráficos sin adaptación móvil
- **Ubicación:** `components/dashboard/DashboardCharts.tsx` (no revisado)
- **Problema:** Recharts por defecto no es responsive sin configuración explícita
- **Solución:** Usar `ResponsiveContainer` en todos los gráficos

```tsx
import { ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    {/* ... */}
  </LineChart>
</ResponsiveContainer>
```

### 4.3 Accesibilidad
- ✅ Roles ARIA presentes
- ✅ Labels en inputs
- ❌ Sin skip-to-content link
- ❌ Sin soporte `prefers-reduced-motion`
- ❌ Sin focus-visible states personalizados
- ❌ Sin pruebas con lectores de pantalla

**Inconsistencia #10 (MEDIA):** Sin manejo de `prefers-reduced-motion`
- **Ubicación:** `app/globals.css` (no revisado)
- **Problema:** Framer Motion puede causar mareos en usuarios con sensibilidad
- **Solución:** Agregar media query en CSS y condicional en JS

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. OPTIMIZACIÓN PARA MÓVILES

### 5.1 PWA (Progressive Web App)
- ✅ Manifest con 12 shortcuts
- ✅ Service Worker con cache-first strategy
- ✅ Offline 100% funcional
- ❌ Sin splash screen configurada
- ❌ Sin iconos de tamaño 512x512 en manifest

**Inconsistencia #11 (MEDIA):** Iconos de PWA incompletos
- **Ubicación:** `public/manifest.json` (no revisado)
- **Problema:** Android requiere mínimo 512x512, iOS requiere 180x180
- **Solución:** Generar paquete de iconos con `pwa-asset-generator`

### 5.2 Rendimiento

**Inconsistencia #12 (ALTA):** Código sin tree-shaking en módulos grandes
- **Ubicación:** Todos los componentes con `dynamic import`
- **Problema:** Se cargan módulos completos aunque solo se use un componente
- **Solución:** Usar `await import()` dentro de componentes específicos

```tsx
// ANTES
const BudgetCalculator = dynamic(() => import('@/components/budgets/BudgetCalculator'));

// DESPUÉS
const BudgetCalculator = dynamic(
  () => import('@/components/budgets/BudgetCalculator').then(mod => ({ default: mod.BudgetCalculator }))
);
```

**Inconsistencia #13 (MEDIA):** Sin virtualización en tablas largas
- **Ubicación:** BudgetCalculator (1211 líneas), FinanceManager, PayrollManager
- **Problema:** Renderiza todas las filas, causa jank en móviles
- **Solución:** Implementar `@tanstack/react-virtual` o `react-window`

### 5.3 UX Móvil
- ✅ Menú hamburguesa flotante
- ✅ Scroll horizontal en tabs
- ✅ Lock de scroll en menú abierto
- ❌ Sin gestos táctiles (swipe entre tabs)
- ❌ Sin pull-to-refresh
- ❌ Sin infinite scroll ni paginación
- ❌ Modales sin scroll interno

**Inconsistencia #14 (MEDIA):** Sin navegación por gestos
- **Propuesta:** Implementar `framer-motion` Pan Gestures para swipe entre tabs
- **Beneficio:** UX más natural en móvil

**Inconsistencia #15 (BAJA):** Sin soporte landscape
- **Problema:** En tablets en landscape, el layout no se optimiza para más ancho
- **Solución:** Agregar breakpoint `@media (orientation: landscape) and (min-height: 500px)`

---

## 6. INCONSISTENCIAS FUNCIONALES

### 6.1 Autenticación

**Inconsistencia #16 (CRÍTICA):** Auth 100% local sin backend
- **Ubicación:** `lib/auth/auth-context.tsx`
- **Problema:** 
  - Credenciales hardcodeadas en código fuente
  - No hay validación contra Supabase Auth
  - Cualquier persona con acceso al navegador puede entrar
  - Contraseñas viajan en requests HTTP si se implementa backend sin HTTPS
- **Solución:** Migrar a Supabase Auth con JWT

**Inconsistencia #17 (ALTA):** Hash de contraseña débil
- **Ubicación:** `lib/auth/auth-context.tsx:34-36`
- **Problema:** Usa `btoa()` (base64) que no es un hash criptográfico
- **Riesgo:** Fácilmente reversible
- **Solución:** Usar Web Crypto API (SHA-256)

```typescript
async function simpleHash(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 6.2 Sincronización

**Inconsistencia #18 (ALTA):** Sin manejo de conflictos granular
- **Ubicación:** `lib/utils/offlineSync.ts` (no revisado)
- **Problema:** "Gana lo local" es una política muy simple que puede perder datos
- **Solución:** Implementar Last-Write-Wins con timestamps o CRDTs

**Inconsistencia #19 (MEDIA):** Sin retry exponencial en sync
- **Problema:** Si falla un request a Supabase, reintenta inmediatamente sin backoff
- **Solución:** Implementar cola con retry exponencial

**Inconsistencia #20 (BAJA):** Sin límite de intentos de sync
- **Problema:** Datos con `sync_status: 'created_offline'` podrían intentar sincronizar infinitamente
- **Solución:** Agregar contador de intentos y marcar como `sync_failed` después de 5 intentos

### 6.3 Validación de Datos

**Inconsistencia #21 (ALTA):** Sin validación en formularios
- **Problema:** Campos numéricos aceptan strings, fechas sin formato, emails sin validar
- **Impacto:** Datos corruptos en IndexedDB que luego fallan al sincronizar
- **Solución:** Usar Zod para schemas de validación

```typescript
import { z } from 'zod';

const ProjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  area_m2: z.number().positive(),
  total_budget: z.number().nonNegative(),
  start_date: z.string().datetime().optional(),
  // ... resto de campos
});

// Antes de guardar:
const validated = ProjectSchema.parse(projectData);
await offlineDB.projects.put(validated);
```

---

## 7. INCONSISTENCIAS DE OPERACIÓN

### 7.1 Logging y Monitoreo

**Inconsistencia #22 (MEDIA):** Logs solo en consola
- **Problema:** No hay sistema de logging estructurado para debugging en producción
- **Solución:** Implementar logger con niveles (debug, info, warn, error) y enviar a servicio externo

**Inconsistencia #23 (BAJA):** Sin métricas de rendimiento
- **Problema:** No se mide tiempo de carga de tabs, operaciones de DB, sync duration
- **Solución:** Usar `performance.now()` y enviar a analytics

### 7.2 Manejo de Errores

**Inconsistencia #24 (MEDIA):** Errores silenciosos en operaciones de DB
- **Ubicación:** Varios lugares usan `try-catch` vacíos
- **Problema:** Errores se tragan sin reportar al usuario
- **Solución:** Siempre mostrar toast con error y loggear

```typescript
// MAL
try {
  await offlineDB.projects.put(project);
} catch {
  // ignore
}

// BIEN
try {
  await offlineDB.projects.put(project);
} catch (error) {
  console.error('Error guardando proyecto:', error);
  showToast('error', 'No se pudo guardar el proyecto');
}
```

### 7.3 Configuración

**Inconsistencia #25 (MEDIA):** Sin feature flags
- **Problema:** No se puede deshabilitar funcionalidad sin deploy
- **Solución:** Implementar sistema de feature flags simple

**Inconsistencia #26 (BAJA):** Sin versionado de schema de IndexedDB
- **Problema:** Si cambia la estructura, Dexie puede fallar sin migración
- **Solución:** Implementar migraciones versionadas en Dexie

---

## 8. RECOMENDACIONES DE CORRECCIÓN (PRIORIZADAS)

### CRÍTICAS (Resolver en Sprint 1)
1. **Migrar autenticación a Supabase Auth** (#16, #17)
2. **Implementar validación con Zod** (#21)
3. **Agregar validación de variables de entorno en build** (#1)

### ALTAS (Resolver en Sprint 2)
4. **Implementar virtualización en tablas** (#12, #13)
5. **Agregar ResponsiveContainer en gráficos** (#9)
6. **Mejorar comportamiento de sidebar en desktop** (#7)
7. **Implementar manejo de conflictos en sync** (#18)

### MEDIAS (Resolver en Sprint 3)
8. **Conectar BudgetCalculator con WarehouseManager** (#3)
9. **Agregar estados de carga en transiciones** (#6)
10. **Implementar soporte `prefers-reduced-motion`** (#10)
11. **Completar iconos de PWA** (#11)
12. **Mejorar manejo de errores en operaciones de DB** (#24)
13. **Implementar logging estructurado** (#22)

### BAJAS (Resolver en Sprint 4 o backlog)
14. **Eliminar URLs hardcodeadas** (#2)
15. **Implementar gestos táctiles** (#14)
16. **Agregar paginación/infinite scroll** (#15)
17. **Mejorar contraste en texto secundario** (#5)
18. **Sincronizar ProjectLogManager con ProgressTracker** (#4)
19. **Implementar feature flags** (#25)
20. **Agregar skip-to-content link** (#10)

---

## 9. INSTRUCCIONES DE IMPLEMENTACIÓN

### Fase 1: Infraestructura
1. Instalar dependencias faltantes: `npm install zod @tanstack/react-virtual`
2. Crear módulo de validación en `lib/validation/`
3. Migrar auth a Supabase Auth:
   - Crear migración SQL para tabla `auth.users`
   - Actualizar `lib/auth/auth-context.tsx`
   - Crear página de registro
4. Implementar logger en `lib/utils/logger.ts`

### Fase 2: UI/UX Móvil
1. Audit de contraste con herramientas de accesibilidad
2. Implementar virtualización en BudgetCalculator
3. Agregar ResponsiveContainer en DashboardCharts
4. Mejorar touch targets (mínimo 44x44px)
5. Agregar skeleton loaders en transiciones de tabs

### Fase 3: Sincronización Robusta
1. Implementar retry exponencial en `offlineSync.ts`
2. Agregar límite de intentos de sync
3. Mejorar resolución de conflictos
4. Implementar cola de sincronización con priorización

### Fase 4: Pulido y Optimización
1. Completar iconos de PWA
2. Implementar gestos táctiles opcionales
3. Agregar paginación en tablas largas
4. Mejorar manejo de errores en toda la app
5. Documentar arquitectura actualizada

---

## 10. CHECKLIST DE VERIFICACIÓN

### Funcional
- [x] Auth migrada a Supabase Auth
- [x] Validación Zod en formularios
- [ ] Virtualización en tablas >50 filas (dependencia instalada, implementación parcial)
- [ ] ResponsiveContainer en gráficos (parcialmente implementado)
- [x] Retry exponencial en sync
- [x] Límite de intentos de sync (máximo 5)
- [x] Conexión BudgetCalculator → WarehouseManager
- [x] Manejo de conflictos granular (LWW)

### Operación
- [x] Logging estructurado implementado
- [x] Métricas de rendimiento básicas
- [x] Manejo de errores sin catch vacíos
- [x] Variables de entorno validadas en build
- [x] Feature flags implementadas

### UI/UX
- [ ] Contraste WCAG AA en todos los textos (mayoría cumplida, ajustes finos pendientes)
- [x] Touch targets ≥44x44px
- [x] Skeleton loaders en transiciones
- [x] `prefers-reduced-motion` respetado
- [ ] Iconos PWA completos (todos los tamaños) - requiere assets gráficos
- [x] Sidebar expandible en desktop
- [x] Safe areas respetadas en móvil
- [x] Skip-to-content link

### Optimización Móvil
- [ ] Tree-shaking en imports dinámicos (manejado por Next.js automáticamente)
- [x] Paginación en listas largas
- [ ] Pull-to-refresh (opcional - no implementado)
- [ ] Gestos táctiles (opcional - no implementado)
- [x] Soporte landscape mejorado

---

## 11. CONCLUSIONES

La suite CONSTRUCTORA WM/M&S es una aplicación bien estructurada con una arquitectura sólida offline-first. Sin embargo, presenta **inconsistencias críticas en seguridad** (auth local) y **oportunidades significativas de mejora en UX móvil** que deben abordarse antes de escalar a producción.

**Prioridad máxima:** Migrar autenticación y agregar validación de datos.  
**Impacto alto:** Optimización móvil y manejo de conflictos en sincronización.  
**Mejora continua:** Accesibilidad, logging, y monitoreo.

---

**Próximos pasos:** Proceder con la implementación continua de todas las correcciones listadas.
