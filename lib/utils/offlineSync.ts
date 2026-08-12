/**
 * CONSTRUCTORA WM/M&S - OFFLINE SYNC SYSTEM
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Bidirectional synchronization between Supabase (PostgreSQL) and Dexie (IndexedDB)
 * Full offline-first architecture with conflict resolution (Last-Write-Wins).
 * 
 * Covers: projects, budgets, budget_items, financial_transactions, payroll_employees,
 * payroll_records, warehouse_stock, clients, project_logs, suppliers,
 * purchase_orders, purchase_order_items and subcontractors.
 */

import { Table } from 'dexie';
import { offlineDB, validateSyncTransition, type SyncStatus } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { logger, syncLogger } from './logger';
import { 
  detectConflict, 
  resolveConflict, 
  ConflictData, 
  ConflictResolution,
  emitConflictEvent,
  getDefaultConflictResolution 
} from '@/lib/sync/conflictResolution';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  timestamp: number;
}

export interface SyncStats {
  pendingProjects: number;
  pendingBudgets: number;
  pendingBudgetItems: number;
  pendingTransactions: number;
  pendingPayroll: number;
  pendingWarehouse: number;
  pendingClients: number;
  pendingProjectLogs: number;
  pendingSuppliers: number;
  pendingPurchaseOrders: number;
  pendingPurchaseOrderItems: number;
  pendingSubcontractors: number;
  pendingDeletes: number;
  lastSync: number | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A row is considered "server-owned" (safe to UPDATE) only when it already has a
// real Supabase UUID. Local auto-increment ids (numbers) mean the row was never
// pushed and must be INSERTed even if marked updated_offline.
export function isServerId(id?: string): boolean {
  return typeof id === 'string' && UUID_RE.test(id);
}

// ============ STRICT SYNC STATUS UPDATE ============
export const updateSyncStatus = async (
  tableName: string,
  recordId: string,
  newStatus: SyncStatus
): Promise<void> => {
  const table = offlineDB[tableName as keyof typeof offlineDB] as Table;
  
  const currentRecord = await table.get(recordId);
  if (!currentRecord) {
    throw new Error(`Record ${recordId} not found in ${tableName}`);
  }
  
  const currentStatus = currentRecord.sync_status as SyncStatus;
  
  // Validar transición de estado
  if (!validateSyncTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid sync status transition: ${currentStatus} → ${newStatus}`
    );
  }
  
  // Actualizar con validación
  await table.update(recordId, {
    sync_status: newStatus,
    last_sync_attempt: new Date().toISOString(),
    sync_error: newStatus === 'sync_failed' ? 'Sync failed' : undefined
  });
  
  // Registrar transición para auditoría
  logger.info('[Sync Status Transition]', {
    table: tableName,
    recordId,
    from: currentStatus,
    to: newStatus,
    timestamp: new Date().toISOString()
  });
};

// Statuses that mark a row as pending to be pushed to Supabase.
// Incluye created_offline y updated_offline (asignados por resolveSyncStatus
// cuando el usuario trabaja sin conexión) para que el motor de sync los procese.
//
// CORRECCIÓN: Tras eliminar escritura dual directa a Supabase desde componentes,
// el motor de sync es ahora el único punto de escritura a Supabase.
// Los componentes solo escriben en IndexedDB con estos estados de sync,
// y el motor de sync propaga los cambios a Supabase de forma consistente.
export const PENDING_STATUSES = ['pending', 'syncing', 'sync_failed', 'created_offline', 'updated_offline'];

/**
 * Cascade delete helper that can operate against a provided DB (for tests)
 * or the real `offlineDB` by default.
 */
export async function cascadeLocalDelete(
  remoteTable: string,
  serverId: string,
  db = offlineDB
): Promise<void> {
  const deps: Record<string, (id: string) => Promise<void>> = {
    projects: async (id: string) => {
      const purchaseOrders = await db.purchaseOrders.where('project_id').equals(id).toArray();
      const purchaseOrderIds = purchaseOrders
        .map((po) => po.id)
        .filter((pid): pid is string => typeof pid === 'string');

      const budgets = await db.budgets.where('project_id').equals(id).toArray();
      const budgetIds = budgets.map((b) => b.id).filter((bid): bid is string => typeof bid === 'string');

      // SET NULL en lugar de DELETE para alinear con comportamiento del servidor
      await Promise.all([
        db.financialTransactions.where('project_id').equals(id).modify({ project_id: undefined }),
        db.payrollRecords.where('project_id').equals(id).modify({ project_id: undefined }),
        db.warehouseStock.where('project_id').equals(id).modify({ project_id: undefined }),
        db.projectLogs.where('project_id').equals(id).delete(), // Logs sí se borran (CASCADE en servidor)
        db.purchaseOrders.where('project_id').equals(id).modify({ project_id: undefined }),
        ...purchaseOrderIds.map((poId) => db.purchaseOrderItems.where('purchase_order_id').equals(poId).delete()), // Items de PO se borran (CASCADE en servidor)
        db.budgets.where('project_id').equals(id).delete(), // Budgets se borran (CASCADE en servidor)
        ...budgetIds.map((bid) => db.budgetItems.where('budget_id').equals(bid).delete()), // Items de budget se borran (CASCADE en servidor)
      ]);
    },
    suppliers: async (id: string) => {
      const orders = await db.purchaseOrders.where('supplier_id').equals(id).toArray();
      const orderIds = orders.map((o) => o.id).filter((oid): oid is string => typeof oid === 'string');
      
      // SET NULL en lugar de DELETE para alinear con comportamiento del servidor (RESTRICT en servidor)
      // Nota: Como el servidor tiene RESTRICT, no podemos mantener las POs, así que las borramos localmente
      await Promise.all([
        ...orderIds.map((oid) => db.purchaseOrderItems.where('purchase_order_id').equals(oid).delete()),
        db.purchaseOrders.where('supplier_id').equals(id).delete(),
      ]);
    },
    purchase_orders: async (id: string) => {
      // Items de PO se borran (CASCADE en servidor)
      await db.purchaseOrderItems.where('purchase_order_id').equals(id).delete();
    },
    budgets: async (id: string) => {
      // Items de budget se borran (CASCADE en servidor)
      await db.budgetItems.where('budget_id').equals(id).delete();
    },
    payroll_employees: async (id: string) => {
      // Registros de nómina se borran (CASCADE en servidor)
      await db.payrollRecords.where('employee_id').equals(id).delete();
    },
  };

  const fn = deps[remoteTable];
  if (fn) await fn(serverId);
}

// Sync configuration with retry and limits
const MAX_SYNC_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 16000;

// Performance metrics tracking
interface SyncMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  synced: number;
  failed: number;
  retries: number;
  timestamp: number;
}

const syncMetrics: SyncMetrics[] = [];

export function getSyncMetrics(): SyncMetrics[] {
  return syncMetrics;
}

export function clearSyncMetrics(): void {
  syncMetrics.length = 0;
}

function recordMetric(metric: SyncMetrics): void {
  syncMetrics.push(metric);
  // Keep only last 100 metrics
  if (syncMetrics.length > 100) {
    syncMetrics.shift();
  }
}

// Retry with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = MAX_SYNC_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (lastError.message.includes('401') || lastError.message.includes('403') || 
          lastError.message.includes('404') || lastError.message.includes('422')) {
        throw lastError;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000,
          MAX_RETRY_DELAY_MS
        );
        logger.warn(`Retry ${attempt + 1}/${maxRetries} for ${context} after ${delay}ms`, undefined, 'Sync');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} retries`);
}

const SYNC_START_EVENT = 'wm-sync-start';
const SYNC_END_EVENT = 'wm-sync-end';

function emitSyncStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SYNC_START_EVENT));
  }
}

