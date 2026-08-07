# IMPLEMENTACIONES FASE 1 CONTINÚA - CÓDIGO LISTO PARA APLICAR

**Estado:** 2/5 tareas completadas en FASE 1  
**Completadas:** 
- ✅ Capa Persistencia Unificada (persistenceLayer.ts)
- ✅ Presupuestos → Finanzas integrado (FinanceManager)

**Pendientes:**
- ⏳ PurchaseOrderManager auto-update stock
- ⏳ ProjectManager usar persistenceLayer
- ⏳ WarehouseManager usar persistenceLayer

---

## TAREA 3: PurchaseOrderManager - Auto-Update Stock al Recibir Orden

**Archivo:** `components/warehouse/PurchaseOrderManager.tsx`

**Ubicación:** En el método `handleStatusChange` (busca "const handleStatusChange")

**Código a Agregar/Reemplazar:**

```typescript
// BUSCAR ESTA FUNCIÓN (aproximadamente línea 200-250):
const handleStatusChange = async (orderId: string, newStatus: string) => {
  try {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = {
      ...order,
      status: newStatus as any,
      sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: order.sync_status, isOnline })
    };

    await offlineDB.purchaseOrders.update(orderId, updatedOrder);

    // ✅ AGREGAR ESTE BLOQUE (NUEVO):
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
    // ✅ FIN DEL BLOQUE NUEVO

    showToast('success', `Orden ${order.code} → ${newStatus}`);
    loadPurchaseOrders();
  } catch (error) {
    console.error('Error actualizando status:', error);
    showToast('error', 'Error al actualizar orden de compra');
  }
};
```

---

## TAREA 4: Crear Hook `useSubcontractorBalance`

**Archivo Nuevo:** `hooks/useSubcontractorBalance.ts`

**Contenido Completo:**

```typescript
/**
 * Hook para gestionar automáticamente saldos de subcontratistas
 * Actualiza anticipos, retenciones y saldos de forma consistente
 */

import { offlineDB } from '@/lib/db/offlineStore';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { isOnline } from '@/lib/utils/offlineSync';

export interface SubcontractorBalanceUpdate {
  subcontractorId: string;
  transactionType: 'advance' | 'payment' | 'retention' | 'regular';
  amount: number;
}

export const useSubcontractorBalance = () => {
  /**
   * Actualiza los saldos de un subcontratista
   * - 'advance': Otorga anticipo (suma al saldo)
   * - 'payment': Pago a cuenta (resta del saldo de anticipo)
   * - 'retention': Retención de garantía (suma al saldo retenido)
   * - 'regular': Transacción sin impacto en saldos
   */
  const updateSubcontractorBalance = async (
    subcontractorId: string,
    transactionType: 'advance' | 'payment' | 'retention' | 'regular',
    amount: number
  ): Promise<{ success: boolean; error?: string; newBalances?: any }> => {
    try {
      const subcontractor = await offlineDB.subcontractors.get(subcontractorId);
      if (!subcontractor) {
        return { success: false, error: `Subcontratista ${subcontractorId} no encontrado` };
      }

      const updates: any = {
        updated_at: new Date().toISOString(),
        sync_status: resolveSyncStatus({ 
          isNewRecord: false, 
          previousStatus: subcontractor.sync_status, 
          isOnline: isOnline()
        })
      };

      // Aplicar cambios según tipo de transacción
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
      // 'regular' no modifica saldos

      // Guardar cambios
      await offlineDB.subcontractors.update(subcontractorId, updates);

      const newBalances = {
        ...subcontractor,
        ...updates
      };

      return { success: true, newBalances };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[useSubcontractorBalance] Error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return { updateSubcontractorBalance };
};
```

---

## TAREA 5: Hook `usePayrollAutoTransaction`

**Archivo Nuevo:** `hooks/usePayrollAutoTransaction.ts`

**Contenido Completo:**

