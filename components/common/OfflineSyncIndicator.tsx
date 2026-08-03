/**
 * CONSTRUCTORA WM/M&S - OFFLINE SYNC INDICATOR
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Non-blocking UI indicator for sync status
 * Shows network state and sync progress without blocking user interactions
 */

'use client';

import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SyncStatus {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncProgress: number;
}

export const OfflineSyncIndicator = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    syncStatus: 'idle',
    syncProgress: 0
  });

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for custom sync events from offlineSync
  useEffect(() => {
    const handleSyncStart = () => {
      setSyncStatus(prev => ({ ...prev, syncStatus: 'syncing', syncProgress: 0 }));
    };

    const handleSyncProgress = (event: CustomEvent) => {
      setSyncStatus(prev => ({ 
        ...prev, 
        syncProgress: event.detail.progress 
      }));
    };

    const handleSyncComplete = () => {
      setSyncStatus(prev => ({ ...prev, syncStatus: 'synced', syncProgress: 100 }));
    };

    const handleSyncError = () => {
      setSyncStatus(prev => ({ ...prev, syncStatus: 'error' }));
    };

    window.addEventListener('syncStart', handleSyncStart as EventListener);
    window.addEventListener('syncProgress', handleSyncProgress as EventListener);
    window.addEventListener('syncComplete', handleSyncComplete as EventListener);
    window.addEventListener('syncError', handleSyncError as EventListener);

    return () => {
      window.removeEventListener('syncStart', handleSyncStart as EventListener);
      window.removeEventListener('syncProgress', handleSyncProgress as EventListener);
      window.removeEventListener('syncComplete', handleSyncComplete as EventListener);
      window.removeEventListener('syncError', handleSyncError as EventListener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`glass-card px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 ${
        !syncStatus.isOnline 
          ? 'border-amber-500/50 bg-amber-500/10' 
          : syncStatus.syncStatus === 'syncing'
            ? 'border-cyan-500/50 bg-cyan-500/10'
            : 'border-emerald-500/50 bg-emerald-500/10'
      }`}>
        {syncStatus.isOnline ? (
          <>
            {syncStatus.syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-white/70 text-xs font-medium">
                  Sincronizando... {syncStatus.syncProgress}%
                </span>
              </>
            ) : syncStatus.syncStatus === 'error' ? (
              <>
                <CloudOff className="w-4 h-4 text-red-400" />
                <span className="text-white/70 text-xs font-medium">Error de sincronización</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span className="text-white/70 text-xs font-medium">Sincronizado</span>
              </>
            )}
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4 text-amber-400" />
            <span className="text-white/70 text-xs font-medium">Sin conexión</span>
          </>
        )}
      </div>
    </div>
  );
};
