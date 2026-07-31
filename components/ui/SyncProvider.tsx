'use client';

import { useEffect } from 'react';
import { setupNetworkListeners, syncOfflineData, updateLastSyncTimestamp, isOnline } from '@/lib/utils/offlineSync';

/**
 * Wires the offline-first sync engine into the app.
 * Runs an initial sync on mount, re-syncs when the browser comes back online,
 * when the tab becomes visible again and on a periodic interval so records
 * created/edited offline eventually reach Supabase.
 */
export default function SyncProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setupNetworkListeners();

    const runSync = async () => {
      if (!isOnline()) return;
      try {
        const result = await syncOfflineData();
        if (result.success) {
          updateLastSyncTimestamp();
        } else if (result.errors.length > 0) {
          console.warn('Sync completed with warnings:', result.errors);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    };

    // Initial sync after the app loads
    runSync();

    // Re-sync when the tab regains focus
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runSync();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic sync as a safety net for offline mutations
    const intervalId = window.setInterval(runSync, 60_000);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}
