'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_UI_SETTINGS, UISettings, CompanySettings, FinancialSettings, ExportSettings } from '@/lib/types/uiSettings';
import { calculateUtilityMargin } from '@/lib/calculators/utilityMargin';

// Módulo-singleton para evitar múltiples lecturas de localStorage y múltiples
// instancias de estado cuando varios componentes usan useBusinessSettings.
// Esto corrige la duplicación del hook (punto 6.3): ahora todos los hooks
// derivados (useCompanySettings, useFinancialSettings, useExportSettings)
// comparten una única fuente de verdad en memoria.
const SETTINGS_CACHE: { settings: UISettings; listeners: Set<() => void> } = {
  settings: DEFAULT_UI_SETTINGS,
  listeners: new Set(),
};

function notifyListeners() {
  SETTINGS_CACHE.listeners.forEach((listener) => listener());
}

// Deep merge para que las secciones anidadas (company, financial, export,
// dashboard, notifications, accents, locale) conserven defaults cuando el
// localStorage guardado es de una versión anterior sin esos campos.
function deepMerge<T>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override || {})) {
    const baseVal = (base as Record<string, unknown>)[key];
    const overrideVal = (override as Record<string, unknown>)[key];
    if (
      baseVal && overrideVal &&
      typeof baseVal === 'object' && typeof overrideVal === 'object' &&
      !Array.isArray(baseVal) && !Array.isArray(overrideVal)
    ) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

function loadSettingsFromStorage(): UISettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_UI_SETTINGS;
    const saved = localStorage.getItem('uiSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return deepMerge(DEFAULT_UI_SETTINGS, parsed);
    }
  } catch (error) {
    console.error('Error loading business settings:', error);
  }
  return DEFAULT_UI_SETTINGS;
}

function updateSettingsInStorage(newSettings: UISettings) {
  try {
    SETTINGS_CACHE.settings = newSettings;
    localStorage.setItem('uiSettings', JSON.stringify(newSettings));
    notifyListeners();
  } catch (error) {
    console.error('Error updating business settings:', error);
  }
}

// Exportada para que SettingsManager pueda notificar al singleton
// tras guardar cambios desde el módulo de ajustes.
export function updateSettingsSingleton(newSettings: UISettings) {
  updateSettingsInStorage(newSettings);
}

export function useBusinessSettings() {
  const [settings, setSettings] = useState<UISettings>(SETTINGS_CACHE.settings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializa el singleton desde localStorage solo una vez
    const initial = loadSettingsFromStorage();
    SETTINGS_CACHE.settings = initial;
    setSettings(initial);
    setIsLoading(false);

    // Se suscribe a cambios del singleton
    const listener = () => setSettings(SETTINGS_CACHE.settings);
    SETTINGS_CACHE.listeners.add(listener);
    return () => {
      SETTINGS_CACHE.listeners.delete(listener);
    };
  }, []);

  const updateSettings = (newSettings: Partial<UISettings>) => {
    const updated = deepMerge(SETTINGS_CACHE.settings, newSettings);
    updateSettingsInStorage(updated);
  };

  return {
    settings,
    isLoading,
    updateSettings,
    // Convenience getters
    company: settings.company,
    financial: settings.financial,
    export: settings.export,
    dashboard: settings.dashboard,
    notifications: settings.notifications,
    accents: settings.accents,
    locale: settings.locale,
  };
}

export function useCompanySettings() {
  const { settings, isLoading, updateSettings } = useBusinessSettings();
  
  const updateCompany = (updates: Partial<CompanySettings>) => {
    updateSettings({
      company: { ...settings.company, ...updates }
    });
  };

  return {
    company: settings.company,
    isLoading,
    updateCompany,
  };
}

export function useFinancialSettings() {
  const { settings, isLoading, updateSettings } = useBusinessSettings();
  
  const updateFinancial = (updates: Partial<FinancialSettings>) => {
    updateSettings({
      financial: { ...settings.financial, ...updates }
    });
  };

  return {
    financial: settings.financial,
    isLoading,
    updateFinancial,
  };
}

export function useExportSettings() {
  const { settings, isLoading, updateSettings } = useBusinessSettings();
  
  const updateExport = (updates: Partial<ExportSettings>) => {
    updateSettings({
      export: { ...settings.export, ...updates }
    });
  };

  return {
    export: settings.export,
    isLoading,
    updateExport,
  };
}

// Helper function to format currency based on settings
export function formatCurrency(amount: number, settings?: FinancialSettings): string {
  const financial = settings || DEFAULT_UI_SETTINGS.financial;
  const symbol = financial.currencySymbol;
  const formatted = amount.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

// Helper function to format date based on settings
export function formatDate(date: Date | string, settings?: ExportSettings): string {
  const exportSettings = settings || DEFAULT_UI_SETTINGS.export;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const format = exportSettings.dateFormat;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

// Helper function to calculate price with VAT
export function calculatePriceWithVAT(basePrice: number, settings?: FinancialSettings): number {
  const financial = settings || DEFAULT_UI_SETTINGS.financial;
  if (financial.includeVatInPrices) {
    return basePrice * (1 + financial.vatRate / 100);
  }
  return basePrice;
}

// Helper function to calculate price with profit margin
export function calculatePriceWithMargin(basePrice: number, settings?: FinancialSettings): number {
  const financial = settings || DEFAULT_UI_SETTINGS.financial;
  return basePrice * (1 + financial.profitMargin / 100);
}

// CORRECCIÓN: Eliminado helper redundante - usar calculateUtilityMargin directamente desde lib/calculators/utilityMargin.ts
// Esto asegura una sola fuente de verdad para cálculos de utilidad