function emitSyncEnd(ok: boolean, error?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_END_EVENT, { detail: { ok, error } }));
  }
}

// Prevents concurrent sync runs (interval + online event + manual calls).
let syncInProgress = false;
let syncTimeoutId: NodeJS.Timeout | null = null;
const SYNC_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de timeout

// CORRECCIÓN: Implementar timeout automático para evitar deadlocks
// syncOfflineData ya tiene finally { setSyncInProgress(false); } en línea 1158
function setSyncInProgress(value: boolean): void {
  syncInProgress = value;
  
  if (value) {
    // Limpiar timeout anterior si existe
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId);
    }
    
    // Establecer nuevo timeout para limpiar el flag automáticamente
    syncTimeoutId = setTimeout(() => {
      syncLogger.warn('Timeout alcanzado, limpiando syncInProgress flag', {
        syncInProgress,
        syncTimeoutId,
        timestamp: new Date().toISOString()
      });
      setSyncInProgress(false);
      syncTimeoutId = null;
    }, SYNC_TIMEOUT_MS);
  } else {
    // Limpiar timeout al completar sync
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId);
      syncTimeoutId = null;
    }
  }
}

// Remaps a foreign key that was stored as a local id to the server id assigned
// during this sync run. Unknown/local-only ids are kept as-is.
function remap(map: Map<string, string>, id?: string): string | undefined {
  if (!id) return id;
  return map.get(String(id)) ?? id;
}

// After a parent is inserted, point all local children (stored with the old
// local id) at the new server id so the offline database stays consistent.
async function remapProjectFks(localId: string, serverId: string): Promise<void> {
  await Promise.all([
    offlineDB.budgets.where('project_id').equals(localId).modify({ project_id: serverId }),
    offlineDB.financialTransactions.where('project_id').equals(localId).modify({ project_id: serverId }),
    offlineDB.payrollRecords.where('project_id').equals(localId).modify({ project_id: serverId }),
    offlineDB.warehouseStock.where('project_id').equals(localId).modify({ project_id: serverId }),
    offlineDB.projectLogs.where('project_id').equals(localId).modify({ project_id: serverId }),
    offlineDB.purchaseOrders.where('project_id').equals(localId).modify({ project_id: serverId }),
  ]);
}

async function remapBudgetFks(localId: string, serverId: string): Promise<void> {
  await offlineDB.budgetItems
    .where('budget_id')
    .equals(localId)
    .modify({ budget_id: serverId });
}

async function remapEmployeeFks(localId: string, serverId: string): Promise<void> {
  await offlineDB.payrollRecords
    .where('employee_id')
    .equals(localId)
    .modify({ employee_id: serverId });
}

async function remapSupplierFks(localId: string, serverId: string): Promise<void> {
  await offlineDB.purchaseOrders
    .where('supplier_id')
    .equals(localId)
    .modify({ supplier_id: serverId });
}

async function remapOrderFks(localId: string, serverId: string): Promise<void> {
  await offlineDB.purchaseOrderItems
    .where('purchase_order_id')
    .equals(localId)
    .modify({ purchase_order_id: serverId });
}

type Syncable = { id?: string; sync_status?: string; sync_attempts?: number };

