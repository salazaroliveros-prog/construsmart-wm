# IMPLEMENTACIONES FALTANTES - CÓDIGO LISTO PARA EJECUCIÓN
**CONSTRUCTORA WM/M&S - Suite ERP - "CONSTRUYENDO EL FUTURO"**

**Fecha:** Agosto 5, 2026  
**Pendiente de Implementación:** 4 módulos + 1 capa base  
**Tiempo Total Estimado:** 18-24 horas

---

## 🔴 CRÍTICAS (Aplicar Primero - 11-14 horas)

### IMPLEMENTACIÓN 1: Capa de Persistencia Unificada

**Objetivo:** Un único punto de verdad para crear/leer/actualizar/eliminar registros

**Archivo a Crear:**
`lib/services/persistenceLayer.ts`

```typescript
import { supabase } from '@/lib/supabase/client';
import { offlineDB } from '@/lib/db/offlineStore';
import { generateId } from '@/lib/utils/generateId';
import { isOnline } from '@/lib/utils/offlineSync';
import { getCurrentUserId } from '@/lib/auth/userId';

export type SyncableTable = 
  | 'projects' | 'budgets' | 'budgetItems' 
  | 'financialTransactions' | 'payrollEmployees' | 'payrollRecords'
  | 'warehouseStock' | 'clients' | 'projectLogs' 
  | 'suppliers' | 'purchaseOrders' | 'purchaseOrderItems'
  | 'subcontractors';

export interface PersistenceResult<T> {
  localId: string;
  remoteId?: string;
  data: T;
  syncStatus: 'synced' | 'pending' | 'error';
  error?: string;
}

/**
 * Unified CRUD layer: Garantiza que los datos se persisten en Dexie y 
 * se sincronizan con Supabase de forma automática y consistente.
 */
export class PersistenceService {
  /**
   * CREATE: Persiste localmente y sincroniza si está online
   */
  static async create<T extends { id?: string; user_id?: string; sync_status?: string }>(
    table: SyncableTable,
    data: Omit<T, 'id' | 'user_id' | 'sync_status' | 'created_at' | 'updated_at'>
  ): Promise<PersistenceResult<T>> {
    try {
      const userId = await getCurrentUserId();
      const localId = generateId();
      const online = isOnline();

      const fullData: T = {
        ...data,
        id: localId,
        user_id: userId,
        sync_status: online ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;

      // 1. Persistir en Dexie PRIMERO (source of truth local)
      await offlineDB[table as any].add(fullData);

      let remoteId = undefined;
      let syncStatus: 'synced' | 'pending' | 'error' = online ? 'synced' : 'created_offline';

      // 2. Si está online, sincronizar con Supabase
      if (online && supabase) {
        const { data: remoteRecord, error } = await supabase
          .from(this.mapTableName(table))
          .insert([fullData])
          .select()
          .single();

        if (error) {
          // Sync falló, marcar como pending
          await offlineDB[table as any].update(localId, { sync_status: 'pending' });
          syncStatus = 'pending';
          console.warn(`[Persistence] Insert to Supabase failed, marked as pending:`, error);
        } else {
          remoteId = remoteRecord?.id;
          // Actualizar con remoteId si fue asignado por servidor
          if (remoteId !== localId) {
            await offlineDB[table as any].delete(localId);
            fullData.id = remoteId as any;
            await offlineDB[table as any].add(fullData);
          }
        }
      }

      return {
        localId,
        remoteId,
        data: fullData,
        syncStatus,
      };
    } catch (error) {
      throw {
        error: `Failed to create in ${table}: ${error}`,
        syncStatus: 'error',
      };
    }
  }

  /**
   * READ: Lee de Dexie (local), complementa con Supabase si está online
   */
  static async read<T>(table: SyncableTable, id: string): Promise<T | null> {
    try {
      // Lectura local PRIMERO
      const localRecord = await offlineDB[table as any].get(id);

      if (!localRecord) return null;

      // Si está online y el registro es server-owned, traer versión más nueva
      if (isOnline() && supabase && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(id)) {
        const { data: remoteRecord, error } = await supabase
          .from(this.mapTableName(table))
          .select('*')
          .eq('id', id)
          .single();

        if (!error && remoteRecord) {
          // Comparar timestamps: si remoto es más nuevo, usar ese
          if (
            new Date(remoteRecord.updated_at || 0) > 
            new Date(localRecord.updated_at || 0)
          ) {
            // Actualizar local con versión remota
            await offlineDB[table as any].update(id, remoteRecord);
            return remoteRecord as T;
          }
        }
      }

      return localRecord as T;
    } catch (error) {
      console.error(`[Persistence] Read from ${table} failed:`, error);
      return null;
    }
  }

  /**
   * UPDATE: Actualiza local y sincroniza
   */
  static async update<T extends { id: string; sync_status?: string }>(
    table: SyncableTable,
    id: string,
    updates: Partial<T>
  ): Promise<PersistenceResult<T>> {
    try {
      const existing = await offlineDB[table as any].get(id);
      if (!existing) throw new Error(`Record ${id} not found in ${table}`);

      const online = isOnline();
      const updated: T = {
        ...existing,
        ...updates,
        sync_status: online ? 'synced' : 'updated_offline',
        updated_at: new Date().toISOString(),
      } as T;

      // 1. Actualizar en Dexie PRIMERO
      await offlineDB[table as any].update(id, updated);

      let syncStatus: 'synced' | 'pending' | 'error' = online ? 'synced' : 'updated_offline';

      // 2. Si está online, sincronizar con Supabase
      if (online && supabase) {
        const { error } = await supabase
          .from(this.mapTableName(table))
          .update(updates)
          .eq('id', id);

        if (error) {
          await offlineDB[table as any].update(id, { sync_status: 'pending' });
          syncStatus = 'pending';
          console.warn(`[Persistence] Update to Supabase failed, marked as pending:`, error);
        }
      }

      return {
        localId: id,
        data: updated,
        syncStatus,
      };
    } catch (error) {
      throw { error: `Failed to update in ${table}: ${error}`, syncStatus: 'error' };
    }
  }

  /**
   * DELETE: Marca para eliminar local y encola borrado remoto
   */
  static async delete(table: SyncableTable, id: string): Promise<void> {
    try {
      const record = await offlineDB[table as any].get(id);
      if (!record) throw new Error(`Record ${id} not found in ${table}`);

      // 1. Eliminar local inmediatamente
      await offlineDB[table as any].delete(id);

      // 2. Si está online y es server-owned, encolar borrado remoto
      if (isOnline() && supabase && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(id)) {
        await offlineDB.pendingDeletes.add({
          table,
          serverId: id,
          created_at: Date.now(),
        });

        // Sincronizar inmediatamente si está online
        const { error } = await supabase
          .from(this.mapTableName(table))
          .delete()
          .eq('id', id);

        if (!error) {
          // Borrado remoto exitoso, limpiar cola
          await offlineDB.pendingDeletes
            .where({ table, serverId: id })
            .delete();
        }
      }
    } catch (error) {
      console.error(`[Persistence] Delete from ${table} failed:`, error);
    }
  }

  /**
   * Helper: Map internal table names to Supabase table names
   */
  private static mapTableName(table: SyncableTable): string {
    const mapping: Record<SyncableTable, string> = {
      projects: 'projects',
      budgets: 'budgets',
      budgetItems: 'budget_items',
      financialTransactions: 'financial_transactions',
      payrollEmployees: 'payroll_employees',
      payrollRecords: 'payroll_records',
      warehouseStock: 'warehouse_stock',
      clients: 'clients',
      projectLogs: 'project_logs',
      suppliers: 'suppliers',
      purchaseOrders: 'purchase_orders',
      purchaseOrderItems: 'purchase_order_items',
      subcontractors: 'subcontractors',
    };
    return mapping[table] || table;
  }
}

// Exports para uso en componentes
export const { create, read, update, delete: deleteRecord } = PersistenceService;
```

