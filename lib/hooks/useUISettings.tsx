'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_UI_SETTINGS, UISettings } from '@/lib/types/uiSettings';
import { applyUISettings } from '@/lib/utils/applySettings';

export function useUISettings() {
  const pathname = usePathname();
  const lastAppliedRef = useRef('');

  useEffect(() => {
    loadAndApplySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const loadAndApplySettings = () => {
    try {
      const saved = localStorage.getItem('uiSettings');
      const settings: UISettings = saved ? JSON.parse(saved) : DEFAULT_UI_SETTINGS;
      applyUISettings(settings);
    } catch {
      applyUISettings(DEFAULT_UI_SETTINGS);
    }
  };

  // Re-aplicar ajustes cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleFocus = () => loadAndApplySettings();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  useUISettings();
  return <>{children}</>;
}