// Generic push loop: INSERTs rows that were never pushed (created_offline/pending,
// or updated_offline without a server id) and UPDATEs server-owned rows.
// Returns a map of local id -> server id for the rows it inserted.
// Implements Last-Write-Wins (LWW) conflict resolution based on updated_at timestamps.
// Includes retry logic with exponential backoff and attempt limits.
async function syncRows<T extends Syncable>(
  supabaseTable: string,
  rows: T[],
  describe: (row: T) => string,
  buildInsert: (row: T) => Record<string, unknown>,
  buildUpdate: (row: T) => Record<string, unknown>,
  markInserted: (row: T, localId: string, serverId: string) => Promise<void>,
  markUpdated: (row: T) => Promise<void>,
  result: SyncResult,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();

  for (const row of rows) {
    const localId = String(row.id);
    const rowDescription = `${supabaseTable} ${describe(row)}`;
    
    try {
      const isUpdate = row.sync_status === 'updated_offline' && isServerId(row.id);

      if (isUpdate) {
        // LWW: Fetch server version to compare timestamps with retry
        const serverRow = await withRetry(
          async () => {
            const { data, error } = await supabase!
              .from(supabaseTable)
              .select('updated_at')
              .eq('id', row.id!)
              .single();
            if (error) throw error;
            return data;
          },
          `fetch ${rowDescription}`
        );

        // Conflict detection: server has been modified since last sync
        const localUpdatedAt = (row as any).updated_at;
        const serverUpdatedAt = serverRow?.updated_at;

        if (serverUpdatedAt && localUpdatedAt && new Date(serverUpdatedAt) > new Date(localUpdatedAt)) {
          // Conflict: server is newer
          logger.warn(`Conflict detected in ${rowDescription}: server is newer (${serverUpdatedAt} > ${localUpdatedAt})`, undefined, 'Sync');
          
          // Use new conflict resolution system
          const conflictData: ConflictData = {
            local: row,
            server: serverRow,
            localUpdatedAt,
            serverUpdatedAt,
            table: supabaseTable,
            recordId: row.id!,
          };

          // Emit conflict event for UI handling
          emitConflictEvent(conflictData);

          // For now, use default resolution (server wins) for automated sync
          // In a future enhancement, this could wait for user input
          const resolution = getDefaultConflictResolution(conflictData);
          
          logger.info(`Using conflict resolution: ${resolution} for ${rowDescription}`, undefined, 'Sync');

          const resolutionResult = await resolveConflict(
            conflictData,
            resolution,
            supabase,
            offlineDB
          );

          if (!resolutionResult.success) {
            throw new Error(`Conflict resolution failed: ${resolutionResult.error}`);
          }

          logger.info(`Conflict resolved with ${resolution} for ${rowDescription}`, undefined, 'Sync');
          result.synced++;
          continue;
        }

        // No conflict or local is newer: proceed with update with retry
        await withRetry(
          async () => {
            const { error } = await supabase!
              .from(supabaseTable)
              .update(buildUpdate(row))
              .eq('id', row.id!);
            if (error) throw error;
          },
          `update ${rowDescription}`
        );
        await markUpdated(row);
      } else {
        // Insert with retry
        const { data, error } = await withRetry(
          async () => {
            const result = await supabase!
              .from(supabaseTable)
              .insert(buildInsert(row))
              .select()
              .single();
            if (result.error) throw result.error;
            return result.data;
          },
          `insert ${rowDescription}`
        );
        if (row.id) idMap.set(localId, data.id);
        await markInserted(row, localId, data.id);
      }

      result.synced++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to sync ${rowDescription}: ${error}`);
      
      // Increment sync attempts for offline-created records
      if (row.sync_status === 'created_offline' || row.sync_status === 'pending') {
        const attempts = (row.sync_attempts || 0) + 1;
        if (attempts >= MAX_SYNC_RETRIES) {
          // Mark as failed after max retries
          await offlineDB.table(supabaseTable).update(row.id!, { 
            sync_status: 'sync_failed',
            sync_attempts: attempts 
          });
          logger.error(`Max retries reached for ${rowDescription}, marked as sync_failed`, undefined, 'Sync');
        } else {
          await offlineDB.table(supabaseTable).update(row.id!, { sync_attempts: attempts });
        }
      }
    }
  }

  return idMap;
}

export async function syncOfflineData(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    timestamp: Date.now(),
  };

  const metrics: SyncMetrics = {
    startTime: performance.now(),
    endTime: 0,
    duration: 0,
    synced: 0,
    failed: 0,
    retries: 0,
    timestamp: Date.now(),
  };

  emitSyncStart();

  if (!supabase) {
    result.success = false;
    result.errors.push('Supabase not configured. Cannot sync.');
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    recordMetric(metrics);
    emitSyncEnd(false, result.errors.join('; '));
    return result;
  }

  if (syncInProgress) {
    result.errors.push('Sync already in progress, run skipped.');
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    recordMetric(metrics);
    emitSyncEnd(false, result.errors.join('; '));
    return result;
  }
  setSyncInProgress(true);

  logger.info('Starting sync...', undefined, 'Sync');

  try {
    // 1. PROJECTS (parents of budgets, transactions, payroll, stock, logs, POs)
    const projectRows = await offlineDB.projects
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    const projectIdMap = await syncRows(
      'projects',
      projectRows,
      (p) => p.code,
      (p) => ({
        code: p.code,
        name: p.name,
        client_name: p.client_name,
        client_phone: p.client_phone || null,
        client_email: p.client_email || null,
        location: p.location,
        typology: p.typology,
        area_m2: p.area_m2,
        quality_level: p.quality_level,
        status: p.status,
        start_date: p.start_date || null,
        estimated_end_date: p.estimated_end_date || null,
        duration_days: p.duration_days,
        total_budget: p.total_budget,
        budget_total: p.budget_total,
        calculated_duration: p.calculated_duration,
        has_critical_roadblock: p.has_critical_roadblock || false,
        roadblock_type: p.roadblock_type || null,
        roadblock_description: p.roadblock_description || null,
        roadblock_date: p.roadblock_date || null,
        completion_buffer_days: p.completion_buffer_days || null,
        sync_status: p.sync_status,
      }),
      (p) => ({
        name: p.name,
        client_name: p.client_name,
        client_phone: p.client_phone || null,
        client_email: p.client_email || null,
        location: p.location,
        typology: p.typology,
        area_m2: p.area_m2,
        quality_level: p.quality_level,
        status: p.status,
        start_date: p.start_date || null,
        estimated_end_date: p.estimated_end_date || null,
        duration_days: p.duration_days,
        total_budget: p.total_budget,
        budget_total: p.budget_total,
        calculated_duration: p.calculated_duration,
        has_critical_roadblock: p.has_critical_roadblock || false,
        roadblock_type: p.roadblock_type || null,
        roadblock_description: p.roadblock_description || null,
        roadblock_date: p.roadblock_date || null,
        completion_buffer_days: p.completion_buffer_days || null,
      }),
      async (p, localId, serverId) => {
        await offlineDB.projects.update(localId, { id: serverId, sync_status: 'synced' });
        await remapProjectFks(localId, serverId);
      },
      async (p) => {
        await offlineDB.projects.update(p.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 2. SUPPLIERS (parents of purchase_orders)
    const supplierRows = await offlineDB.suppliers
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    const supplierIdMap = await syncRows(
      'suppliers',
      supplierRows,
      (s) => s.code,
      (s) => ({
        code: s.code,
        name: s.name,
        contact_person: s.contact_person,
        phone: s.phone,
        email: s.email,
        address: s.address,
        city: s.city,
        payment_terms: s.payment_terms,
        notes: s.notes,
        sync_status: s.sync_status,
      }),
      (s) => ({
        name: s.name,
        contact_person: s.contact_person,
        phone: s.phone,
        email: s.email,
        address: s.address,
        city: s.city,
        payment_terms: s.payment_terms,
        notes: s.notes,
      }),
      async (s, localId, serverId) => {
        await offlineDB.suppliers.update(localId, { id: serverId, sync_status: 'synced' });
        await remapSupplierFks(localId, serverId);
      },
      async (s) => {
        await offlineDB.suppliers.update(s.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 3. SUBCONTRACTORS (children of suppliers, optional link)
    const subcontractorRows = await offlineDB.subcontractors
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'subcontractors',
      subcontractorRows,
      (s) => s.code,
      (s) => ({
        user_id: s.user_id,
        supplier_id: remap(supplierIdMap, s.supplier_id),
        code: s.code,
        name: s.name,
        company_name: s.company_name,
        contact_person: s.contact_person,
        phone: s.phone,
        email: s.email,
        address: s.address,
        city: s.city,
        specialties: s.specialties,
        retention_rate: s.retention_rate,
        advance_amount: s.advance_amount,
        advance_balance: s.advance_balance,
        retention_balance: s.retention_balance,
        is_active: s.is_active,
        contract_start_date: s.contract_start_date,
        contract_end_date: s.contract_end_date,
        contract_value: s.contract_value,
        status: s.status,
        notes: s.notes,
        sync_status: s.sync_status,
      }),
      (s) => ({
        user_id: s.user_id,
        supplier_id: remap(supplierIdMap, s.supplier_id),
        code: s.code,
        name: s.name,
        company_name: s.company_name,
        contact_person: s.contact_person,
        phone: s.phone,
        email: s.email,
        address: s.address,
        city: s.city,
        specialties: s.specialties,
        retention_rate: s.retention_rate,
        advance_amount: s.advance_amount,
        advance_balance: s.advance_balance,
        retention_balance: s.retention_balance,
        is_active: s.is_active,
        contract_start_date: s.contract_start_date,
        contract_end_date: s.contract_end_date,
        contract_value: s.contract_value,
        status: s.status,
        notes: s.notes,
      }),
      async (s, localId, serverId) => {
        await offlineDB.subcontractors.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (s) => {
        await offlineDB.subcontractors.update(s.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 4. CLIENTS (independent)
    const clientRows = await offlineDB.clients
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'clients',
      clientRows,
      (c) => c.code,
      (c) => ({
        code: c.code,
        name: c.name,
        client_type: c.client_type,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        notes: c.notes,
        company_name: c.company_name,
        sync_status: c.sync_status,
      }),
      (c) => ({
        name: c.name,
        client_type: c.client_type,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        notes: c.notes,
        company_name: c.company_name,
      }),
      async (c, localId, serverId) => {
        await offlineDB.clients.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (c) => {
        await offlineDB.clients.update(c.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 4. PAYROLL EMPLOYEES (parents of payroll_records)
    const employeeRows = await offlineDB.payrollEmployees
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    const employeeIdMap = await syncRows(
      'payroll_employees',
      employeeRows,
      (e) => e.name,
      (e) => ({
        name: e.name,
        position: e.position,
        daily_rate: e.daily_rate,
        category: e.category,
        department: e.department,
        hire_date: e.hire_date,
        active: e.active,
        sync_status: e.sync_status,
      }),
      (e) => ({
        name: e.name,
        position: e.position,
        daily_rate: e.daily_rate,
        category: e.category,
        department: e.department,
        hire_date: e.hire_date,
        active: e.active,
      }),
      async (e, localId, serverId) => {
        await offlineDB.payrollEmployees.update(localId, { id: serverId, sync_status: 'synced' });
        await remapEmployeeFks(localId, serverId);
      },
      async (e) => {
        await offlineDB.payrollEmployees.update(e.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 5. BUDGETS (children of projects, parents of budget_items)
    const budgetRows = await offlineDB.budgets
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    const budgetIdMap = await syncRows(
      'budgets',
      budgetRows,
      (b) => `budget ${b.id}`,
      (b) => ({
        project_id: remap(projectIdMap, b.project_id),
        version: b.version,
        direct_cost: b.direct_cost,
        indirect_percentage: b.indirect_percentage,
        contingency_percentage: b.contingency_percentage,
        profit_percentage: b.profit_percentage,
        total_amount: b.total_amount,
        duration_days: b.duration_days,
        sync_status: b.sync_status,
      }),
      (b) => ({
        project_id: remap(projectIdMap, b.project_id),
        version: b.version,
        direct_cost: b.direct_cost,
        indirect_percentage: b.indirect_percentage,
        contingency_percentage: b.contingency_percentage,
        profit_percentage: b.profit_percentage,
        total_amount: b.total_amount,
        duration_days: b.duration_days,
      }),
      async (b, localId, serverId) => {
        await offlineDB.budgets.update(localId, { id: serverId, sync_status: 'synced' });
        await remapBudgetFks(localId, serverId);
      },
      async (b) => {
        await offlineDB.budgets.update(b.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 6. BUDGET ITEMS (children of budgets)
    const itemRows = await offlineDB.budgetItems
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    let budgetItemIdMap: Map<string, string> = new Map();
    budgetItemIdMap = await syncRows(
      'budget_items',
      itemRows,
      (i) => i.code || i.description.slice(0, 24),
      (i) => ({
        budget_id: remap(budgetIdMap, i.budget_id),
        parent_id: remap(budgetItemIdMap, i.parent_id),
        item_order: i.item_order,
        code: i.code,
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        total_cost: i.total_cost,
        is_custom: i.is_custom,
        length_m: i.length_m,
        width_m: i.width_m,
        depth_m: i.depth_m,
        height_m: i.height_m,
        slab_type: i.slab_type,
        apu_result: i.apu_result,
        apu_params: i.apu_params,
        actual_consumption: i.actual_consumption || 0,
        consumption_variance: i.consumption_variance || 0,
        sync_status: i.sync_status,
      }),
      (i) => ({
        budget_id: remap(budgetIdMap, i.budget_id),
        parent_id: remap(budgetItemIdMap, i.parent_id),
        item_order: i.item_order,
        code: i.code,
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        total_cost: i.total_cost,
        is_custom: i.is_custom,
        length_m: i.length_m,
        width_m: i.width_m,
        depth_m: i.depth_m,
        height_m: i.height_m,
        slab_type: i.slab_type,
        apu_result: i.apu_result,
        apu_params: i.apu_params,
        actual_consumption: i.actual_consumption || 0,
        consumption_variance: i.consumption_variance || 0,
      }),
      async (i, localId, serverId) => {
        await offlineDB.budgetItems.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (i) => {
        await offlineDB.budgetItems.update(i.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 7. FINANCIAL TRANSACTIONS (children of projects)
    const transactionRows = await offlineDB.financialTransactions
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'financial_transactions',
      transactionRows,
      (t) => t.description,
      (t) => ({
        project_id: remap(projectIdMap, t.project_id),
        type: t.type,
        category: t.category,
        description: t.description,
        quantity: t.quantity,
        unit: t.unit,
        unit_cost: t.unit_cost,
        total_cost: t.total_cost,
        date: t.date,
        receipt_url: t.receipt_url,
        payment_method: t.payment_method,
        tax_amount: t.tax_amount,
        related_supplier_id: t.related_supplier_id,
        related_client_id: t.related_client_id,
        related_purchase_order_id: t.related_purchase_order_id,
        document_number: t.document_number,
        is_reconciled: t.is_reconciled,
        sync_status: t.sync_status,
      }),
      (t) => ({
        project_id: remap(projectIdMap, t.project_id),
        type: t.type,
        category: t.category,
        description: t.description,
        quantity: t.quantity,
        unit: t.unit,
        unit_cost: t.unit_cost,
        total_cost: t.total_cost,
        date: t.date,
        receipt_url: t.receipt_url,
        payment_method: t.payment_method,
        tax_amount: t.tax_amount,
        related_supplier_id: t.related_supplier_id,
        related_client_id: t.related_client_id,
        related_purchase_order_id: t.related_purchase_order_id,
        document_number: t.document_number,
        is_reconciled: t.is_reconciled,
      }),
      async (t, localId, serverId) => {
        await offlineDB.financialTransactions.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (t) => {
        await offlineDB.financialTransactions.update(t.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 8. PAYROLL RECORDS (children of projects and employees)
    const recordRows = await offlineDB.payrollRecords
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'payroll_records',
      recordRows,
      (r) => `record ${r.id}`,
      (r) => ({
        project_id: remap(projectIdMap, r.project_id),
        employee_id: remap(employeeIdMap, r.employee_id),
        period_start: r.period_start,
        period_end: r.period_end,
        days_worked: r.days_worked,
        overtime_hours: r.overtime_hours,
        overtime_rate: r.overtime_rate,
        bonuses: r.bonuses,
        deductions: r.deductions,
        base_salary: r.base_salary,
        overtime_pay: r.overtime_pay,
        gross_salary: r.gross_salary,
        igss_deduction: r.igss_deduction,
        aguinaldo_provision: r.aguinaldo_provision,
        vacaciones_provision: r.vacaciones_provision,
        net_salary: r.net_salary,
        sync_status: r.sync_status,
      }),
      (r) => ({
        project_id: remap(projectIdMap, r.project_id),
        employee_id: remap(employeeIdMap, r.employee_id),
        period_start: r.period_start,
        period_end: r.period_end,
        days_worked: r.days_worked,
        overtime_hours: r.overtime_hours,
        overtime_rate: r.overtime_rate,
        bonuses: r.bonuses,
        deductions: r.deductions,
        base_salary: r.base_salary,
        overtime_pay: r.overtime_pay,
        gross_salary: r.gross_salary,
        igss_deduction: r.igss_deduction,
        aguinaldo_provision: r.aguinaldo_provision,
        vacaciones_provision: r.vacaciones_provision,
        net_salary: r.net_salary,
      }),
      async (r, localId, serverId) => {
        await offlineDB.payrollRecords.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (r) => {
        await offlineDB.payrollRecords.update(r.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 9. WAREHOUSE STOCK (children of projects)
    const stockRows = await offlineDB.warehouseStock
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'warehouse_stock',
      stockRows,
      (s) => s.item_code,
      (s) => ({
        project_id: remap(projectIdMap, s.project_id),
        item_code: s.item_code,
        description: s.description,
        unit: s.unit,
        current_stock: s.current_stock,
        minimum_threshold: s.minimum_threshold,
        unit_cost: s.unit_cost,
        sync_status: s.sync_status,
      }),
      (s) => ({
        project_id: remap(projectIdMap, s.project_id),
        item_code: s.item_code,
        description: s.description,
        unit: s.unit,
        current_stock: s.current_stock,
        minimum_threshold: s.minimum_threshold,
        unit_cost: s.unit_cost,
      }),
      async (s, localId, serverId) => {
        await offlineDB.warehouseStock.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (s) => {
        await offlineDB.warehouseStock.update(s.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 10. PURCHASE ORDERS (children of suppliers and projects)
    const orderRows = await offlineDB.purchaseOrders
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    const orderIdMap = await syncRows(
      'purchase_orders',
      orderRows,
      (o) => o.code,
      (o) => ({
        code: o.code,
        supplier_id: remap(supplierIdMap, o.supplier_id),
        project_id: remap(projectIdMap, o.project_id),
        order_date: o.order_date,
        expected_delivery_date: o.expected_delivery_date,
        status: o.status,
        total_amount: o.total_amount,
        notes: o.notes,
        sync_status: o.sync_status,
      }),
      (o) => ({
        supplier_id: remap(supplierIdMap, o.supplier_id),
        project_id: remap(projectIdMap, o.project_id),
        order_date: o.order_date,
        expected_delivery_date: o.expected_delivery_date,
        status: o.status,
        total_amount: o.total_amount,
        notes: o.notes,
      }),
      async (o, localId, serverId) => {
        await offlineDB.purchaseOrders.update(localId, { id: serverId, sync_status: 'synced' });
        await remapOrderFks(localId, serverId);
      },
      async (o) => {
        await offlineDB.purchaseOrders.update(o.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 11. PURCHASE ORDER ITEMS (children of purchase_orders)
    const orderItemRows = await offlineDB.purchaseOrderItems
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'purchase_order_items',
      orderItemRows,
      (i) => i.item_code || i.description.slice(0, 24),
      (i) => ({
        purchase_order_id: remap(orderIdMap, i.purchase_order_id),
        item_code: i.item_code,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price,
        total_price: i.total_price,
        received_quantity: i.received_quantity,
        sync_status: i.sync_status,
      }),
      (i) => ({
        purchase_order_id: remap(orderIdMap, i.purchase_order_id),
        item_code: i.item_code,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price,
        total_price: i.total_price,
        received_quantity: i.received_quantity,
      }),
      async (i, localId, serverId) => {
        await offlineDB.purchaseOrderItems.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (i) => {
        await offlineDB.purchaseOrderItems.update(i.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 12. PROJECT LOGS (children of projects)
    const logRows = await offlineDB.projectLogs
      .where('sync_status')
      .anyOf(PENDING_STATUSES)
      .toArray();
    await syncRows(
      'project_logs',
      logRows,
      (l) => l.description.slice(0, 24),
      (l) => ({
        project_id: remap(projectIdMap, l.project_id),
        activity_type: l.activity_type,
        description: l.description,
        physical_progress: l.physical_progress,
        financial_progress: l.financial_progress,
        log_date: l.log_date,
        created_by: l.created_by,
        photos: l.photos,
        sync_status: l.sync_status,
      }),
      (l) => ({
        project_id: remap(projectIdMap, l.project_id),
        activity_type: l.activity_type,
        description: l.description,
        physical_progress: l.physical_progress,
        financial_progress: l.financial_progress,
        log_date: l.log_date,
        created_by: l.created_by,
        photos: l.photos,
      }),
      async (l, localId, serverId) => {
        await offlineDB.projectLogs.update(localId, { id: serverId, sync_status: 'synced' });
      },
      async (l) => {
        await offlineDB.projectLogs.update(l.id!, { sync_status: 'synced' });
      },
      result,
    );

    // 13. PENDING DELETES (registros eliminados sin conexión)
    // OPTIMIZACIÓN: Procesar en lotes paralelos
    const pendingDeletes = await offlineDB.pendingDeletes.toArray();
    const deletePromises: Promise<void>[] = [];
    const supplierDeletePromises: Promise<void>[] = [];

    for (const pd of pendingDeletes) {
      if (pd.table === 'suppliers') {
        // Primero eliminar purchase_orders (RESTRICT)
        supplierDeletePromises.push(
          (async () => {
            try {
              const { error: poError } = await supabase
                .from('purchase_orders')
                .delete()
                .eq('supplier_id', pd.serverId);
              if (poError) throw poError;
              
              const { error } = await supabase.from(pd.table).delete().eq('id', pd.serverId);
              if (error) throw error;
              await offlineDB.pendingDeletes.delete(pd.id!);
              result.synced++;
            } catch (error) {
              result.failed++;
              result.errors.push(`Failed to delete ${pd.table} ${pd.serverId}: ${error}`);
            }
          })()
        );
      } else {
        deletePromises.push(
          (async () => {
            try {
              const { error } = await supabase.from(pd.table).delete().eq('id', pd.serverId);
              if (error) throw error;
              await offlineDB.pendingDeletes.delete(pd.id!);
              result.synced++;
            } catch (error) {
              result.failed++;
              result.errors.push(`Failed to delete ${pd.table} ${pd.serverId}: ${error}`);
            }
          })()
        );
      }
    }

    await Promise.all([...supplierDeletePromises, ...deletePromises]);

    if (result.failed > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Sync failed: ${error}`);
    return result;
  } finally {
    setSyncInProgress(false);
    emitSyncEnd(result.success, result.errors.length ? result.errors.join('; ') : undefined);
  }
}