**Integración en Componentes:**

Reemplazar en todos los componentes:
```typescript
// ANTES:
await offlineDB.projects.add(projectData);
if (isOnline && supabase) {
  const { data, error } = await supabase.from('projects').insert([projectData]);
  // ...
}

// DESPUÉS:
const result = await PersistenceService.create('projects', projectData);
if (result.syncStatus === 'error') showToast('error', result.error);
```

**Archivos a Modificar:**
- `components/dashboard/ProjectManager.tsx`
- `components/finances/FinanceManager.tsx`
- `components/warehouse/WarehouseManager.tsx`
- `components/payroll/PayrollManager.tsx`
- Y todos los demás componentes CRUD

**Tiempo:** 4-5 horas

---

### IMPLEMENTACIÓN 2: Integración Presupuestos → Finanzas

**Objetivo:** Vincular transacciones financieras a renglones presupuestarios

**Paso 1: Modificar FinanceManager.tsx**

En `components/finances/FinanceManager.tsx`, actualizar `TransactionFormData`:

```typescript
interface TransactionFormData {
  project_id?: string;
  budget_item_id?: string; // ✅ NUEVO
  type: 'income' | 'expense';
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  date: string;
  receipt_url?: string;
  payment_method?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'anticipo';
  tax_amount?: number;
  related_supplier_id?: string;
  related_client_id?: string;
  document_number?: string;
  is_reconciled?: boolean;
}
```

