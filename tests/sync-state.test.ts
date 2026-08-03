import { describe, it, expect } from 'vitest';
import { normalizeSyncStatus, resolveSyncStatus, isPendingSyncStatus } from '../lib/utils/syncState';

describe('sync-state helpers', () => {
  it('normaliza estados de sincronización a un formato consistente', () => {
    expect(normalizeSyncStatus('PENDING')).toBe('pending');
    expect(normalizeSyncStatus('Synced')).toBe('synced');
    expect(normalizeSyncStatus(undefined)).toBe('synced');
    expect(normalizeSyncStatus('sync_failed')).toBe('sync_failed');
  });

  it('resuelve el estado correcto para operaciones nuevas y actualizaciones', () => {
    expect(resolveSyncStatus({ isNewRecord: true, isOnline: true })).toBe('synced');
    expect(resolveSyncStatus({ isNewRecord: true, isOnline: false })).toBe('created_offline');
    expect(resolveSyncStatus({ isNewRecord: false, previousStatus: 'synced', isOnline: false })).toBe('updated_offline');
    expect(resolveSyncStatus({ isNewRecord: false, previousStatus: 'synced', isOnline: true })).toBe('synced');
  });

  it('detecta correctamente los estados pendientes', () => {
    expect(isPendingSyncStatus('created_offline')).toBe(true);
    expect(isPendingSyncStatus('updated_offline')).toBe(true);
    expect(isPendingSyncStatus('pending')).toBe(true);
    expect(isPendingSyncStatus('synced')).toBe(false);
  });
});