export async function fetchProjectsForOffline() {
  if (!supabase) {
    console.error('Supabase not configured. Cannot fetch projects.');
    return [];
  }

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Store in local database
    for (const project of projects || []) {
      await offlineDB.projects.put({
        ...project,
        sync_status: 'synced',
      });
    }

    return projects;
  } catch (error) {
    console.error('Failed to fetch projects for offline:', error);
    return [];
  }
}

export function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine;
}

export function setupNetworkListeners() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.log('Network status: online');
    // Trigger sync when coming back online
    if (supabase) {
      // Sincronización "fire-and-forget" al recuperar conexión: se ejecuta en
      // segundo plano y cualquier fallo se registra sin romper la app ni dejar
      // una promesa rechazada sin manejar. No bloquea al usuario.
      syncOfflineData().catch((error) => {
        console.error('Error en sync automático al recuperar conexión:', error);
      });
    }
  });

  window.addEventListener('offline', () => {
    console.log('Network status: offline');
  });
}

/**
 * Get sync statistics to show pending operations
 */
export async function getSyncStats(): Promise<SyncStats> {
  const stats: SyncStats = {
    pendingProjects: 0,
    pendingBudgets: 0,
    pendingBudgetItems: 0,
    pendingTransactions: 0,
    pendingPayroll: 0,
    pendingWarehouse: 0,
    pendingClients: 0,
    pendingProjectLogs: 0,
    pendingSuppliers: 0,
    pendingPurchaseOrders: 0,
    pendingPurchaseOrderItems: 0,
    pendingSubcontractors: 0,
    pendingDeletes: 0,
    lastSync: null,
  };

  try {
    // OPTIMIZACIÓN: Paralelizar todas las queries de conteo
    const [
      pendingProjectsCount,
      pendingBudgetsCount,
      pendingBudgetItemsCount,
      pendingTransactionsCount,
      pendingPayrollEmployeesCount,
      pendingPayrollRecordsCount,
      pendingWarehouseCount,
      pendingClientsCount,
      pendingProjectLogsCount,
      pendingSuppliersCount,
      pendingPurchaseOrdersCount,
      pendingPurchaseOrderItemsCount,
      pendingSubcontractorsCount,
      pendingDeletesCount,
    ] = await Promise.all([
      offlineDB.projects.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.budgets.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.budgetItems.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.financialTransactions.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.payrollEmployees.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.payrollRecords.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.warehouseStock.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.clients.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.projectLogs.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.suppliers.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.purchaseOrders.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.purchaseOrderItems.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.subcontractors.where('sync_status').anyOf(PENDING_STATUSES).count(),
      offlineDB.pendingDeletes.count(),
    ]);

    stats.pendingProjects = pendingProjectsCount;
    stats.pendingBudgets = pendingBudgetsCount;
    stats.pendingBudgetItems = pendingBudgetItemsCount;
    stats.pendingTransactions = pendingTransactionsCount;
    stats.pendingPayroll = pendingPayrollEmployeesCount + pendingPayrollRecordsCount;
    stats.pendingWarehouse = pendingWarehouseCount;
    stats.pendingClients = pendingClientsCount;
    stats.pendingProjectLogs = pendingProjectLogsCount;
    stats.pendingSuppliers = pendingSuppliersCount;
    stats.pendingPurchaseOrders = pendingPurchaseOrdersCount;
    stats.pendingPurchaseOrderItems = pendingPurchaseOrderItemsCount;
    stats.pendingSubcontractors = pendingSubcontractorsCount;
    stats.pendingDeletes = pendingDeletesCount;

    // Get last sync timestamp from localStorage
    const lastSync = localStorage.getItem('lastSyncTimestamp');
    if (lastSync) {
      stats.lastSync = parseInt(lastSync, 10);
    }
  } catch (error) {
    console.error('Failed to get sync stats:', error);
  }

  return stats;
}

