export type SyncStatusValue = 'pending' | 'syncing' | 'synced' | 'error';

export function normalizeSyncStatus(value?: string | null): SyncStatusValue {
  if (!value) return 'synced';

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'syncing':
    case 'synced':
    case 'error':
    case 'created_offline': // Legacy mapping
    case 'updated_offline': // Legacy mapping
    case 'sync_failed': // Legacy mapping
      if (normalized === 'created_offline' || normalized === 'updated_offline' || normalized === 'sync_failed') {
        return 'pending';
      }
      return normalized as SyncStatusValue;
    default:
      return 'synced';
  }
}

export function isPendingSyncStatus(status?: string | null): boolean {
  const normalized = normalizeSyncStatus(status);
  return normalized === 'pending' || normalized === 'syncing' || normalized === 'error';
}

export interface ResolveSyncStatusOptions {
  isNewRecord: boolean;
  previousStatus?: string | null;
  isOnline?: boolean;
}

export function resolveSyncStatus({
  isNewRecord,
  previousStatus,
  isOnline = true,
}: ResolveSyncStatusOptions): SyncStatusValue {
  if (isNewRecord) {
    return isOnline ? 'synced' : 'pending';
  }

  const normalizedPrevious = normalizeSyncStatus(previousStatus);
  if (normalizedPrevious === 'synced' && !isOnline) {
    return 'pending';
  }

  return 'synced';
}
