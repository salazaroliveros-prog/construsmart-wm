'use client';

import { useEffect, useRef } from 'react';

/**
 * Refresca la vista cuando RealtimeProvider aplica un cambio en una de las
 * tablas indicadas (cambio hecho por otro dispositivo). Los loaders de cada
 * módulo leen de Dexie, así que volver a llamarlos refleja el dato al instante.
 */
export function useRealtimeRefresh(tables: string[], onRefresh: () => void) {
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { table?: string } | undefined;
      if (!detail?.table) return;
      if (tables.includes(detail.table)) cbRef.current();
    };

    window.addEventListener('wm-dexie-changed', handler);
    return () => window.removeEventListener('wm-dexie-changed', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(',')]);
}
