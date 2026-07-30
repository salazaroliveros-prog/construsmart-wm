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

    // Similar sync logic for other entities (budgets, items, transactions, etc.)
    // ... (would be implemented following the same pattern)

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Sync failed: ${error}`);
    return result;
  }
}

export async function fetchProjectsForOffline() {
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
    syncOfflineData();
  });

  window.addEventListener('offline', () => {
    console.log('Network status: offline');
  });
}
