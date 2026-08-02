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

  // Si hay paleta personalizada, usarla; sino la paleta predefinida
  const primary = settings.customColors?.primary || palette.primary;
  const secondary = settings.customColors?.secondary || palette.secondary;
  const accent = settings.customColors?.accent || palette.accent;
  const backgroundStart = settings.customColors?.backgroundStart || palette.backgroundStart;
  const backgroundEnd = settings.customColors?.backgroundEnd || palette.backgroundEnd;

  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--secondary-color', secondary);
  root.style.setProperty('--accent-color', accent);
  root.style.setProperty('--background-start', backgroundStart);
  root.style.setProperty('--background-end', backgroundEnd);

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

  // Acentos de tema: border-radius, spacing, font scale
  const radiusMap: Record<string, string> = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  };
  root.style.setProperty('--theme-radius', radiusMap[settings.accents.borderRadius] || '0.75rem');

  const spacingScale = settings.accents.spacing === 'compact' ? '0.75' : settings.accents.spacing === 'relaxed' ? '1.25' : '1';
  root.style.setProperty('--theme-spacing-scale', spacingScale);

  root.classList.remove('btn-glass', 'btn-solid', 'btn-outline');
  root.classList.add(`btn-${settings.accents.buttonStyle}`);

  root.classList.remove('card-glass', 'card-solid', 'card-border');
  root.classList.add(`card-${settings.accents.cardStyle}`);

  root.style.setProperty('--theme-font-scale', String(settings.accents.fontScale));

  // Locale: data attributes para que el CSS o JS puedan usar el idioma
  root.dataset.language = settings.locale.language;
  root.dataset.region = settings.locale.region;
  root.dataset.numberFormat = settings.locale.numberFormat;

  // Dashboard: data attrs para que los componentes lean configuración de widgets
  root.dataset.dashboardWidgets = settings.dashboard.visibleWidgets.join(',');
  root.dataset.dashboardColumns = String(settings.dashboard.gridColumns);
  root.dataset.showCharts = String(settings.dashboard.showCharts);
  root.dataset.showCalendar = String(settings.dashboard.showCalendar);
  root.dataset.showStats = String(settings.dashboard.showStats);
  root.dataset.showBudgetSummary = String(settings.dashboard.showBudgetSummary);
}