/**
 * Marca un registro ya sincronizado para su borrado en Supabase. El llamador
 * elimina la fila de la base local de inmediato; esta entrada garantiza que el
 * motor de sync borre la fila del servidor (ahora mismo si hay conexión, o en
 * la siguiente ejecución). Devuelve true si se encoló el borrado remoto.
 */
export async function queueDelete(remoteTable: string, row: { id?: string }): Promise<boolean> {
  if (!isServerId(row.id)) return false;

  const existing = await offlineDB.pendingDeletes
    .where({ table: remoteTable, serverId: row.id! })
    .first();
  if (existing) return true;

  try {
    await cascadeLocalDelete(remoteTable, row.id!);
  } catch (error) {
    console.warn(`queueDelete: failed to delete dependent local rows for ${remoteTable} ${row.id}:`, error);
  }

  await offlineDB.pendingDeletes.add({
    table: remoteTable,
    serverId: row.id!,
    created_at: Date.now(),
  });

  if (isOnline() && supabase) {
    // Sincronización "fire-and-forget" tras encolar el borrado remoto: corre en
    // segundo plano y cualquier fallo se registra sin propagar una excepción al
    // llamador (el borrado local ya se encoló correctamente).
    syncOfflineData().catch((error) => {
      console.error(`queueDelete: sync en segundo plano falló para ${remoteTable} ${row.id}:`, error);
    });
  }
  return true;
}

