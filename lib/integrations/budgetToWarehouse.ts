// ============================================================================
// Puente Presupuestos → Almacén
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Toma los items generados por BudgetCalculator/ApuCalculator y los carga como
// entradas en warehouse_stock (offlineDB/Supabase). Así el almacén refleja
// los materiales del presupuesto activo.
// ============================================================================

import { offlineDB, LocalWarehouseStock, LocalBudget, LocalBudgetItem } from '@/lib/db/offlineStore';
import { isServerId } from '@/lib/utils/offlineSync';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

// Detecta conectividad real del navegador (evita hardcodear isOnline).
const isOnlineNow = (): boolean =>
  typeof navigator !== 'undefined' ? navigator.onLine : true;

export interface MaterialToWarehouseInput {
  projectId?: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
}

export interface SendBudgetToWarehouseResult {
  inserted: number;
  updated: number;
  skipped: number;
}

/**
 * Recibe la lista de materiales de un presupuesto y los upserta en el almacén.
 * Si ya existe un item con el mismo `item_code` para el proyecto, actualiza
 * `minimum_threshold` (no `current_stock`) y `unit_cost`.
 * Si no existe, crea una nueva entrada con `current_stock = 0`.
 */
export async function sendBudgetMaterialsToWarehouse(
  inputs: MaterialToWarehouseInput[],
): Promise<SendBudgetToWarehouseResult> {
  const result: SendBudgetToWarehouseResult = { inserted: 0, updated: 0, skipped: 0 };

  for (const input of inputs) {
    if (!input.itemCode) {
      result.skipped++;
      continue;
    }

    try {
      const existing = await offlineDB.warehouseStock
        .where('item_code')
        .equals(input.itemCode)
        .and((row) => (input.projectId ? row.project_id === input.projectId : true))
        .first();

      if (existing && existing.id) {
        await offlineDB.warehouseStock.update(existing.id, {
          description: input.description,
          unit: input.unit,
          unit_cost: input.unit_cost,
          minimum_threshold: input.quantity,
          sync_status: isServerId(existing.id)
            ? resolveSyncStatus({ isNewRecord: false, previousStatus: existing.sync_status, isOnline: isOnlineNow() })
            : existing.sync_status,
        });
        result.updated++;
      } else {
        const newStock: LocalWarehouseStock = {
          item_code: input.itemCode,
          description: input.description,
          unit: input.unit,
          current_stock: 0,
          minimum_threshold: input.quantity,
          unit_cost: input.unit_cost,
          project_id: input.projectId,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: isOnlineNow() }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await offlineDB.warehouseStock.add(newStock);
        result.inserted++;
      }
    } catch (error) {
      console.error('Error upsertando material en almacén:', error);
      result.skipped++;
    }
  }

  // Notifica al realtime local para refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wm-dexie-changed', { detail: { table: 'warehouse_stock' } }));
  }

  return result;
}

/**
 * Construye la lista de insumos a partir de los items de presupuesto.
 * Solo envía items que tengan un item_code válido (renglones y APU).
 */
export async function buildWarehouseInputsFromBudget(
  budgetId: string,
  projectId?: string,
): Promise<MaterialToWarehouseInput[]> {
  const items: LocalBudgetItem[] = await offlineDB.budgetItems
    .where('budget_id')
    .equals(budgetId)
    .toArray();

  const inputs: MaterialToWarehouseInput[] = [];
  for (const item of items) {
    if (!item.code) continue;
    const apu = item.apu_result;
    // Usar la cantidad real de material calculada por el APU; si el item no es
    // APU (o no la expone), caer en la cantidad del renglón. Evita derivar
    // cantidad a partir de costo/unit_cost (división por cero con `|| 1`).
    const quantity = apu?.totalMaterialQuantity
      ? apu.totalMaterialQuantity
      : item.quantity;
    const unit_cost = item.apu_params?.materialUnitCost ?? item.unit_cost;
    inputs.push({
      projectId,
      itemCode: item.code,
      description: item.description,
      unit: item.unit,
      quantity: quantity > 0 ? quantity : item.quantity,
      unit_cost,
    });
  }
  return inputs;
}

/**
 * Punto de entrada de alto nivel:
 * 1. Obtiene el presupuesto activo (el último) del proyecto
 * 2. Construye la lista de materiales
 * 3. La envía al almacén
 */
export async function syncActiveBudgetToWarehouse(projectId?: string): Promise<SendBudgetToWarehouseResult> {
  let budgets: LocalBudget[] = [];
  const userId = await getUserScope();

  if (projectId) {
    // Validar propiedad del proyecto antes de exponer su presupuesto
    const userProjects = scopeLocalRows(
      await offlineDB.projects.where('id').equals(projectId).toArray(),
      userId
    );
    if (userProjects.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    budgets = scopeLocalRows(
      await offlineDB.budgets.where('project_id').equals(projectId).toArray(),
      userId
    );
  } else {
    budgets = scopeLocalRows(await offlineDB.budgets.toArray(), userId);
  }

  if (budgets.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const budget = budgets.sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
  const inputs = await buildWarehouseInputsFromBudget(budget.id!, projectId);
  return sendBudgetMaterialsToWarehouse(inputs);
}

/**
 * Record material consumption from warehouse back to budget items
 * This closes the loop: warehouse → budget impact tracking
 */
export async function recordMaterialConsumption(
  itemCode: string,
  quantity: number,
  projectId?: string
): Promise<{ updated: number; skipped: number }> {
  const result = { updated: 0, skipped: 0 };

  try {
    // Find related budget items by item code
    const budgetItems = await offlineDB.budgetItems
      .where('code')
      .equals(itemCode)
      .and(item => projectId ? item.project_id === projectId : true)
      .toArray();

    for (const item of budgetItems) {
      if (!item.id) continue;

      const currentConsumption = item.actual_consumption || 0;
      const newConsumption = currentConsumption + quantity;
      const estimatedQuantity = item.unidades_comerciales_estimadas || item.quantity;
      
      const variance = estimatedQuantity - newConsumption;

      await offlineDB.budgetItems.update(item.id, {
        actual_consumption: newConsumption,
        consumption_variance: variance,
        updated_at: new Date().toISOString(),
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: item.sync_status, isOnline: isOnlineNow() }),
      });

      result.updated++;
    }

    // Notify realtime refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wm-dexie-changed', { detail: { table: 'budget_items' } }));
    }
  } catch (error) {
    console.error('Error recording material consumption:', error);
  }

  return result;
}
