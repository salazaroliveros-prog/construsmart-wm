// Fuente de verdad para aplicar configuraciones UI al <html>
// Usada por useUISettings.tsx (al montar) y SettingsManager (al guardar)

import { UISettings, COLOR_PALETTES, GLASS_PRESETS } from '@/lib/types/uiSettings';

export function applyUISettings(settings: UISettings) {
  const palette = COLOR_PALETTES.find(p => p.id === settings.colorPalette) || COLOR_PALETTES[0];
  const glassPreset = GLASS_PRESETS.find(p => p.id === settings.glassPreset) || GLASS_PRESETS[0];

  const blur = settings.glassBlurIntensity;
  const grain = settings.glassGrainIntensity;
  const card = settings.cardTransparency;
  const border = settings.borderOpacity;
  const shadow = settings.shadowIntensity;

  const root = document.documentElement;

  root.style.setProperty('--primary-color', palette.primary);
  root.style.setProperty('--secondary-color', palette.secondary);
  root.style.setProperty('--accent-color', palette.accent);
  root.style.setProperty('--background-start', palette.backgroundStart);
  root.style.setProperty('--background-end', palette.backgroundEnd);

  root.style.setProperty('--glass-blur-intensity', `${blur}px`);
  root.style.setProperty('--glass-grain-intensity', `${grain / 100}`);
  root.style.setProperty('--card-transparency', `${card / 100}`);
  root.style.setProperty('--border-opacity', `${border / 100}`);
  root.style.setProperty('--shadow-intensity', `${shadow / 100}`);

  const dur = settings.animationSpeed === 'slow' ? '0.5s' : settings.animationSpeed === 'fast' ? '0.15s' : '0.3s';
  root.style.setProperty('--animation-duration', dur);

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = settings.themeMode === 'dark' || (settings.themeMode === 'auto' && prefersDark);
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);

  root.classList.remove('performance-high', 'performance-balanced', 'performance-low');
  root.classList.add(`performance-${settings.performanceMode}`);

  root.classList.toggle('high-contrast', settings.highContrast);
  root.classList.toggle('compact-mode', settings.compactMode);
}
