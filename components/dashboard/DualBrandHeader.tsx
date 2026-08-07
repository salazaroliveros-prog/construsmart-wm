'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Calendar, Clock, Wifi, WifiOff, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import FloatingCalendar from '@/components/ui/FloatingCalendar';
import { useAuth } from '@/lib/auth/auth-context';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import { getSyncStats, syncOfflineData, forceFullSync } from '@/lib/utils/offlineSync';

interface DualBrandHeaderProps {
  onMenuToggle?: () => void;
}

export default function DualBrandHeader({ onMenuToggle }: DualBrandHeaderProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { phase, lastSyncAt, errorMessage, startSync, finishSync } = useSyncStatus();
  const [manualSyncLoading, setManualSyncLoading] = useState(false);

  const handleManualSync = useCallback(async () => {
    if (!isOnline || manualSyncLoading) return;
    setManualSyncLoading(true);
    startSync();
    try {
      const pushResult = await syncOfflineData();
      const pullResult = await forceFullSync();
      const success = pushResult.success && pullResult.success;
      const errors = [...pushResult.errors, ...pullResult.errors];
      finishSync(success, errors.length > 0 ? errors.join('; ') : undefined);
    } catch (error) {
      finishSync(false, error instanceof Error ? error.message : String(error));
    } finally {
      setManualSyncLoading(false);
    }
  }, [isOnline, manualSyncLoading, startSync, finishSync]);

  useEffect(() => {
    setIsMounted(true);
    setIsClient(true);
    setCurrentTime(new Date());
    
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const stats = await getSyncStats();
        setPendingCount(
          stats.pendingProjects + stats.pendingBudgets + stats.pendingBudgetItems + stats.pendingTransactions +
          stats.pendingPayroll + stats.pendingWarehouse + stats.pendingClients + stats.pendingProjectLogs +
          stats.pendingSuppliers + stats.pendingPurchaseOrders + stats.pendingPurchaseOrderItems +
          stats.pendingSubcontractors + stats.pendingDeletes
        );
      } catch (error) {
        console.error('Error loading sync stats:', error);
      }
    };

    loadPending();

    const intervalId = window.setInterval(loadPending, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (phase === 'synced' || phase === 'error') {
      const refreshPending = async () => {
        try {
          const stats = await getSyncStats();
          setPendingCount(
            stats.pendingProjects + stats.pendingBudgets + stats.pendingBudgetItems + stats.pendingTransactions +
            stats.pendingPayroll + stats.pendingWarehouse + stats.pendingClients + stats.pendingProjectLogs +
            stats.pendingSuppliers + stats.pendingPurchaseOrders + stats.pendingPurchaseOrderItems + stats.pendingDeletes
          );
        } catch (error) {
          console.error('Error refreshing sync stats:', error);
        }
      };
      refreshPending();
    }
  }, [phase]);

  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  return (
<header className="glass-panel border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="hidden sm:block flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white truncate">CONSTRUCTORA WM/M&amp;S</h1>
            <p className="text-[10px] sm:text-xs text-cyan-400 italic truncate">
              "CONSTRUYENDO EL FUTURO"
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isClient && isMounted && currentTime && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            title="Ver calendario"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-sm">
              {currentTime.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-sm">{formatTime(currentTime)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 active:bg-emerald-500/30 transition-colors">
          {isOnline ? (
            <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
          )}
          <span className="text-[10px] sm:text-xs font-medium text-emerald-300 hidden sm:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-white text-[10px] sm:text-xs">
          {phase === 'syncing' ? (
            <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-300 animate-spin" />
          ) : phase === 'error' ? (
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
          )}
          <div className="hidden sm:flex flex-col gap-0">
            <span className="font-medium">
              {phase === 'syncing'
                ? 'Sincronizando...'
                : phase === 'error'
                ? 'Sync fallida'
                : pendingCount > 0
                ? `${pendingCount} pendientes`
                : 'Sincronizado'}
            </span>
            {lastSyncAt && phase !== 'syncing' ? (
              <span className="text-[10px] text-white/50">
                {new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSyncAt))}
              </span>
            ) : null}
            {phase === 'error' && errorMessage ? (
              <span className="text-[10px] text-rose-300 truncate max-w-[12rem]" title={errorMessage}>
                {errorMessage}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualSync}
          disabled={!isOnline || manualSyncLoading}
          className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-200 text-[10px] sm:text-xs hover:bg-cyan-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          title={isOnline ? 'Sincronizar ahora' : 'Conéctese a internet para sincronizar'}
        >
          <RefreshCcw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${manualSyncLoading ? 'animate-spin' : 'text-cyan-200'}`} />
          <span>{manualSyncLoading ? 'Sincronizando' : 'Sincronizar'}</span>
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border-2 border-cyan-500/50 overflow-hidden active:scale-95 transition-transform">
            <UserAvatar size="sm" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>
      </div>

      {/* Floating Calendar */}
      <FloatingCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        triggerDate={currentTime || undefined}
      />
    </header>
  );
}