```typescript
/**
 * Hook para generar automáticamente transacciones financieras desde nómina
 * Al crear un registro de nómina, genera la tx de gasto correspondiente
 */

import { offlineDB, LocalFinancialTransaction, LocalPayrollRecord } from '@/lib/db/offlineStore';
import { generateId } from '@/lib/utils/generateId';
import { getCurrentUserId } from '@/lib/auth/userId';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { isOnline } from '@/lib/utils/offlineSync';

export const usePayrollAutoTransaction = () => {
  /**
   * Crea automáticamente una transacción financiera cuando se guarda una nómina
   */
  const createPayrollTransaction = async (
    payrollRecord: LocalPayrollRecord,
    employeeName: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    try {
      if (!payrollRecord.net_salary || payrollRecord.net_salary <= 0) {
        return { success: false, error: 'Nómina sin salario neto' };
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const transactionId = generateId();
      const financialTx: any = {
        id: transactionId,
        user_id: userId,
        project_id: payrollRecord.project_id,
        type: 'expense',
        category: 'Gastos Operativos / Nómina de Mano de Obra',
        description: `Nómina: ${employeeName} (${payrollRecord.period_start} a ${payrollRecord.period_end})`,
        quantity: 1,
        unit: 'lote',
        unit_cost: payrollRecord.net_salary,
        total_cost: payrollRecord.net_salary,
        date: payrollRecord.period_end,
        sync_status: isOnline() ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await offlineDB.financialTransactions.add(financialTx);

      return { success: true, transactionId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[usePayrollAutoTransaction] Error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return { createPayrollTransaction };
};
```

---

## MODIFICACIÓN: PayrollManager - Integrar Auto-Transacciones

**Archivo:** `components/payroll/PayrollManager.tsx`

**Ubicación:** En `handleSavePayrollRecord()` (búscalo alrededor de línea 400-450)

**Agregar estas líneas al inicio del archivo (en imports):**

```typescript
import { usePayrollAutoTransaction } from '@/lib/hooks/usePayrollAutoTransaction';
```

**Dentro del componente, agregar este hook:**

```typescript
const { createPayrollTransaction } = usePayrollAutoTransaction();
```

**En el método `handleSavePayrollRecord`, después de guardar el payroll, agregar:**

```typescript
// ✅ NUEVO: Crear transacción financiera automáticamente
const employee = await offlineDB.payrollEmployees.get(record.employee_id!);
if (employee && record.net_salary && record.net_salary > 0) {
  const txResult = await createPayrollTransaction(record, employee.name);
  
  if (txResult.success) {
    showToast('success', `Nómina registrada y tx financiera creada`);
  } else {
    showToast('warning', `Nómina guardada pero tx financiera falló: ${txResult.error}`);
  }
} else {
  showToast('success', `Nómina registrada`);
}
```

---

## MODIFICACIÓN: FinanceManager - Integrar Subcontratistas

**Archivo:** `components/finances/FinanceManager.tsx`

**Ubicación:** En `handleSubmit()` después de guardar la transacción

**Agregar en imports:**

```typescript
import { useSubcontractorBalance } from '@/lib/hooks/useSubcontractorBalance';
```

**En el componente, agregar hook:**

```typescript
const { updateSubcontractorBalance } = useSubcontractorBalance();
```

**En `handleSubmit()`, después de guardar transacción, agregar:**

```typescript
// ✅ NUEVO: Si es relacionada con subcontratista, actualizar saldo
if (formData.related_subcontractor_id && (formData as any).payment_type) {
  const balanceResult = await updateSubcontractorBalance(
    formData.related_subcontractor_id,
    (formData as any).payment_type,
    total_cost
  );

  if (balanceResult.success) {
    showToast('success', 'Transacción guardada y saldo de subcontratista actualizado');
  } else {
    showToast('warning', `Transacción guardada pero saldo no se actualizó: ${balanceResult.error}`);
  }
} else {
  showToast('success', 'Transacción guardada');
}
```

---

## PRÓXIMOS PASOS

1. **Aplicar TAREA 3:** Modificar PurchaseOrderManager - agregar auto-update stock
2. **Crear TAREA 4:** Crear hook useSubcontractorBalance (archivo nuevo)
3. **Crear TAREA 5:** Crear hook usePayrollAutoTransaction (archivo nuevo)
4. **Aplicar TAREA 5:** Modificar PayrollManager - integrar auto-tx
5. **Aplicar modificación:** FinanceManager - integrar subcontratistas
6. **Testing:** Verificar sincronización Dexie ↔ Supabase

---

Este documento contiene TODO el código necesario para las tareas restantes de FASE 1.
Cada bloque está listo para copiar/pegar directamente en los archivos especificados.

