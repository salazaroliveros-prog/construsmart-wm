import { offlineDB } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export async function syncOfflineData(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  if (!supabase) {
    result.success = false;
    result.errors.push('Supabase not configured. Cannot sync.');
    return result;
  }

  try {
    // Sync projects created offline
    const offlineProjects = await offlineDB.projects
      .where('sync_status')
      .equals('created_offline')
      .toArray();

    for (const project of offlineProjects) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            code: project.code,
            name: project.name,
            client_name: project.client_name,
            client_phone: project.client_phone,
            client_email: project.client_email,
            location: project.location,
            typology: project.typology,
            area_m2: project.area_m2,
            quality_level: project.quality_level,
            status: project.status,
            start_date: project.start_date,
            estimated_end_date: project.estimated_end_date,
            duration_days: project.duration_days,
            total_budget: project.total_budget,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local record with server ID and sync status
        await offlineDB.projects.update(project.id!, {
          id: data.id,
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync project ${project.code}: ${error}`);
      }
    }

    // Sync projects updated offline
    const updatedProjects = await offlineDB.projects
      .where('sync_status')
      .equals('updated_offline')
      .toArray();

    for (const project of updatedProjects) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            name: project.name,
            client_name: project.client_name,
            client_phone: project.client_phone,
            client_email: project.client_email,
            location: project.location,
            typology: project.typology,
            area_m2: project.area_m2,
            quality_level: project.quality_level,
            status: project.status,
            start_date: project.start_date,
            estimated_end_date: project.estimated_end_date,
            duration_days: project.duration_days,
            total_budget: project.total_budget,
          })
          .eq('id', project.id);

        if (error) throw error;

        await offlineDB.projects.update(project.id!, {
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync project update ${project.code}: ${error}`);
      }
    }

    // Sync financial transactions created offline
    const offlineTransactions = await offlineDB.financialTransactions
      .where('sync_status')
      .equals('created_offline')
      .toArray();

    for (const transaction of offlineTransactions) {
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .insert({
            project_id: transaction.project_id,
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            quantity: transaction.quantity,
            unit: transaction.unit,
            unit_cost: transaction.unit_cost,
            total_cost: transaction.total_cost,
            date: transaction.date,
            receipt_url: transaction.receipt_url,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local record with server ID and sync status
        await offlineDB.financialTransactions.update(transaction.id!, {
          id: data.id,
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync transaction ${transaction.description}: ${error}`);
      }
    }

    // Sync financial transactions updated offline
    const updatedTransactions = await offlineDB.financialTransactions
      .where('sync_status')
      .equals('updated_offline')
      .toArray();

    for (const transaction of updatedTransactions) {
      try {
        const { error } = await supabase
          .from('financial_transactions')
          .update({
            project_id: transaction.project_id,
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            quantity: transaction.quantity,
            unit: transaction.unit,
            unit_cost: transaction.unit_cost,
            total_cost: transaction.total_cost,
            date: transaction.date,
            receipt_url: transaction.receipt_url,
          })
          .eq('id', transaction.id);

        if (error) throw error;

        await offlineDB.financialTransactions.update(transaction.id!, {
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync transaction update ${transaction.description}: ${error}`);
      }
    }

    // Sync budgets created offline
    const offlineBudgets = await offlineDB.budgets
      .where('sync_status')
      .equals('created_offline')
      .toArray();

    for (const budget of offlineBudgets) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            project_id: budget.project_id,
            version: budget.version.toString(),
            direct_cost: budget.direct_cost,
            indirect_percentage: budget.indirect_percentage,
            contingency_percentage: budget.contingency_percentage,
            profit_percentage: budget.profit_percentage,
            total_amount: budget.total_amount,
          })
          .select()
          .single();

        if (error) throw error;

        await offlineDB.budgets.update(budget.id!, {
          id: data.id,
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync budget: ${error}`);
      }
    }

    // Sync payroll employees created offline
    const offlineEmployees = await offlineDB.payrollEmployees
      .where('sync_status')
      .equals('created_offline')
      .toArray();

    for (const employee of offlineEmployees) {
      try {
        const { data, error } = await supabase
          .from('payroll_employees')
          .insert({
            name: employee.name,
            position: employee.position,
            daily_rate: employee.daily_rate,
            category: employee.category,
            department: employee.department,
            hire_date: employee.hire_date,
            active: employee.active,
          })
          .select()
          .single();

        if (error) throw error;

        await offlineDB.payrollEmployees.update(employee.id!, {
          id: data.id,
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync employee ${employee.name}: ${error}`);
      }
    }

    // Sync warehouse stock created offline
    const offlineStock = await offlineDB.warehouseStock
      .where('sync_status')
      .equals('created_offline')
      .toArray();

    for (const stock of offlineStock) {
      try {
        const { data, error } = await supabase
          .from('warehouse_stock')
          .insert({
            item_code: stock.item_code,
            description: stock.description,
            unit: stock.unit,
            current_stock: stock.current_stock,
            minimum_threshold: stock.minimum_threshold,
            unit_cost: stock.unit_cost,
          })
          .select()
          .single();

        if (error) throw error;

        await offlineDB.warehouseStock.update(stock.id!, {
          id: data.id,
          sync_status: 'synced',
        });

        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync stock ${stock.item_code}: ${error}`);
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Sync failed: ${error}`);
    return result;
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
      syncOfflineData();
    }
  });

  window.addEventListener('offline', () => {
    console.log('Network status: offline');
  });
}
