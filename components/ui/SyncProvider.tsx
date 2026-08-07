'use client';

import { useEffect, useRef } from 'react';
import { 
  setupNetworkListeners, 
  syncOfflineData, 
  forceFullSync, 
  updateLastSyncTimestamp, 
  isOnline,
  getSyncStats,
} from '@/lib/utils/offlineSync';
import { useBusinessSettings } from '@/lib/hooks/useBusinessSettings';

/**
 * Wires the offline-first sync engine into the app.
 *
 * ESTRATEGIA DE SINCRONIZACIÓN (bidireccional):
 * 1. PUSH (syncOfflineData): Sube los cambios locales pendientes a Supabase.
 *    - Registros creados offline → INSERT en servidor
 *    - Registros actualizados offline → UPDATE en servidor (LWW)
 *    - Registros eliminados offline → DELETE en servidor
 *
 * 2. PULL (forceFullSync): Baja datos del servidor a la base local (Dexie).
 *    - Se ejecuta en la carga inicial para poblar Dexie con datos remotos
 *    - NO sobrescribe registros con cambios locales pendientes
 *    - Se ejecuta periódicamente (cada 5 min) para mantener frescos los datos
 *
 * Esta arquitectura OFFLINE-FIRST garantiza que:
 *   - La app funciona 100% sin conexión
 *   - Los datos se sincronizan automáticamente al volver online
 *   - El motor de conflictos (LWW) resuelve ediciones concurrentes
 *   - La UI siempre lee de Dexie, no directamente de Supabase
 */
export default function SyncProvider() {
  const initializedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const { settings } = useBusinessSettings();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    setupNetworkListeners();

    const runPush = async () => {
      if (!isOnline()) return;
      try {
        const result = await syncOfflineData();
        if (result.success) {
          updateLastSyncTimestamp();
        } else if (result.errors.length > 0) {
          console.warn('Sync push completed with warnings:', result.errors);
        }
      } catch (error) {
        console.error('Sync push error:', error);
      }
    };

    const runPull = async () => {
      if (!isOnline()) return;
      try {
        const stats = await getSyncStats();
        const totalPending =
          stats.pendingProjects + stats.pendingBudgets + stats.pendingBudgetItems +
          stats.pendingTransactions + stats.pendingPayroll +
          stats.pendingWarehouse + stats.pendingClients +
          stats.pendingProjectLogs + stats.pendingSuppliers +
          stats.pendingPurchaseOrders + stats.pendingPurchaseOrderItems +
          stats.pendingDeletes;

        // Solo hacer pull completo si no hay cambios pendientes locales
        // (para no sobrescribir datos que el usuario está editando)
        if (totalPending === 0) {
          const result = await forceFullSync();
          if (result.success) {
            updateLastSyncTimestamp();
            console.log(`[Sync] pull: ${result.synced} registros actualizados desde servidor`);
          }
        } else {
          // Hay cambios pendientes: primero hacemos push de esos cambios
          await runPush();
          // Luego hacemos pull para traer datos actualizados
          const result = await forceFullSync();
          if (result.success) {
            console.log(`[Sync] pull: ${result.synced} registros sincronizados desde servidor`);
          }
        }
      } catch (error) {
        console.error('Sync pull error:', error);
      }
    };

    // Inicialización: primero PUSH (subir cambios locales), luego PULL (bajar datos remotos)
    const initialize = async () => {
      if (!isOnline()) return;
      console.log('[Sync] Inicializando sincronización bidireccional...');
      await runPush();
      await runPull();
      console.log('[Sync] Sincronización inicial completada');
    };

    initialize();

    // Re-sync cuando la pestaña recupera el foco
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Sync] Visibilidad recuperada, sincronizando...');
        runPush().then(() => runPull());
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const startInterval = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const minutes = Number(settings.syncInterval) || 5;
      const ms = Math.max(1, minutes) * 60 * 1000;
      intervalRef.current = window.setInterval(() => {
        if (isOnline()) {
          runPush().then(() => runPull());
        }
      }, ms);
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [settings.syncInterval]);

  return null;
}
