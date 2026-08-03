export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  backgroundStart: string;
  backgroundEnd: string;
}

export interface GlassPreset {
  id: string;
  name: string;
  description: string;
  cardTransparency: number;
  glassBlurIntensity: number;
  glassGrainIntensity: number;
  borderOpacity: number;
  shadowIntensity: number;
}

export interface CompanySettings {
  name: string;
  shortName: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

export interface FinancialSettings {
  currency: 'GTQ' | 'USD' | 'EUR';
  currencySymbol: string;
  vatRate: number; // IVA percentage
  profitMargin: number; // Default profit margin percentage
  includeVatInPrices: boolean;
  indirectPercentage: number; // Indirect costs percentage
  contingencyPercentage: number; // Contingency percentage
  profitPercentage: number; // Target profit percentage
}

export interface ExportSettings {
  pdfIncludeLogo: boolean;
  pdfIncludeSignature: boolean;
  pdfIncludeDetailedBreakdown: boolean;
  csvDelimiter: ',' | ';';
  csvIncludeHeaders: boolean;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

export interface DashboardSettings {
  visibleWidgets: string[];
  widgetOrder: string[];
  gridColumns: 1 | 2 | 3 | 4;
  showCharts: boolean;
  showCalendar: boolean;
  showStats: boolean;
  showBudgetSummary: boolean;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  notifyOnSyncComplete: boolean;
  notifyOnError: boolean;
  notifyOnNewProject: boolean;
  notifyOnLowStock: boolean;
  notifyOnBudgetExceeded: boolean;
  notifyOnPayrollDue: boolean;
}

export interface ThemeAccentSettings {
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  spacing: 'compact' | 'normal' | 'relaxed';
  buttonStyle: 'glass' | 'solid' | 'outline';
  cardStyle: 'glass' | 'solid' | 'border';
  fontScale: 0.875 | 1 | 1.125;
}

export interface LocaleSettings {
  language: 'es' | 'en';
  region: 'GT' | 'US' | 'EU';
  timezone: string;
  firstDayOfWeek: 0 | 1; // 0=Sunday, 1=Monday
  numberFormat: 'es-GT' | 'en-US' | 'de-DE';
}

export interface UISettings {
  // Appearance
  colorPalette: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    backgroundStart?: string;
    backgroundEnd?: string;
  };
  glassPreset: string;
  themeMode: 'dark' | 'light' | 'auto';
  cardTransparency: number; // 0-100
  glassBlurIntensity: number; // 0-100
  glassGrainIntensity: number; // 0-100
  borderOpacity: number; // 0-100
  shadowIntensity: number; // 0-100
  animationSpeed: 'slow' | 'normal' | 'fast';
  compactMode: boolean;
  highContrast: boolean;
  performanceMode: 'high' | 'balanced' | 'low';
  
  // Business Settings
  company: CompanySettings;
  financial: FinancialSettings;
  export: ExportSettings;
  
  // Sync Settings
  autoSync: boolean;
  syncInterval: number; // minutes
  
  // NEW: Dashboard customization
  dashboard: DashboardSettings;
  
  // NEW: Notifications
  notifications: NotificationSettings;
  
  // NEW: Theme Accents
  accents: ThemeAccentSettings;
  
  // NEW: Locale
  locale: LocaleSettings;
}

export const GLASS_PRESETS: GlassPreset[] = [
  {
    id: 'default',
    name: 'Estándar',
    description: 'Balance óptimo entre estética y rendimiento',
    cardTransparency: 55,
    glassBlurIntensity: 100,
    glassGrainIntensity: 40,
    borderOpacity: 12,
    shadowIntensity: 60,
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Efectos sutiles para máxima claridad',
    cardTransparency: 70,
    glassBlurIntensity: 50,
    glassGrainIntensity: 20,
    borderOpacity: 8,
    shadowIntensity: 40,
  },
  {
    id: 'frosted',
    name: 'Escarchado',
    description: 'Desenfoque intenso con alta transparencia',
    cardTransparency: 40,
    glassBlurIntensity: 150,
    glassGrainIntensity: 60,
    borderOpacity: 15,
    shadowIntensity: 80,
  },
  {
    id: 'glass',
    name: 'Cristal Puro',
    description: 'Efecto de cristal realista con máxima profundidad',
    cardTransparency: 30,
    glassBlurIntensity: 200,
    glassGrainIntensity: 80,
    borderOpacity: 20,
    shadowIntensity: 100,
  },
  {
    id: 'performance',
    name: 'Alto Rendimiento',
    description: 'Sin desenfoque para máxima velocidad',
    cardTransparency: 85,
    glassBlurIntensity: 0,
    glassGrainIntensity: 0,
    borderOpacity: 10,
    shadowIntensity: 30,
  },
];

export const DEFAULT_UI_SETTINGS: UISettings = {
  // Appearance
  colorPalette: 'default',
  glassPreset: 'default',
  themeMode: 'dark',
  cardTransparency: 55,
  glassBlurIntensity: 100,
  glassGrainIntensity: 40,
  borderOpacity: 12,
  shadowIntensity: 60,
  animationSpeed: 'normal',
  compactMode: false,
  highContrast: false,
  performanceMode: 'balanced',
  
  // Business Settings
  company: {
    name: 'CONSTRUCTORA WM/M&S',
    shortName: 'WM/M&S',
    nit: '',
    address: '',
    phone: '',
    email: 'info@constructora-wm.com',
    logoUrl: '',
  },
  financial: {
    currency: 'GTQ',
    currencySymbol: 'Q.',
    vatRate: 12,
    profitMargin: 20,
    includeVatInPrices: false,
    indirectPercentage: 15,
    contingencyPercentage: 10,
    profitPercentage: 20,
  },
  export: {
    pdfIncludeLogo: true,
    pdfIncludeSignature: false,
    pdfIncludeDetailedBreakdown: true,
    csvDelimiter: ',',
    csvIncludeHeaders: true,
    dateFormat: 'DD/MM/YYYY',
  },
  
  // Sync Settings
  autoSync: true,
  syncInterval: 5,

  // Dashboard customization
  dashboard: {
    visibleWidgets: ['stats', 'charts', 'budget'],
    widgetOrder: ['stats', 'charts', 'budget'],
    gridColumns: 2,
    showCharts: true,
    showCalendar: false,
    showStats: true,
    showBudgetSummary: true,
  },

  // Notifications
  notifications: {
    pushEnabled: false,
    emailEnabled: false,
    inAppEnabled: true,
    notifyOnSyncComplete: true,
    notifyOnError: true,
    notifyOnNewProject: true,
    notifyOnLowStock: true,
    notifyOnBudgetExceeded: true,
    notifyOnPayrollDue: true,
  },

  // Theme Accents
  accents: {
    borderRadius: 'lg',
    spacing: 'normal',
    buttonStyle: 'glass',
    cardStyle: 'glass',
    fontScale: 1,
  },

  // Locale
  locale: {
    language: 'es',
    region: 'GT',
    timezone: 'America/Guatemala',
    firstDayOfWeek: 1,
    numberFormat: 'es-GT',
  },
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
