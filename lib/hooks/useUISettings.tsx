'use client';

import { useEffect } from 'react';
import { DEFAULT_UI_SETTINGS, COLOR_PALETTES, GLASS_PRESETS, UISettings } from '@/lib/types/uiSettings';

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
    const glassPreset = GLASS_PRESETS.find(p => p.id === settings.glassPreset) || GLASS_PRESETS[0];

    // Apply color palette
    document.documentElement.style.setProperty('--primary-color', palette.primary);
    document.documentElement.style.setProperty('--secondary-color', palette.secondary);
    document.documentElement.style.setProperty('--accent-color', palette.accent);
    document.documentElement.style.setProperty('--background-start', palette.backgroundStart);
    document.documentElement.style.setProperty('--background-end', palette.backgroundEnd);

    // Apply glass preset values or custom values
    const blurIntensity = settings.glassBlurIntensity;
    const grainIntensity = settings.glassGrainIntensity;
    const cardTransparency = settings.cardTransparency;
    const borderOpacity = settings.borderOpacity;
    const shadowIntensity = settings.shadowIntensity;

    // Apply CSS custom properties for dynamic values
    document.documentElement.style.setProperty('--glass-blur-intensity', `${blurIntensity}px`);
    document.documentElement.style.setProperty('--glass-grain-intensity', `${grainIntensity / 100}`);
    document.documentElement.style.setProperty('--card-transparency', `${cardTransparency / 100}`);
    document.documentElement.style.setProperty('--border-opacity', `${borderOpacity / 100}`);
    document.documentElement.style.setProperty('--shadow-intensity', `${shadowIntensity / 100}`);

    // Apply animation speed
    const animationDuration = settings.animationSpeed === 'slow' ? '0.5s' : settings.animationSpeed === 'fast' ? '0.15s' : '0.3s';
    document.documentElement.style.setProperty('--animation-duration', animationDuration);

    // Apply theme mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = settings.themeMode === 'dark' || (settings.themeMode === 'auto' && prefersDark);
    
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // Apply performance mode
    document.documentElement.classList.remove('performance-high', 'performance-balanced', 'performance-low');
    document.documentElement.classList.add(`performance-${settings.performanceMode}`);

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
