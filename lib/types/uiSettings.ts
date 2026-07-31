export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  backgroundStart: string;
  backgroundEnd: string;
}

export interface UISettings {
  colorPalette: string;
  cardTransparency: number; // 0-100
  glassBlurIntensity: number; // 0-100
  glassGrainIntensity: number; // 0-100
  borderOpacity: number; // 0-100
  shadowIntensity: number; // 0-100
  animationSpeed: 'slow' | 'normal' | 'fast';
  compactMode: boolean;
  highContrast: boolean;
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  colorPalette: 'default',
  cardTransparency: 55,
  glassBlurIntensity: 100,
  glassGrainIntensity: 40,
  borderOpacity: 12,
  shadowIntensity: 60,
  animationSpeed: 'normal',
  compactMode: false,
  highContrast: false,
};

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'default',
    name: 'Cyber Blue',
    primary: '#06b6d4',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    backgroundStart: '#0f172a',
    backgroundEnd: '#1e293b',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    backgroundStart: '#064e3b',
    backgroundEnd: '#065f46',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#fb923c',
    backgroundStart: '#431407',
    backgroundEnd: '#7c2d12',
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    backgroundStart: '#2e1065',
    backgroundEnd: '#4c1d95',
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primary: '#f43f5e',
    secondary: '#e11d48',
    accent: '#fb7185',
    backgroundStart: '#881337',
    backgroundEnd: '#9f1239',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#38bdf8',
    backgroundStart: '#0c4a6e',
    backgroundEnd: '#075985',
  },
];
