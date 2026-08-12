/**
 * Conflict Resolution System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Interactive conflict resolution for sync operations
 * Provides user choice when local and server data conflict
 */

export interface ConflictData {
  local: any;
  server: any;
  localUpdatedAt: string;
  serverUpdatedAt: string;
  table: string;
  recordId: string;
}

export type ConflictResolution = 'keep-local' | 'keep-server' | 'merge' | 'cancel';

export interface ConflictResolutionOptions {
  showConflictDialog: (conflict: ConflictData) => Promise<ConflictResolution>;
  autoResolve?: boolean; // For testing or non-interactive scenarios
  defaultResolution?: ConflictResolution;
}

/**
 * Detect if there's a conflict between local and server data
 * Based on Last-Write-Wins (LWW) with timestamps
 */
export function detectConflict(
  localRecord: any,
  serverRecord: any
): { hasConflict: boolean; winner: 'local' | 'server' | 'tie' } {
  if (!localRecord || !serverRecord) {
    return { hasConflict: false, winner: 'server' };
  }

  const localUpdatedAt = new Date(localRecord.updated_at || 0);
  const serverUpdatedAt = new Date(serverRecord.updated_at || 0);

  const timeDiff = Math.abs(localUpdatedAt.getTime() - serverUpdatedAt.getTime());
  const threshold = 1000; // 1 second threshold to consider as conflict

  if (timeDiff < threshold) {
    return { hasConflict: true, winner: 'tie' };
  }

  if (localUpdatedAt > serverUpdatedAt) {
    return { hasConflict: false, winner: 'local' };
  } else {
    return { hasConflict: false, winner: 'server' };
  }
}

/**
 * Resolve a conflict using the provided resolution strategy
 */
export async function resolveConflict(
  conflict: ConflictData,
  resolution: ConflictResolution,
  supabase: any,
  offlineDB: any
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (resolution) {
      case 'keep-local':
        // Force server update with local data
        const { error: updateError } = await supabase
          .from(conflict.table)
          .update(conflict.local)
          .eq('id', conflict.recordId);

        if (updateError) throw updateError;

        // Update local sync status
        await offlineDB[conflict.table].update(conflict.recordId, {
          sync_status: 'synced',
          updated_at: new Date().toISOString(),
        });

        return { success: true };

      case 'keep-server':
        // Update local with server data
        await offlineDB[conflict.table].update(conflict.recordId, {
          ...conflict.server,
          sync_status: 'synced',
        });

        return { success: true };

      case 'merge':
        // Attempt intelligent merge (field-level)
        const merged = mergeRecords(conflict.local, conflict.server);
        
        const { error: mergeError } = await supabase
          .from(conflict.table)
          .update(merged)
          .eq('id', conflict.recordId);

        if (mergeError) throw mergeError;

        await offlineDB[conflict.table].update(conflict.recordId, {
          ...merged,
          sync_status: 'synced',
        });

        return { success: true };

      case 'cancel':
        // Leave both as-is, mark as needing manual resolution
        await offlineDB[conflict.table].update(conflict.recordId, {
          sync_status: 'sync_failed',
          sync_error: 'Conflict resolution cancelled by user',
        });

        return { success: true };

      default:
        throw new Error(`Unknown resolution strategy: ${resolution}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Intelligent field-level merge
 * Combines non-conflicting fields from both records
 */
function mergeRecords(local: any, server: any): any {
  const merged: any = { ...server };

  // Fields to always prefer local (user edits)
  const localPriorityFields = [
    'description',
    'notes',
    'client_name',
    'client_phone',
    'client_email',
  ];

  // Fields to always prefer server (system-generated)
  const serverPriorityFields = [
    'created_at',
    'sync_status',
    'sync_error',
    'last_sync_attempt',
  ];

  // Apply local priority
  for (const field of localPriorityFields) {
    if (local[field] !== undefined && local[field] !== null) {
      merged[field] = local[field];
    }
  }

  // For numeric fields, take the maximum (most recent update)
  const numericFields = ['current_stock', 'total_cost', 'quantity'];
  for (const field of numericFields) {
    if (local[field] !== undefined && server[field] !== undefined) {
      merged[field] = Math.max(local[field], server[field]);
    }
  }

  // Update timestamp to now
  merged.updated_at = new Date().toISOString();

  return merged;
}

/**
 * Generate a human-readable conflict summary
 */
export function getConflictSummary(conflict: ConflictData): string {
  const changes: string[] = [];

  // Compare common fields
  const fieldsToCompare = [
    'name', 'description', 'status', 'total_cost', 
    'current_stock', 'quantity', 'client_name'
  ];

  for (const field of fieldsToCompare) {
    if (conflict.local[field] !== conflict.server[field]) {
      changes.push(
        `${field}: "${conflict.local[field]}" (local) vs "${conflict.server[field]}" (server)`
      );
    }
  }

  if (changes.length === 0) {
    return 'Conflicto de timestamps sin cambios detectados en campos principales';
  }

  return `Diferencias detectadas:\n${changes.join('\n')}`;
}

/**
 * Default conflict resolution handler (non-interactive)
 * Used for automated scenarios where user interaction isn't possible
 */
export function getDefaultConflictResolution(
  conflict: ConflictData
): ConflictResolution {
  // Default to server wins for safety
  return 'keep-server';
}

/**
 * Create a conflict resolution event for UI handling
 */
export function createConflictEvent(conflict: ConflictData): CustomEvent {
  return new CustomEvent('sync-conflict', {
    detail: {
      conflict,
      summary: getConflictSummary(conflict),
      timestamp: Date.now(),
    },
  });
}

/**
 * Emit a conflict event to the window
 */
export function emitConflictEvent(conflict: ConflictData): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(createConflictEvent(conflict));
  }
}