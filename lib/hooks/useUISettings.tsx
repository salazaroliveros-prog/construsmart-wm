'use client';

import { useEffect } from 'react';
import { DEFAULT_UI_SETTINGS, UISettings } from '@/lib/types/uiSettings';
import { applyUISettings } from '@/lib/utils/applySettings';

export function useUISettings() {
  useEffect(() => {
    loadAndApplySettings();
  }, []);

  const loadAndApplySettings = () => {
    try {
      const saved = localStorage.getItem('uiSettings');
      const settings: UISettings = saved ? JSON.parse(saved) : DEFAULT_UI_SETTINGS;
      applyUISettings(settings);
    } catch {
      applyUISettings(DEFAULT_UI_SETTINGS);
    }
  };
}

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  useUISettings();
  return <>{children}</>;
}
