# PLAN DE CORRECCIÓN - INCONSISTENCIAS COMPLETAS

## ✅ FASE 1: TESTS (COMPLETADO)
- [x] Fix mock path in `tests/project-actions.test.ts`: `../../lib/supabase/server` → `../lib/supabase/server`
- [x] Fix invalid UUID: replace `11111111-1111-1111-1111-111111111111` with valid UUID `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`

## 🔄 FASE 2: INCONSISTENCIAS FUNCIONALES (HIGH)

### 2.1 Duplicate `formatCurrency` implementations
- **Problem**: `formatCurrency` defined in multiple places with different behavior
- **Files**: `DashboardStats.tsx`, `ProjectOverview.tsx`, `WarehouseManager.tsx`, `PayrollManager.tsx`, `FinanceManager.tsx`, `BudgetCalculator.tsx`, `renglonCalculator.ts`, `useBusinessSettings.tsx`
- **Fix**: Standardize on `useBusinessSettings.tsx`'s `formatCurrency` (respects settings) and remove inline versions
- [x] FinanceManager.tsx: importada `formatCurrency` desde hook, eliminada versión inline
- [x] DashboardStats.tsx: importado `{ useFinancialSettings, formatCurrency }` del hook, pasando `financial`
- [x] ProjectOverview.tsx: importado `{ useFinancialSettings, formatCurrency }` del hook, pasando `financial`
- [x] WarehouseManager.tsx: importado `{ useFinancialSettings, formatCurrency }` del hook, pasando `financial`
- [x] PayrollManager.tsx: importado `{ useFinancialSettings, formatCurrency }` del hook, pasando `financial`
- [x] BudgetCalculator.tsx: usa `Intl.NumberFormat` inline (no es función separada, no duplica)
- [x] renglonCalculator.ts: tiene su propia `formatCurrency` pero es utilidad de calculadora, no duplicación de UI

### 2.2 BudgetCalculator → Warehouse duplicate logic
- **Problem**: Both `BudgetCalculator.tsx` (inline) and `lib/integrations/budgetToWarehouse.ts` implement warehouse sync
- **Fix**: Inline code in `BudgetCalculator.tsx` should call `budgetToWarehouse` module instead
- [x] DONE

### 2.3 FinanceManager hardcoded percentages
- **Problem**: Budget comparison uses `60% materials, 30% labor, 10% machinery` defaults
- **Fix**: Use actual APU breakdown data from `budgetItems[].apu_result.breakdown`
- [x] DONE

### 2.4 `crypto.randomUUID()` fallback
- **Problem**: Used in `FinanceManager.tsx` and `project-actions.ts` but may not be available in all environments
- **Fix**: Create a helper function with fallback
- [x] DONE (`lib/utils/generateId.ts`)

### 2.5 BudgetCalculator `RenglonAccordion` per-renglon state
- **Problem**: `onCrewSizeChange`, `onPerformanceChange`, `onEfficiencyChange` modify shared `apuParams` state instead of per-renglon state
- **Fix**: Store per-renglon params in a Map
- [x] DONE (Map `renglonParams` + helpers `updateRenglonParam`/`getRenglonParam`)

## 🔄 FASE 3: UI/UX INCONSISTENCIAS (MEDIUM)

### 3.1 DashboardCharts mock data
- **Problem**: Charts use fake data (multiplying totals by fixed percentages)
- **Fix**: Use actual historical data from Dexie
- [x] DONE (categorías reales por transacción + flujo real por mes)

### 3.2 InteractiveCalendar no real data
- **Problem**: Calendar shows mock events only
- **Fix**: Integrate with `project_logs` and `budget` time data
- [x] DONE (eventos reales desde project_logs + fechas inicio/fin de proyectos)

### 3.3 DashboardNav missing navigation items
- **Problem**: Missing items for `progress`, `suppliers`, `orders` tabs
- **Fix**: Add missing items to `NAV_ITEMS_BASE`
- [x] DONE (agregados progress, suppliers, orders + iconos Truck/ClipboardList/BarChart3)

## 🔄 FASE 4: DATA SCHEMA INCONSISTENCIAS (MEDIUM)

### 4.1 Schema mismatch: budgets.version TEXT vs number
- **Problem**: SQL has `version TEXT`, Dexie has `number`
- **Fix**: Add migration to fix SQL type, or align Dexie type
- [x] DONE (20250131000004: `ALTER COLUMN version TYPE INTEGER`; reforzado en `20260110000000`)

