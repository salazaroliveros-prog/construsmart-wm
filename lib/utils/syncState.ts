export type SyncStatusValue = 'synced' | 'created_offline' | 'updated_offline' | 'pending' | 'sync_failed';

export function normalizeSyncStatus(value?: string | null): SyncStatusValue {
  if (!value) return 'synced';

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'created_offline':
    case 'updated_offline':
    case 'sync_failed':
    case 'synced':
      return normalized as SyncStatusValue;
    default:
      return 'synced';
  }
}

export function isPendingSyncStatus(status?: string | null): boolean {
  const normalized = normalizeSyncStatus(status);
  return normalized === 'created_offline' || normalized === 'updated_offline' || normalized === 'pending';
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
}: ResolveSyncStatusOptions): 'synced' | 'created_offline' | 'updated_offline' {
  if (isNewRecord) {
    return isOnline ? 'synced' : 'created_offline';
  }

  const normalizedPrevious = normalizeSyncStatus(previousStatus);
  if (normalizedPrevious === 'synced' && !isOnline) {
    return 'updated_offline';
  }

  return 'synced';
}
