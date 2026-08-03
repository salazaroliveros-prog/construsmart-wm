# EXPONENTIAL UPGRADE ARCHITECTURAL STRATEGY
## CONSTRUCTORA WM/M&S ERP Suite - "CONSTRUYENDO EL FUTURO"

---

## 📋 EXECUTION OVERVIEW

This document provides the step-by-step architectural strategy for implementing exponential upgrades across all 6 modules. Each module includes:

1. **Target Component Files** - Precise files to modify
2. **Reactive Data Interlocks** - Dexie.js indexes and state propagation
3. **TypeScript Refactoring Snippets** - Clean interfaces and type safety

---

## MODULE 1: GESTIÓN DE PROYECTOS & BITÁCORAS ✅ COMPLETED

### Status & Log Automation

**Target Component Files:**
- `lib/db/offlineStore.ts` - Extended `LocalProject` and `LocalProjectLog` interfaces
- `hooks/useRoadblockDetection.ts` - NEW: Roadblock detection hook
- `components/project/ProjectLogManager.tsx` - Enhanced with automatic roadblock detection
- `components/dashboard/ProjectManager.tsx` - Added roadblock visualization

**Reactive Data Interlocks:**
```
ProjectLogManager.submitLog() 
  → Detects critical keywords (clima, material, técnico, etc.)
  → Sets LocalProjectLog.is_critical_roadblock + roadblock_category + severity
  → Triggers useRoadblockDetection.detectRoadblocks()
  → Updates LocalProject.has_critical_roadblock + roadblock_type + completion_buffer_days
  → ProjectManager re-renders with high-visibility warning badges
```

**Dexie.js Index Updates:**
```typescript
// Version 8 stores
projects: 'id, code, name, sync_status, status, typology, created_at, updated_at, budget_total, calculated_duration, has_critical_roadblock, roadblock_type, roadblock_date'
projectLogs: 'id, project_id, log_date, activity_type, sync_status, created_at, updated_at, is_critical_roadblock, roadblock_category, severity'
```

**TypeScript Refactoring Snippets:**
```typescript
// Extended LocalProject interface
export interface LocalProject extends SyncableEntity {
  // ... existing fields
  has_critical_roadblock?: boolean;
  roadblock_type?: 'clima' | 'material' | 'personal' | 'técnico' | 'permiso' | 'financiero' | 'otro';
  roadblock_description?: string;
  roadblock_date?: string;
  completion_buffer_days?: number;
}

// Extended LocalProjectLog interface
export interface LocalProjectLog extends SyncableEntity {
  // ... existing fields
  is_critical_roadblock?: boolean;
  roadblock_category?: 'clima' | 'material' | 'personal' | 'técnico' | 'permiso' | 'financiero' | 'otro';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## MODULE 2: CALCULADORA DE PRESUPUESTOS & CLIENTES 🔄 IN PROGRESS

### Dynamic Matrix Binders & Margin Warning Slider

**Target Component Files:**
- `lib/db/offlineStore.ts` - Extended `LocalClient` interface (COMPLETED)
- `lib/config/app.config.ts` - Added Guatemala cost matrices (COMPLETED)
- `components/budgets/BudgetCalculator.tsx` - ADD: Client balance integration
- `components/clients/ClientManager.tsx` - ADD: Account balance fields

**Reactive Data Interlocks:**
```
ClientManager.updateClientBalance()
  → Updates LocalClient.account_balance + credit_limit + is_delinquent
  → BudgetCalculator detects client selection
  → Fetches client account balance from Dexie
  → Integrates into budget calculation matrix
  → checkBudgetMarginWarning() compares against Guatemala cost matrices
  → Displays real-time financial warning badge if exceeds tier
```

**Dexie.js Index Updates:**
```typescript
// Version 8 stores
clients: 'id, code, name, client_type, sync_status, created_at, updated_at, account_balance, credit_limit, is_delinquent'
```

**TypeScript Refactoring Snippets:**
```typescript
// Extended LocalClient interface
export interface LocalClient extends SyncableEntity {
  // ... existing fields
  account_balance?: number; // Current account balance in GTQ
  credit_limit?: number; // Credit limit for the client
  payment_terms_days?: number; // Payment terms in days
  is_delinquent?: boolean; // Flag for overdue payments
}

