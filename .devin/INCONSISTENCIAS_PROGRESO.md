# 📋 PROGRESO DE CORRECCIÓN DE INCONSISTENCIAS
## CONSTRUCTORA WM/M&S - CONTROL_SEGUIMIENTO_APP_VoL_10

**Fecha de inicio:** 2025-01-XX
**Total inconsistencias:** 26
**Estado:** EN PROGRESO

---

## ✅ FASE 1: CORRECCIONES DE BASE DE DATOS (CRÍTICO)

### 1. [x] Actualizar docs/DATABASE_SCHEMA.md con tablas faltantes
- [x] Agregar tabla `clients`
- [x] Agregar tabla `suppliers`
- [x] Agregar tabla `purchase_orders`
- [x] Agregar tabla `purchase_order_items`
- [x] Agregar columnas `user_id` a todas las tablas
- [x] Agregar columnas `project_id` donde falten
- [x] Agregar columnas `preferred_supplier_id` a warehouse_stock
- [x] Agregar campos financieros a clients
- [x] Agregar campos calculados a projects (documentados como campos locales)
- [x] Agregar campos de payroll_records (budget_item_id, task_allocation_id, etc.)
- [x] Actualizar SyncStatus para incluir 'syncing', 'pending', 'sync_failed'
- [x] Agregar ENUMs faltantes (order_status, client_type)

### 2. [x] Alinear lib/db/offlineStore.ts con schema Supabase
- [x] Revisar cada interfaz Local*
- [x] Unificar SyncStatus con Supabase
- [x] Verificar que todos tengan user_id
- [x] Verificar campos faltantes (category en budget_items, etc.)
- [x] Actualizar índices Dexie (user_id, category, etc.)

### 3. [x] Actualizar lib/types/database.ts
- [x] Unificar SyncStatus (agregar 'syncing')
- [x] Agregar user_id a ProjectRow
- [x] Agregar user_id a BudgetRow
- [x] Agregar campos calculados a ProjectRow (has_critical_roadblock, etc.)
- [ ] NOTA: Faltan documentar las demás tablas en database.ts (BudgetItemRow, FinancialTransactionRow, etc.) - se puede hacer más adelante ya que offlineStore.ts está alineado

### 4. [ ] Crear lib/utils/syncState.ts normalizador
- Función para normalizar estados entre local y remoto

---

## ✅ FASE 2: CORRECCIONES FUNCIONALES (ALTA)

### 5. [x] Implementar generateId con UUID v4
- [x] lib/utils/generateId.ts ya usa crypto.randomUUID() con fallback
- [x] Función isValidUUID() presente para validación

### 6. [x] Actualizar lib/validation/schemas.ts
- [x] Validación .uuid() es correcta ya que generateId genera UUIDs reales
- [x] No requiere cambios

### 7. [x] Agregar índices Dexie faltantes
- [x] Ya actualizados en offlineStore.ts (user_id, category, etc.)
- [x] Índices específicos agregados para búsquedas frecuentes

### 8. [x] Validar relaciones entre tablas
- [x] Todas las FK están documentadas en DATABASE_SCHEMA.md
- [x] Los filtros por project_id funcionan (ya implementados en componentes)
- [x] Schema completo y alineado

### 9. [ ] Verificar useRealtimeRefresh en todos los componentes
- [ ] Agregar tablas faltantes a cada componente
- [ ] FinanceManager: agregar budgets, budget_items
- [ ] Verificar todos los demás componentes

---

## ✅ FASE 3: CORRECCIONES UI/UX (MEDIA)

### 10. [ ] Crear componentes de botones reutilizables
- [ ] Crear components/ui/PrimaryButton.tsx
- [ ] Crear components/ui/DangerButton.tsx
- [ ] Crear components/ui/SecondaryButton.tsx

### 11. [x] Centralizar paletas de colores
- [x] Crear lib/config/colorPalettes.ts
- [x] Mover categoryColors de FinanceManager (usar paleta centralizada)
- [x] Mover unitColors de WarehouseManager (usar paleta centralizada)
- [x] Mover categoryColors de PayrollManager (usar paleta centralizada)

### 12. [ ] Estandarizar formatos de moneda
- Verificar que todos usen formatCurrency del hook
- Remover usos manuales de Intl.NumberFormat

### 13. [ ] Estandarizar espaciado en tarjetas
- Cambiar todos a p-4 sm:p-6
- Verificar todos los módulos

### 14. [ ] Agregar tooltips faltantes
- WarehouseManager: botones de ajuste de stock
- Verificar otros botones sin tooltip

### 15. [ ] Agregar loading spinners visuales
- BudgetCalculator: mostrar spinner en setSaveLoading
- Aplicar patrón a todos los módulos

---

## ✅ FASE 4: MEJORAS DE ACCESIBILIDAD (BAJA)

### 16. [ ] Estandarizar tipografía en headers
- Cambiar todos a text-xl sm:text-2xl font-bold

### 17. [ ] Agregar etiquetas ARIA
- Verificar todos los botones tengan aria-label
- Verificar elementos interactivos

### 18. [ ] Verificar contraste WCAG AA
- Usar herramienta de contraste
- Ajustar colores si es necesario

### 19. [ ] Mejorar navegación por teclado
- Verificar tab index
- Verificar focus states

---

## 📊 PROGRESO

| Fase | Total | Completadas | Progreso |
|------|-------|-------------|----------|
| Fase 1: Base de Datos | 4 | 0 | 0% |
| Fase 2: Funcionales | 5 | 0 | 0% |
| Fase 3: UI/UX | 6 | 0 | 0% |
| Fase 4: Accesibilidad | 4 | 0 | 0% |
| **TOTAL** | **19** | **0** | **0%** |

---

## 📝 NOTAS

- Última acción: Creación de documento de seguimiento
- Próxima acción: Fase 1.1 - Actualizar docs/DATABASE_SCHEMA.md
- Archivo siendo editado: docs/DATABASE_SCHEMA.md
