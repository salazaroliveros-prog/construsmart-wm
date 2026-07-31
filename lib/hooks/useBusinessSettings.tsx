'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_UI_SETTINGS, UISettings, CompanySettings, FinancialSettings, ExportSettings } from '@/lib/types/uiSettings';

export function useBusinessSettings() {
  const [settings, setSettings] = useState<UISettings>(DEFAULT_UI_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('uiSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (newSettings: Partial<UISettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      localStorage.setItem('uiSettings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating business settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    // Convenience getters
    company: settings.company,
    financial: settings.financial,
    export: settings.export,
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