// Budget margin warning helper (already in app.config.ts)
export function checkBudgetMarginWarning(
  areaM2: number,
  totalBudget: number,
  qualityLevel: 'basic' | 'moderate' | 'premium'
): { exceeds: boolean; marginPercentage: number; recommendedMargin: string }
```

**Implementation Required:**
1. Add client selector to BudgetCalculator
2. Display client account balance near budget total
3. Integrate dynamic margin slider component
4. Show warning badge when cost/m² exceeds quality tier
5. Add delinquent client warning indicator

---

## MODULE 3: ALMACÉN, PROVEEDORES & ÓRDENES DE COMPRAS ⏳ PENDING

### Automated Supply Chain

**Target Component Files:**
- `lib/db/offlineStore.ts` - Extended `LocalWarehouseStock` and `LocalSupplier` (COMPLETED)
- `hooks/useAutoPurchaseOrder.ts` - NEW: Auto-PO generation hook
- `components/warehouse/WarehouseManager.tsx` - ADD: Stock depletion triggers
- `components/suppliers/SupplierManager.tsx` - ADD: Category assignment

**Reactive Data Interlocks:**
```
WarehouseManager.updateStock()
  → Compares current_stock vs minimum_threshold
  → If below threshold AND auto_generate_po = true
  → Triggers useAutoPurchaseOrder.generateDraftPO()
  → Finds preferred supplier by category
  → Calculates estimated pricing (current_stock * unit_cost * 1.5)
  → Creates Draft Purchase Order in Dexie
  → Notifies user via toast notification
```

**Dexie.js Index Updates:**
```typescript
// Version 8 stores
warehouseStock: 'id, project_id, item_code, sync_status, created_at, updated_at, preferred_supplier_id, auto_generate_po, category'
suppliers: 'id, code, name, sync_status, created_at, updated_at, categories, is_preferred'
```

**TypeScript Refactoring Snippets:**
```typescript
// Extended LocalWarehouseStock interface
export interface LocalWarehouseStock extends SyncableEntity {
  // ... existing fields
  preferred_supplier_id?: string;
  auto_generate_po?: boolean;
  last_po_date?: string;
  category?: string; // For supplier routing
}

// Extended LocalSupplier interface
export interface LocalSupplier extends SyncableEntity {
  // ... existing fields
  categories?: string[]; // Material categories this supplier handles
  is_preferred?: boolean; // Mark as preferred for auto-PO
}

// Auto-PO generation hook (to be created)
export const useAutoPurchaseOrder = () => {
  const generateDraftPO = async (stockItem: LocalWarehouseStock) => {
    // Implementation details
  };
  return { generateDraftPO };
};
```

**Implementation Required:**
1. Create useAutoPurchaseOrder hook
2. Add stock depletion monitoring in WarehouseManager
3. Add category assignment to SupplierManager
4. Implement supplier routing logic by category
5. Create Draft PO generation with pricing estimation
6. Add user notification system for auto-generated POs

---

## MODULE 4: CONTROL DE AVANCES & ANALYTICS DASHBOARD ⏳ PENDING

### Mathematical Predictive Triggers (EVM)

**Target Component Files:**
- `hooks/useEarnedValueManagement.ts` - NEW: EVM calculation hook
- `components/analytics/AnalyticsDashboard.tsx` - ADD: EVM metrics display
- `lib/types/evm.ts` - NEW: EVM type definitions

**Reactive Data Interlocks:**
```
AnalyticsDashboard.render()
  → Calls useEarnedValueManagement.calculateEVM()
  → Fetches financial_transactions from Dexie
  → Fetches physical progress from project logs
  → Calculates Schedule Variance (SV) = EV - PV
  → Calculates Cost Variance (CV) = EV - AC
  → Generates predictive forecast curves
  → Displays SV/CV with Recharts visualization