### 4.2 Schema mismatch: budgets field names
- **Problem**: SQL has `base_budget, indirects, contingencies, utility, total_budget` but Dexie has `direct_cost, indirect_percentage, contingency_percentage, profit_percentage, total_amount`
- **Fix**: Add migration to align SQL schema with Dexie schema
- [x] DONE (`20260110000000_align_schema_dexie.sql`: agrega `direct_cost, indirect_percentage, contingency_percentage, profit_percentage, total_amount, duration_days` + backfill de datos heredados)

### 4.3 Schema mismatch: financial_transactions
- **Problem**: SQL uses `amount` (single field), Dexie uses `quantity * unit_cost = total_cost` pattern
- **Fix**: Add migration to add columns
- [x] DONE (`quantity/unit/unit_cost` ya existían; `20260110000000` agrega `total_cost` + backfill desde `amount` o `quantity*unit_cost`)

### 4.4 Schema mismatch: warehouse_stock UNIQUE constraint
- **Problem**: SQL has `item_code UNIQUE`, Dexie allows same code for different projects
- **Fix**: Change SQL constraint to `(item_code, project_id) UNIQUE`
- [x] DONE (`20260110000000`: remueve UNIQUE global si existe, crea índice UNIQUE `(item_code, project_id)`)

## 🔄 FASE 5: PERFORMANCE (MEDIUM)

### 5.1 No virtualization in large tables
- **Problem**: BudgetCalculator, FinanceManager, PayrollManager, WarehouseManager render all rows
- **Fix**: Implement `@tanstack/react-virtual` for large tables
- [x] FinanceManager.tsx: importado `useIncrementalList`, hook integrado, render usa `visibleTransactions`, botón "Ver más"
- [x] WarehouseManager.tsx: importado `useIncrementalList`, hook integrado, render usa `visibleItems`, botón "Ver más"
- [x] PayrollManager.tsx: `useIncrementalList` integrado para empleados y registros de pago con botones "Ver más"
- [x] BudgetCalculator.tsx: `useIncrementalList` integrado, reemplazado `visibleCount` manual

### 5.2 RealtimeProvider unconditional subscriptions
- **Problem**: Subscribes to 12 tables even if user never visits those modules
- **Fix**: Subscribe lazily based on active tab
- [x] DONE (RealtimeProvider acepta `activeTab`, suscripción perezosa por módulo; movido de layout a page.tsx)

## 🔄 FASE 6: CODE QUALITY (LOW)

### 6.1 BudgetCalculator too large (1211 lines)
- **Problem**: Single component is too large
- **Fix**: Split into smaller components
- [x] Creado `components/budgets/types.ts` con tipo `BudgetItem` compartido
- [x] Creado `components/budgets/BudgetItemsTable.tsx`: renderiza items con RenglonAccordion + filas simples + botón "Ver más"
- [x] Creado `components/budgets/BudgetSummaryPanel.tsx`: renderiza sección de resumen (indirectos/contingencia/utilidad + tarjetas)
- [x] Refactorizado `BudgetCalculator.tsx` reducido de ~1200 a ~950 líneas usando subcomponentes

### 6.2 Empty catch blocks
- **Problem**: Some `catch` blocks are empty or only log to console
- **Fix**: Add proper error handling with toast notifications
- [x] PayrollManager.tsx: toasts en loadEmployees, loadPayrollRecords, loadProjects
- [x] FinanceManager.tsx: toasts en loadTransactions, loadProjects, loadBudgetForProject
- [x] WarehouseManager.tsx: toasts en loadStockItems, loadProjects
- [x] BudgetCalculator.tsx: toasts en loadProjects, handleProjectChange, confirmDelete, saveBudget
- [x] SupplierManager.tsx: toasts en loadSuppliers, loadProjects, handleSaveSupplier, handleDeleteSupplier
- [x] PurchaseOrderManager.tsx: toasts en loadData, handleSubmit, handleAddItem, handleDelete

### 6.3 `useCompanySettings` hook duplication
- **Problem**: `useCompanySettings` calls `useBusinessSettings()` creating new hook instances
- **Fix**: Make `useBusinessSettings` a singleton pattern
- [x] DONE (módulo-singleton con SETTINGS_CACHE + listeners; todos los hooks comparten una fuente de verdad)