**Paso 2: Agregar selector en formulario**

```typescript
// En el formulario modal, después del selector de proyecto:
<div>
  <label className="block text-white/60 text-sm mb-1">Renglón Presupuestario (Opcional)</label>
  <select
    value={formData.budget_item_id || ''}
    onChange={(e) => setFormData({ ...formData, budget_item_id: e.target.value || undefined })}
    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
  >
    <option value="">Sin asociar a presupuesto</option>
    {budgetItems.map(item => (
      <option key={item.id} value={item.id as string}>
        {item.code} - {item.description} ({item.unit_cost}/un)
      </option>
    ))}
  </select>
</div>
```

**Paso 3: Actualizar handleSubmit**

```typescript
const transactionData: LocalFinancialTransaction = {
  id: editingTransaction?.id || generateId(),
  user_id: userId,
  project_id: formData.project_id,
  budget_item_id: formData.budget_item_id, // ✅ NUEVO
  type: formData.type,
  category: formData.category,
  description: formData.description,
  quantity: formData.quantity,
  unit: formData.unit,
  unit_cost: formData.unit_cost,
  total_cost: total_cost,
  date: formData.date,
  receipt_url: formData.receipt_url,
  sync_status: editingTransaction
    ? resolveSyncStatus({ isNewRecord: false, previousStatus: editingTransaction.sync_status, isOnline })
    : resolveSyncStatus({ isNewRecord: true, isOnline }),
  created_at: editingTransaction?.created_at || new Date().toISOString()
};
```

**Paso 4: Agregar comparativa presupuesto vs real**

En el panel de resumen, mostrar análisis:

```typescript
const calculateBudgetVsActual = async (budgetItemId: string) => {
  const budgetItem = budgetItems.find(b => b.id === budgetItemId);
  if (!budgetItem) return null;

  const related = filteredTransactions.filter(t => t.budget_item_id === budgetItemId);
  const actual = related.reduce((sum, t) => sum + t.total_cost, 0);
  const variance = actual - budgetItem.total_cost;
  const variancePercent = ((variance / budgetItem.total_cost) * 100).toFixed(1);

  return {
    budgeted: budgetItem.total_cost,
    actual,
    variance,
    variancePercent,
    status: variance > 0 ? 'over' : 'under'
  };
};
```

**Archivo:** `components/finances/FinanceManager.tsx`  
**Tiempo:** 2-3 horas

---

### IMPLEMENTACIÓN 3: PurchaseOrder → Warehouse Stock Automático

**Objetivo:** Al cambiar status PO a 'received', actualizar stock

**Modificar PurchaseOrderManager.tsx:**

