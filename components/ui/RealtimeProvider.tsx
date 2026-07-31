'use client';

import { useEffect } from 'react';
import type { Table } from 'dexie';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { offlineDB } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { PENDING_STATUSES } from '@/lib/utils/offlineSync';

/**
 * Suscribe la app a cambios en Supabase (Realtime) para reflejar en vivo los
 * cambios hechos por otros dispositivos mientras hay conexión. Los registros
 * que aún tienen cambios locales sin sincronizar NO se sobrescriben (gana lo
 * local); el motor de sync los empuja después.
 */
type RemoteToLocal = { remote: string; local: Table<any, any> };

const TABLES: RemoteToLocal[] = [
  { remote: 'projects', local: offlineDB.projects },
  { remote: 'budgets', local: offlineDB.budgets },
  { remote: 'budget_items', local: offlineDB.budgetItems },
  { remote: 'financial_transactions', local: offlineDB.financialTransactions },
  { remote: 'payroll_employees', local: offlineDB.payrollEmployees },
  { remote: 'payroll_records', local: offlineDB.payrollRecords },
  { remote: 'warehouse_stock', local: offlineDB.warehouseStock },
  { remote: 'clients', local: offlineDB.clients },
  { remote: 'project_logs', local: offlineDB.projectLogs },
  { remote: 'suppliers', local: offlineDB.suppliers },
  { remote: 'purchase_orders', local: offlineDB.purchaseOrders },
  { remote: 'purchase_order_items', local: offlineDB.purchaseOrderItems },
];

async function applyChange(payload: {
  eventType: string;
  table: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}) {
  const mapping = TABLES.find((t) => t.remote === payload.table);
  if (!mapping) return;
  const { local } = mapping;

  try {
    if (payload.eventType === 'DELETE') {
      const serverId = payload.old?.id as string | undefined;
      if (serverId) {
        await local.delete(serverId);
        await offlineDB.pendingDeletes.where('serverId').equals(serverId).delete();
      }
      return;
    }

    const serverRow = payload.new;
    const serverId = serverRow?.id as string | undefined;
    if (!serverId) return;

    const existing = await local.get(serverId);
    if (existing && PENDING_STATUSES.includes(existing.sync_status || '')) {
      return; // Cambios locales pendientes ganan sobre el evento realtime
    }

    await local.put({ ...serverRow, sync_status: 'synced' });
  } catch (error) {
    console.error(`Realtime: error applying change for ${payload.table}:`, error);
  }
}

export default function RealtimeProvider() {
  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return;

    const channels: RealtimeChannel[] = TABLES.map(({ remote }) =>
      supabase!
        .channel(`realtime-${remote}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: remote }, (payload) => {
          applyChange(payload);
        })
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase!.removeChannel(channel));
    };
  }, []);

  return null;
}