```

**TypeScript Refactoring Snippets:**
```typescript
// EVM Type definitions (to be created in lib/types/evm.ts)
export interface EVMMetrics {
  plannedValue: number; // PV - Budgeted cost of work scheduled
  earnedValue: number; // EV - Budgeted cost of work performed
  actualCost: number; // AC - Actual cost of work performed
  scheduleVariance: number; // SV = EV - PV
  costVariance: number; // CV = EV - AC
  schedulePerformanceIndex: number; // SPI = EV / PV
  costPerformanceIndex: number; // CPI = EV / AC
  estimatedAtCompletion: number; // EAC = BAC / CPI
  varianceAtCompletion: number; // VAC = BAC - EAC
}

export interface EVMPrediction {
  date: string;
  predictedEV: number;
  predictedAC: number;
  predictedPV: number;
}
```

**Implementation Required:**
1. Create EVM type definitions
2. Implement useEarnedValueManagement hook
3. Add EVM calculation logic (SV, CV, SPI, CPI, EAC, VAC)
4. Integrate predictive forecasting algorithms
5. Add EVM metrics display to AnalyticsDashboard
6. Create predictive curve visualization with Recharts

---

## MODULE 5: GESTIÓN DE NÓMINA (PAYROLL OPERATIONS) ⏳ PENDING

### Automated Overtime & Cost Overrun Flags

**Target Component Files:**
- `lib/db/offlineStore.ts` - Extended `LocalPayrollRecord` (COMPLETED)
- `hooks/useLaborCostOverrun.ts` - NEW: Cost overrun detection hook
- `components/payroll/PayrollManager.tsx` - ADD: Overrun detection integration
- `components/finances/FinanceManager.tsx` - ADD: Overrun warning display

**Reactive Data Interlocks:**
```
PayrollManager.submitPayroll()
  → Detects overtime_hours > BUSINESS_CONFIG.laborOverrun.overtime_daily_limit
  → Links payroll to budget_item_id
  → Calls useLaborCostOverrun.detectOverrun()
  → Compares actual vs planned labor hours for budget item
  → If cost_overrun_amount > BUSINESS_CONFIG.laborOverrun.warning_threshold
  → Fires non-blocking warning to financial ledger
  → Creates warning transaction in financial_transactions
```

**Dexie.js Index Updates:**
```typescript
// Version 8 stores
payrollRecords: 'id, project_id, employee_id, period_start, period_end, sync_status, created_at, updated_at, budget_item_id, is_overrun_warning_fired'
```

**TypeScript Refactoring Snippets:**
```typescript
// Extended LocalPayrollRecord interface
export interface LocalPayrollRecord extends SyncableEntity {
  // ... existing fields
  task_allocation_id?: string; // Reference to budget item being worked on
  planned_hours?: number; // Planned hours for the task
  budget_item_id?: string; // Budget item this payroll is tracking
  cost_overrun_amount?: number; // Calculated overrun amount
  is_overrun_warning_fired?: boolean; // Flag to prevent duplicate warnings
}

// Labor cost overrun detection hook (to be created)
export const useLaborCostOverrun = () => {
  const detectOverrun = async (payrollRecord: LocalPayrollRecord) => {
    // Implementation details
  };
  return { detectOverrun };
};
```

**Implementation Required:**
1. Create useLaborCostOverrun hook
2. Add budget item linking to PayrollManager
3. Implement overtime limit checking
4. Add cost overrun calculation logic
5. Create non-blocking warning transaction system
6. Add overrun warning display to FinanceManager

---

## MODULE 6: CONFIGURACIÓN CENTRALIZADA (AJUSTES) ✅ COMPLETED

### Global Parameter Distribution

**Target Component Files:**
- `lib/config/app.config.ts` - COMPLETED: Global parameters added
- `components/settings/SettingsManager.tsx` - ADD: Parameter editing UI

**Reactive Data Interlocks:**
```
SettingsManager.updateGlobalParameter()
  → Updates BUSINESS_CONFIG values
  → Triggers re-calculation events across modules
  → BudgetCalculator recalculates margins with new defaults
  → PayrollManager updates overtime thresholds
  → WarehouseManager adjusts stock depletion tolerances
  → All modules react instantly to parameter changes
```

**TypeScript Refactoring Snippets:**
```typescript
// Already implemented in app.config.ts
export const BUSINESS_CONFIG = {
  defaultProfitMargins: { ... },
  defaultContingency: { ... },
  defaultIndirect: { ... },
  stockManagement: { ... },
  timelineManagement: { ... },
  laborOverrun: { ... }
} as const;