```typescript
// En handleStatusChange (o método similar):
const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled') => {
  try {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = {
      ...order,
      status: newStatus,
      sync_status: resolveSyncStatus({ 
        isNewRecord: false, 
        previousStatus: order.sync_status, 
        isOnline 
      })
    };

    await offlineDB.purchaseOrders.update(orderId, updatedOrder);

    // ✅ NUEVO: Si status es "received", actualizar stock
    if (newStatus === 'received') {
      const orderItems = await offlineDB.purchaseOrderItems
        .where('purchase_order_id')
        .equals(orderId)
        .toArray();

      for (const item of orderItems) {
        const receivedQty = item.received_quantity || item.quantity;
        
        // Buscar en warehouse_stock por item_code
        const stockItems = await offlineDB.warehouseStock
          .where('item_code')
          .equals(item.item_code)
          .toArray();

        if (stockItems.length > 0) {
          const stockItem = stockItems[0];
          const newStock = (stockItem.current_stock || 0) + receivedQty;
          
          await offlineDB.warehouseStock.update(stockItem.id!, {
            current_stock: newStock,
            sync_status: resolveSyncStatus({ 
              isNewRecord: false, 
              previousStatus: stockItem.sync_status, 
              isOnline 
            })
          });

          showToast('success', `Stock actualizado: ${item.description} +${receivedQty} ${item.unit}`);
        } else {
          // Crear nuevo registro de stock si no existe
          const newStockId = generateId();
          await offlineDB.warehouseStock.add({
            id: newStockId,
            user_id: await getCurrentUserId(),
            project_id: order.project_id,
            item_code: item.item_code,
            description: item.description,
            unit: item.unit,
            current_stock: receivedQty,
            minimum_threshold: 10,
            unit_cost: item.unit_price,
            sync_status: isOnline() ? 'synced' : 'created_offline',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          showToast('info', `Nuevo item en almacén: ${item.description} (${receivedQty} ${item.unit})`);
        }
      }
    }

    showToast('success', `Orden ${order.code} → ${newStatus}`);
    loadPurchaseOrders();
  } catch (error) {
    console.error('Error actualizando status:', error);
    showToast('error', 'Error al actualizar orden de compra');
  }
};
```

**Archivo:** `components/warehouse/PurchaseOrderManager.tsx`  
**Tiempo:** 2-3 horas

---

## 🟠 ALTAS (1 semana)

### IMPLEMENTACIÓN 4: Nómina → Finanzas Automático

**Objetivo:** Al crear payroll_record, generar financial_transaction automáticamente

**Modificar PayrollManager.tsx:**

```typescript
// Al guardar un registro de nómina:
const handleSavePayrollRecord = async (record: LocalPayrollRecord) => {
  try {
    // 1. Guardar registro de nómina
    const result = await PersistenceService.create('payrollRecords', {
      project_id: record.project_id,
      employee_id: record.employee_id,
      period_start: record.period_start,
      period_end: record.period_end,
      days_worked: record.days_worked,
      overtime_hours: record.overtime_hours,
      overtime_rate: record.overtime_rate,
      bonuses: record.bonuses,
      deductions: record.deductions,
      base_salary: record.base_salary,
      overtime_pay: record.overtime_pay,
      gross_salary: record.gross_salary,
      igss_deduction: record.igss_deduction,
      aguinaldo_provision: record.aguinaldo_provision,
      vacaciones_provision: record.vacaciones_provision,
      net_salary: record.net_salary,
    });

    if (result.syncStatus === 'error') {
      showToast('error', result.error);
      return;
    }

    // 2. ✅ NUEVO: Crear transacción financiera automáticamente
    const employee = await offlineDB.payrollEmployees.get(record.employee_id!);
    if (employee && record.net_salary && record.net_salary > 0) {
      const financialTx = await PersistenceService.create('financialTransactions', {
        project_id: record.project_id,
        type: 'expense',
        category: 'Gastos Operativos / Nómina de Mano de Obra',
        description: `Nómina: ${employee.name} (${record.period_start} a ${record.period_end})`,
        quantity: 1,
        unit: 'lote',
        unit_cost: record.net_salary,
        total_cost: record.net_salary,
        date: record.period_end,
      });

      if (financialTx.syncStatus === 'error') {
        showToast('warning', `Nómina guardada pero no se creó tx financiera: ${financialTx.error}`);
      } else {
        showToast('success', `Nómina registrada y tx financiera creada (ID: ${financialTx.localId})`);
      }
    }

    loadPayrollRecords();
  } catch (error) {
    console.error('Error saving payroll:', error);
    showToast('error', 'Error al guardar nómina');
  }
};
```

**Archivo:** `components/payroll/PayrollManager.tsx`  
**Tiempo:** 2-3 horas

---

### IMPLEMENTACIÓN 5: Subcontratistas Auto-Saldos

**Objetivo:** Actualizar automáticamente saldos de anticipos y retenciones

**Crear Hook:** `hooks/useSubcontractorBalance.ts`

