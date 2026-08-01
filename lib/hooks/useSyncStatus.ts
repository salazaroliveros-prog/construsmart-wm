'use client';

import { useState, useEffect, useCallback } from 'react';

type SyncPhase = 'idle' | 'syncing' | 'synced' | 'error';

export function useSyncStatus() {
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startSync = useCallback(() => {
    setPhase('syncing');
    setErrorMessage(null);
  }, []);

  const finishSync = useCallback((ok: boolean, error?: string) => {
    if (ok) {
      setPhase('synced');
      setLastSyncAt(Date.now());
      setTimeout(() => setPhase('idle'), 2000);
      setErrorMessage(null);
    } else {
      setPhase('error');
      setErrorMessage(error ?? 'Error de sincronización');
    }
  }, []);

  useEffect(() => {
    const onStart = () => startSync();
    const onEnd = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      finishSync(detail?.ok ?? false, detail?.error);
    };

    window.addEventListener('wm-sync-start', onStart);
    window.addEventListener('wm-sync-end', onEnd);

    return () => {
      window.removeEventListener('wm-sync-start', onStart);
      window.removeEventListener('wm-sync-end', onEnd);
    };
  }, [startSync, finishSync]);

  return { phase, lastSyncAt, errorMessage, startSync, finishSync };
}