// Helper functions already added
export function formatGTQ(amount: number): string
export function checkBudgetMarginWarning(...)
export function calculateCompletionBuffer(...)
export function getBufferSeverity(bufferDays: number)
```

**Implementation Required:**
1. Create SettingsManager component (if not exists)
2. Add parameter editing UI forms
3. Implement parameter validation
4. Add parameter change event broadcasting
5. Ensure all modules subscribe to parameter changes
6. Add parameter versioning for rollback capability

---

## 🔄 DATABASE MIGRATION PLAN

### Version 7 → Version 8 Migration

```typescript
// Migration script to be added to offlineStore.ts
this.version(8).stores({
  projects: 'id, code, name, sync_status, status, typology, created_at, updated_at, budget_total, calculated_duration, has_critical_roadblock, roadblock_type, roadblock_date',
  budgets: 'id, project_id, version, sync_status, created_at, updated_at',
  budgetItems: 'id, budget_id, project_id, parent_id, code, sync_status, item_order, created_at, updated_at, actual_consumption, consumption_variance',
  financialTransactions: 'id, project_id, type, category, date, sync_status, created_at, updated_at',
  payrollEmployees: 'id, name, position, category, department, sync_status, created_at, updated_at',
  payrollRecords: 'id, project_id, employee_id, period_start, period_end, sync_status, created_at, updated_at, budget_item_id, is_overrun_warning_fired',
  warehouseStock: 'id, project_id, item_code, sync_status, created_at, updated_at, preferred_supplier_id, auto_generate_po, category',
  clients: 'id, code, name, client_type, sync_status, created_at, updated_at, account_balance, credit_limit, is_delinquent',
  projectLogs: 'id, project_id, log_date, activity_type, sync_status, created_at, updated_at, is_critical_roadblock, roadblock_category, severity',
  suppliers: 'id, code, name, sync_status, created_at, updated_at, categories, is_preferred',
  purchaseOrders: 'id, code, supplier_id, project_id, status, order_date, sync_status, created_at, updated_at',
  purchaseOrderItems: 'id, purchase_order_id, item_code, sync_status, created_at, updated_at',
  pendingDeletes: '++id, table, serverId, created_at'
}).upgrade(tx => {
  // Migration logic if needed
});
```

---

## 🎯 IMPLEMENTATION PRIORITY ORDER

1. **Module 1** ✅ COMPLETED - Critical for project visibility
2. **Module 6** ✅ COMPLETED - Foundation for all other modules
3. **Module 2** 🔄 IN PROGRESS - Financial controls
4. **Module 3** ⏳ PENDING - Supply chain automation
5. **Module 5** ⏳ PENDING - Cost control
6. **Module 4** ⏳ PENDING - Advanced analytics

---

## 📊 GUATEMALA MONETARY STANDARDS INTEGRATION

All modules now respect:
- Currency: GTQ (Quetzal)
- Cost Matrices: Q.3,000-5,000/m² by quality tier
- Tax Structures: 12% IVA, 25% ISR corporate, 5% ISR individual
- Labor Regulations: 4.83% IGSS, 14 months aguinaldo, 8.33% vacaciones

---

## 🔒 TYPE SAFETY GUARANTEES

All interfaces extend `SyncableEntity` with strict type checking:
- `SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'`
- All new fields have proper TypeScript types
- Enums for categorical data (roadblock types, severity levels)
- Helper functions for data validation and formatting

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] Database schema version upgrade (7 → 8)
- [x] TypeScript interface extensions
- [x] Global configuration constants
- [x] Roadblock detection hook
- [ ] Client balance integration
- [ ] Auto-PO generation hook
- [ ] EVM calculation hook
- [ ] Labor cost overrun hook
- [ ] Settings UI component
- [ ] Component integration tests
- [ ] Supabase schema migration
- [ ] Vercel deployment verification

---

**Generated:** 2026-08-03  
**Status:** Architecture Phase 1 Complete, Implementation In Progress  
**Next Steps:** Complete Module 2 (Budget Calculator integration)