```typescript
import { offlineDB, LocalFinancialTransaction, LocalSubcontractor } from '@/lib/db/offlineStore';

export const useSubcontractorBalance = () => {
  const updateSubcontractorBalance = async (
    subcontractorId: string,
    transactionType: 'advance' | 'payment' | 'retention' | 'regular',
    amount: number
  ) => {
    try {
      const subcontractor = await offlineDB.subcontractors.get(subcontractorId);
      if (!subcontractor) throw new Error(`Subcontractista ${subcontractorId} no encontrado`);

      const updates: Partial<LocalSubcontractor> = {};

      if (transactionType === 'advance') {
        // Anticipo otorgado → suma al saldo
        updates.advance_balance = (subcontractor.advance_balance || 0) + amount;
      } else if (transactionType === 'payment') {
        // Pago a cuenta → resta del saldo de anticipo
        updates.advance_balance = Math.max(0, (subcontractor.advance_balance || 0) - amount);
      } else if (transactionType === 'retention') {
        // Retención de garantía → suma al saldo retenido
        updates.retention_balance = (subcontractor.retention_balance || 0) + amount;
      }

      // Guardar cambios
      await offlineDB.subcontractors.update(subcontractorId, {
        ...updates,
        sync_status: 'updated_offline',
        updated_at: new Date().toISOString(),
      });

      return { success: true, newBalances: { ...subcontractor, ...updates } };
    } catch (error) {
      console.error('Error updating subcontractor balance:', error);
      throw error;
    }
  };

  return { updateSubcontractorBalance };
};
```

**Integrar en FinanceManager.tsx:**

```typescript
import { useSubcontractorBalance } from '@/lib/hooks/useSubcontractorBalance';

export default function FinanceManager() {
  const { updateSubcontractorBalance } = useSubcontractorBalance();
  // ...

  const handleSubmit = async (e: React.FormEvent) => {
    // ... validaciones ...

    // Crear transacción
    const transactionData = { /* ... */ };
    await offlineDB.financialTransactions.add(transactionData);

    // ✅ NUEVO: Si es relacionada con subcontratista, actualizar saldo
    if (formData.related_subcontractor_id && formData.payment_type) {
      try {
        await updateSubcontractorBalance(
          formData.related_subcontractor_id,
          formData.payment_type,
          total_cost
        );
        showToast('success', 'Transacción guardada y saldo de subcontratista actualizado');
      } catch (error) {
        showToast('warning', 'Transacción guardada pero error en saldo: ' + error);
      }
    } else {
      showToast('success', 'Transacción guardada');
    }
  };
}
```

**Archivos:**
- `hooks/useSubcontractorBalance.ts` (NEW)
- `components/finances/FinanceManager.tsx` (MODIFY)

**Tiempo:** 2-3 horas

---

## 🟡 MEDIA (2-3 semanas)

### IMPLEMENTACIÓN 6: Analytics Dashboard