/**
 * Update last sync timestamp
 */
export function updateLastSyncTimestamp() {
  localStorage.setItem('lastSyncTimestamp', Date.now().toString());
}

/**
 * Force full sync from server to client (refresh local data).
 *
 * Safe version: server rows are upserted but NEVER overwrite local records that
 * still have pending changes (created_offline/updated_offline/pending). Local
 * tables are not cleared, so offline data is never lost.
 */
async function getPendingDeleteIds(): Promise<Map<string, Set<string>>> {
  const pendingDeletes = await offlineDB.pendingDeletes.toArray();
  const deleteMap = new Map<string, Set<string>>();
  for (const pd of pendingDeletes) {
    const set = deleteMap.get(pd.table) || new Set<string>();
    set.add(pd.serverId);
    deleteMap.set(pd.table, set);
  }
  return deleteMap;
}

export async function forceFullSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    timestamp: Date.now(),
  };

  const metrics: SyncMetrics = {
    startTime: performance.now(),
    endTime: 0,
    duration: 0,
    synced: 0,
    failed: 0,
    retries: 0,
    timestamp: Date.now(),
  };

  emitSyncStart();

  if (!supabase) {
    result.success = false;
    result.errors.push('Supabase not configured.');
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    recordMetric(metrics);
    emitSyncEnd(false, result.errors.join('; '));
    return result;
  }

  if (syncInProgress) {
    result.errors.push('Sync already in progress, run skipped.');
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    recordMetric(metrics);
    emitSyncEnd(false, result.errors.join('; '));
    return result;
  }
  setSyncInProgress(true);

  const tables: { local: Table<any, any>; remote: string }[] = [
    { local: offlineDB.projects, remote: 'projects' },
    { local: offlineDB.budgets, remote: 'budgets' },
    { local: offlineDB.budgetItems, remote: 'budget_items' },
    { local: offlineDB.financialTransactions, remote: 'financial_transactions' },
    { local: offlineDB.payrollEmployees, remote: 'payroll_employees' },
    { local: offlineDB.payrollRecords, remote: 'payroll_records' },
    { local: offlineDB.warehouseStock, remote: 'warehouse_stock' },
    { local: offlineDB.clients, remote: 'clients' },
    { local: offlineDB.projectLogs, remote: 'project_logs' },
    { local: offlineDB.suppliers, remote: 'suppliers' },
    { local: offlineDB.purchaseOrders, remote: 'purchase_orders' },
    { local: offlineDB.purchaseOrderItems, remote: 'purchase_order_items' },
    { local: offlineDB.subcontractors, remote: 'subcontractors' },
  ];

  try {
    // OPTIMIZACIÓN: Traer solo IDs de filas con cambios locales pendientes.
    const localPendingIds = new Map<string, Set<string>>();
    for (const { local, remote } of tables) {
      const pendingRows = await local.where('sync_status').anyOf(PENDING_STATUSES).toArray();
      const ids = new Set(pendingRows.map(r => r.id).filter((id): id is string => !!id));
      localPendingIds.set(remote, ids);
    }

    const pendingDeleteIds = await getPendingDeleteIds();

    await Promise.all(tables.map(async ({ local, remote }) => {
      try {
        const { data, error } = await supabase!.from(remote).select('*');
        if (error) throw error;

        const pendingIds = localPendingIds.get(remote) || new Set();
        const pendingDeletes = pendingDeleteIds.get(remote) || new Set();
        const serverIds = new Set<string>();
        const bulkOps: Promise<void>[] = [];

        for (const row of data || []) {
          const rowId = String(row.id);
          serverIds.add(rowId);

          // Skip if there are pending local changes or a pending remote delete for this row.
          if (pendingIds.has(rowId) || pendingDeletes.has(rowId)) continue;

          bulkOps.push(local.put({ ...row, sync_status: 'synced' }));
        }

        await Promise.all(bulkOps);
        result.synced += (data || []).length;

        // Remove stale server-owned local rows that were deleted remotely and have no local pending changes.
        const localRows = await local.toArray();
        const staleDeletes: Promise<void>[] = [];
        for (const localRow of localRows) {
          const localId = String(localRow.id);
          if (!isServerId(localId)) continue;
          if (pendingIds.has(localId)) continue;
          if (pendingDeletes.has(localId)) continue;
          if (!serverIds.has(localId)) {
            staleDeletes.push(local.delete(localId));
          }
        }
        await Promise.all(staleDeletes);
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to pull ${remote}: ${error}`);
      }
    }) as Promise<void>[]);

    updateLastSyncTimestamp();
    
    if (result.failed > 0) {
      result.success = false;
    }

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.synced = result.synced;
    metrics.failed = result.failed;
    recordMetric(metrics);
    
    logger.info(`Sync completed: ${result.synced} synced, ${result.failed} failed in ${metrics.duration.toFixed(2)}ms`, undefined, 'Sync');
    emitSyncEnd(result.success, result.errors.length ? result.errors.join('; ') : undefined);
    
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Full sync failed: ${error}`);
    
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.failed = result.failed;
    recordMetric(metrics);
    
    logger.error(`Sync failed: ${error}`, undefined, 'Sync');
    return result;
  } finally {
    setSyncInProgress(false);
  }
}
