'use client';

import { useEffect } from 'react';
import type { Table } from 'dexie';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { offlineDB } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { PENDING_STATUSES, cascadeLocalDelete } from '@/lib/utils/offlineSync';

/**
 * Suscribe la app a cambios en Supabase (Realtime) para reflejar en vivo los
 * cambios hechos por otros dispositivos mientras hay conexión. Los registros
 * que aún tienen cambios locales sin sincronizar NO se sobrescriben (gana lo
 * local); el motor de sync los empuja después.
 */
type RemoteToLocal = { remote: string; local: Table<any, any> };

// Mapa de tablas por tab activa. Solo se suscriben las tablas del módulo
// actualmente visible para reducir canales realtime y carga de red/CPU.
// La tab "dashboard" usa las tablas esenciales que alimentan los KPIs.
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
  { remote: 'subcontractors', local: offlineDB.subcontractors },
];

// Map de tab → tablas que necesita (por nombre remoto).
const TAB_BY_TABLES: Record<string, string[]> = {
  dashboard: ['projects', 'financial_transactions', 'project_logs', 'warehouse_stock', 'budgets', 'budget_items', 'purchase_orders', 'purchase_order_items', 'payroll_records', 'payroll_employees', 'clients', 'suppliers'],
  projects: ['projects'],
  budgets: ['projects', 'budgets', 'budget_items'],
  progress: ['projects', 'project_logs', 'budgets', 'budget_items'],
  finances: ['financial_transactions', 'projects', 'budgets', 'budget_items'],
  payroll: ['payroll_employees', 'payroll_records'],
  warehouse: ['warehouse_stock', 'projects'],
  suppliers: ['suppliers', 'purchase_orders'],
  orders: ['purchase_orders', 'purchase_order_items', 'suppliers'],
  subcontractors: ['subcontractors', 'suppliers'],
  clients: ['clients'],
  logs: ['project_logs', 'projects'],
  settings: [],
};

// Extrae los nombres remotos de las tablas para un tab dado.
function tablesForTab(activeTab: string): string[] {
  const names = TAB_BY_TABLES[activeTab] || TAB_BY_TABLES.dashboard;
  return TABLES.filter(t => names.includes(t.remote)).map(t => t.remote);
}

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
        try {
          await cascadeLocalDelete(payload.table, serverId);
        } catch (cascadeError) {
          console.warn(`Realtime cascade delete failed for ${payload.table} ${serverId}:`, cascadeError);
        }
        await local.delete(serverId);
        await offlineDB.pendingDeletes.where('serverId').equals(serverId).delete();
      }
      window.dispatchEvent(new CustomEvent('wm-dexie-changed', { detail: { table: payload.table } }));
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

    // Notifica a las vistas abiertas para que recarguen su estado desde Dexie
    window.dispatchEvent(new CustomEvent('wm-dexie-changed', { detail: { table: payload.table } }));
  } catch (error) {
    console.error(`Realtime: error applying change for ${payload.table}:`, error);
  }
}

export default function RealtimeProvider({ activeTab = 'dashboard' }: { activeTab?: string }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return;

    const relevantTables = tablesForTab(activeTab);
    const channels: RealtimeChannel[] = relevantTables.map((remote) =>
      supabase!
        .channel(`realtime-${remote}-${activeTab}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: remote }, (payload) => {
          applyChange(payload);
        })
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase!.removeChannel(channel));
    };
  }, [activeTab]);

  return null;
}