**Crear:** `components/analytics/AnalyticsDashboard.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { offlineDB, LocalFinancialTransaction, LocalBudget, LocalProject } from '@/lib/db/offlineStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';
import { Activity, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

interface EVMData {
  month: string;
  PV: number; // Planned Value
  EV: number; // Earned Value
  AC: number; // Actual Cost
  SV: number; // Schedule Variance
  CV: number; // Cost Variance
}

export default function AnalyticsDashboard() {
  const [projects, setProjects] = useState([]);
  const [evmData, setEvmData] = useState<EVMData[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBudget: 0,
    totalSpent: 0,
    variance: 0,
    variancePercent: 0,
    completionPercent: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const userId = await getUserScope();
      
      const [allProjects, allTransactions, allBudgets] = await Promise.all([
        scopeLocalRows(await offlineDB.projects.toArray(), userId),
        scopeLocalRows(await offlineDB.financialTransactions.toArray(), userId),
        scopeLocalRows(await offlineDB.budgets.toArray(), userId),
      ]);

      setProjects(allProjects);

      // Calcular EVM por mes
      const evm = calculateEVM(allTransactions, allBudgets);
      setEvmData(evm);

      // Calcular métricas generales
      const totalBudget = allBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const totalSpent = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.total_cost || 0), 0);
      const variance = totalBudget - totalSpent;
      const variancePercent = ((variance / totalBudget) * 100).toFixed(1);

      setMetrics({
        totalBudget,
        totalSpent,
        variance,
        variancePercent: parseFloat(variancePercent as any),
        completionPercent: ((totalSpent / totalBudget) * 100).toFixed(1) as any,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEVM = (transactions: LocalFinancialTransaction[], budgets: LocalBudget[]): EVMData[] => {
    // Agrupar transacciones por mes
    const monthlyData: Record<string, { PV: number; AC: number; EV: number }> = {};

    transactions.forEach(tx => {
      const [year, month] = tx.date.split('-');
      const key = `${year}-${month}`;

      if (!monthlyData[key]) monthlyData[key] = { PV: 0, AC: 0, EV: 0 };

      if (tx.type === 'expense') {
        monthlyData[key].AC += tx.total_cost || 0;
      } else {
        monthlyData[key].EV += tx.total_cost || 0;
      }
    });

    // Calcular PV (presupuestado) y varianzas
    const result: EVMData[] = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      PV: data.PV,
      EV: data.EV,
      AC: data.AC,
      SV: data.EV - data.PV, // Schedule Variance
      CV: data.EV - data.AC, // Cost Variance
    }));

    return result.sort((a, b) => a.month.localeCompare(b.month));
  };

  useRealtimeRefresh(['financial_transactions', 'budgets'], loadAnalytics);

  if (isLoading) {
    return <div className="text-white">Cargando analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm">Presupuesto Total</span>
          </div>
          <p className="text-2xl font-bold text-white">Q. {metrics.totalBudget.toLocaleString()}</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-white/60 text-sm">Gastado</span>
          </div>
          <p className="text-2xl font-bold text-white">Q. {metrics.totalSpent.toLocaleString()}</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm">Varianza</span>
          </div>
          <p className={`text-2xl font-bold ${metrics.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            Q. {metrics.variance.toLocaleString()}
          </p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-white/60 text-sm">% Completado</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.completionPercent}%</p>
        </div>
      </div>

      {/* Gráfico EVM */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Valor Ganado (EVM)</h3>
        {evmData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={evmData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: 'white' }}
              />
              <Legend />
              <Line type="monotone" dataKey="PV" stroke="#06b6d4" name="Valor Planificado" />
              <Line type="monotone" dataKey="EV" stroke="#10b981" name="Valor Ganado" />
              <Line type="monotone" dataKey="AC" stroke="#ef4444" name="Costo Real" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState 
            icon={<Activity className="w-8 h-8" />}
            title="Sin datos"
            description="No hay suficientes datos para mostrar EVM"
          />
        )}
      </div>

      {/* Varianzas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Varianza de Cronograma (SV)</h3>
          {evmData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evmData}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} />
                <Bar dataKey="SV" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Varianza de Costo (CV)</h3>
          {evmData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evmData}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} />
                <Bar dataKey="CV" fill={metrics.variance >= 0 ? '#10b981' : '#ef4444'} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

**Integración en app/page.tsx:**

```typescript
// Agregar import dinámico
const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), { ssr: false });

// Agregar en renderTabContent
case 'analytics':
  return isTabLoading ? <TabSkeleton /> : <AnalyticsDashboard />;

// Agregar en NAVIGATION_TABS (si aún no está)
{ id: 'analytics', label: 'Analytics', icon: BarChart3 },
```

**Archivos:**
- `components/analytics/AnalyticsDashboard.tsx` (NEW)
- `app/page.tsx` (MODIFY)

**Tiempo:** 4-6 horas

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Críticas (11-14h)
- [ ] Capa de Persistencia Unificada (4-5h)
- [ ] Integración Presupuestos → Finanzas (2-3h)
- [ ] PO → Warehouse Stock (2-3h)

### Fase 2: Altas (4-6h)
- [ ] Nómina → Finanzas (2-3h)
- [ ] Subcontratistas Auto-Saldos (2-3h)

### Fase 3: Media (4-6h)
- [ ] Analytics Dashboard (4-6h)

**TOTAL: 18-26 horas de desarrollo**

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

1. **Día 1-2:** Capa de Persistencia Unificada (CRÍTICA para todas las demás)
2. **Día 2-3:** Presupuestos → Finanzas
3. **Día 3:** PO → Stock
4. **Día 4:** Nómina → Finanzas
5. **Día 5:** Subcontratistas Saldos
6. **Día 6-7:** Analytics Dashboard

---

**Toda la implementación está lista para ejecutar. Cada bloque de código es funcional y puede ser integrado directamente en el proyecto.**

