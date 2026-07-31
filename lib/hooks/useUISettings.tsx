'use client';

import { useEffect } from 'react';
import { DEFAULT_UI_SETTINGS, COLOR_PALETTES, UISettings } from '@/lib/types/uiSettings';

export function useUISettings() {
  useEffect(() => {
    loadAndApplySettings();
  }, []);

  const loadAndApplySettings = () => {
    try {
      const saved = localStorage.getItem('uiSettings');
      const settings: UISettings = saved ? JSON.parse(saved) : DEFAULT_UI_SETTINGS;
      applySettings(settings);
    } catch (error) {
      console.error('Error loading UI settings:', error);
      applySettings(DEFAULT_UI_SETTINGS);
    }
  };

  const applySettings = (settings: UISettings) => {
    const palette = COLOR_PALETTES.find(p => p.id === settings.colorPalette) || COLOR_PALETTES[0];

    // Apply color palette
    document.documentElement.style.setProperty('--primary-color', palette.primary);
    document.documentElement.style.setProperty('--secondary-color', palette.secondary);
    document.documentElement.style.setProperty('--accent-color', palette.accent);
    document.documentElement.style.setProperty('--background-start', palette.backgroundStart);
    document.documentElement.style.setProperty('--background-end', palette.backgroundEnd);

    // Apply CSS custom properties for dynamic values
    document.documentElement.style.setProperty('--glass-blur-intensity', `${settings.glassBlurIntensity}px`);
    document.documentElement.style.setProperty('--glass-grain-intensity', `${settings.glassGrainIntensity / 100}`);
    document.documentElement.style.setProperty('--card-transparency', `${settings.cardTransparency / 100}`);
    document.documentElement.style.setProperty('--border-opacity', `${settings.borderOpacity / 100}`);
    document.documentElement.style.setProperty('--shadow-intensity', `${settings.shadowIntensity / 100}`);

    // Apply animation speed
    const animationDuration = settings.animationSpeed === 'slow' ? '0.5s' : settings.animationSpeed === 'fast' ? '0.15s' : '0.3s';
    document.documentElement.style.setProperty('--animation-duration', animationDuration);

    // Apply accessibility modes
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (settings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  };
}

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  useUISettings();
  return <>{children}</>;
}
