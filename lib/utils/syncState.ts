export type SyncStatusValue = 'synced' | 'created_offline' | 'updated_offline' | 'syncing' | 'pending' | 'sync_failed';

export function normalizeSyncStatus(value?: string | null): SyncStatusValue {
  if (!value) return 'synced';

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'synced':
    case 'created_offline':
    case 'updated_offline':
    case 'syncing':
    case 'pending':
    case 'sync_failed':
      return normalized as SyncStatusValue;
    case 'error': // Legacy mapping
      return 'sync_failed';
    default:
      return 'synced';
  }
}

export function isPendingSyncStatus(status?: string | null): boolean {
  const normalized = normalizeSyncStatus(status);
  return normalized === 'pending' || normalized === 'syncing' || normalized === 'sync_failed';
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
    return isOnline ? 'synced' : 'created_offline';
  }

  const normalizedPrevious = normalizeSyncStatus(previousStatus);
  if (normalizedPrevious === 'synced' && !isOnline) {
    return 'updated_offline';
  }

  return 'synced';
}
