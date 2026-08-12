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
  static async create<T extends { id?: string; user_id?: string; sync_status?: string; created_at?: string; updated_at?: string }>(
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
        sync_status: online ? 'synced' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;

      // 1. Persistir en Dexie PRIMERO (source of truth local)
      await (offlineDB as any)[table].add(fullData);

      let remoteId = undefined;
      let syncStatus: 'synced' | 'pending' | 'error' = online ? 'synced' : 'pending';

      // 2. Si está online, sincronizar con Supabase
      if (online && supabase) {
        const { data: remoteRecord, error } = await supabase
          .from(this.mapTableName(table))
          .insert([fullData])
          .select()
          .single();

        if (error) {
          // Sync falló, marcar como pending
          await (offlineDB as any)[table].update(localId, { sync_status: 'pending' });
          syncStatus = 'pending';
          console.warn(`[Persistence] Insert to Supabase failed, marked as pending:`, error);
        } else {
          remoteId = remoteRecord?.id;
          // Actualizar con remoteId si fue asignado por servidor
          if (remoteId !== localId) {
            await (offlineDB as any)[table].delete(localId);
            (fullData as any).id = remoteId;
            await (offlineDB as any)[table].add(fullData);
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
      const localRecord = await (offlineDB as any)[table].get(id);

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
            await (offlineDB as any)[table].update(id, remoteRecord);
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
  static async update<T extends { id: string; sync_status?: string; updated_at?: string }>(
    table: SyncableTable,
    id: string,
    updates: Partial<T>
  ): Promise<PersistenceResult<T>> {
    try {
      const existing = await (offlineDB as any)[table].get(id);
      if (!existing) throw new Error(`Record ${id} not found in ${table}`);

      const online = isOnline();
      const updated: T = {
        ...existing,
        ...updates,
        sync_status: online ? 'synced' : 'pending',
        updated_at: new Date().toISOString(),
      } as T;

      // 1. Actualizar en Dexie PRIMERO
      await (offlineDB as any)[table].update(id, updated);

      let syncStatus: 'synced' | 'pending' | 'error' = online ? 'synced' : 'pending';

      // 2. Si está online, sincronizar con Supabase
      if (online && supabase) {
        const { error } = await supabase
          .from(this.mapTableName(table))
          .update(updates as any)
          .eq('id', id);

        if (error) {
          await (offlineDB as any)[table].update(id, { sync_status: 'pending' });
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
      const record = await (offlineDB as any)[table].get(id);
      if (!record) throw new Error(`Record ${id} not found in ${table}`);

      // 1. Eliminar local inmediatamente
      await (offlineDB as any)[table].delete(id);

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