// App Configuration
// This file centralizes all app-wide configuration constants
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"

function getBaseUrl(): string {
  // En el cliente, usar el origen de la ventana
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // En el servidor, usar la variable de entorno (sin fallback hardcodeado)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!envUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL no está configurada. ' +
      'Agrégala en tu archivo .env o en las variables de entorno de Vercel.'
    );
  }
  return envUrl;
}

// Guatemala Monetary Standards & Construction Cost Matrices
export const GUATEMALA_CONFIG = {
  currency: {
    code: 'GTQ',
    symbol: 'Q.',
    name: 'Quetzal',
    decimalPlaces: 2
  },
  
  // Cost matrices per m² based on quality level
  costMatrices: {
    basic: { min: 3000, max: 3500, label: 'Básico (Q.3,000-3,500/m²)' },
    moderate: { min: 3500, max: 4000, label: 'Moderado (Q.3,500-4,000/m²)' },
    premium: { min: 4000, max: 5000, label: 'Premium (Q.4,000-5,000/m²)' }
  },
  
  // Tax structures
  taxes: {
    iva: 0.12, // 12% IVA
    isr_corporate: 0.25, // 25% ISR for corporations
    isr_individual: 0.05, // 5% ISR for individuals
    retention_rate: 0.10 // 10% retention rate
  },
  
  // Labor regulations
  labor: {
    igss_rate: 0.0483, // 4.83% IGSS employer contribution
    aguinaldo_months: 14, // 14 months for aguinaldo calculation
    vacaciones_rate: 0.0833, // 8.33% for vacaciones provision
    max_overtime_rate: 2.0, // Maximum overtime rate multiplier
    standard_work_hours: 8 // Standard work hours per day
  }
} as const;

// Global business parameters
export const BUSINESS_CONFIG = {
  // Default profit margins by project typology
  defaultProfitMargins: {
    residential: 0.15, // 15%
    commercial: 0.18, // 18%
    industrial: 0.20, // 20%
    civil: 0.12, // 12%
    public: 0.10 // 10%
  },
  
  // Default contingency percentages
  defaultContingency: {
    residential: 0.05, // 5%
    commercial: 0.07, // 7%
    industrial: 0.08, // 8%
    civil: 0.06, // 6%
    public: 0.10 // 10%
  },
  
  // Default indirect cost percentages
  defaultIndirect: {
    residential: 0.12, // 12%
    commercial: 0.15, // 15%
    industrial: 0.18, // 18%
    civil: 0.10, // 10%
    public: 0.08 // 8%
  },
  
  // Automatic stock depletion tolerances
  stockManagement: {
    reorder_threshold: 0.20, // 20% threshold for auto-reorder
    safety_stock_percentage: 0.15, // 15% safety stock
    max_order_quantity_multiplier: 3.0, // Maximum order = 3x typical usage
    auto_po_enabled: true // Enable auto-generate purchase orders
  },
  
  // Project timeline tolerances
  timelineManagement: {
    buffer_percentage: 0.10, // 10% buffer for completion estimates
    warning_threshold_days: 7, // Warning if less than 7 days buffer
    critical_threshold_days: 3 // Critical if less than 3 days buffer
  },
  
  // Labor cost overrun thresholds
  laborOverrun: {
    warning_threshold: 1.10, // 10% over budget triggers warning
    critical_threshold: 1.20, // 20% over budget triggers critical alert
    overtime_daily_limit: 4, // Max 4 hours overtime per day
    overtime_weekly_limit: 12 // Max 12 hours overtime per week
  }
} as const;

// Email de administrador por defecto (centralizado). Se resuelve en este orden:
// 1) NEXT_PUBLIC_ADMIN_EMAIL (cliente y servidor)
// 2) ADMIN_EMAIL (compatibilidad)
// 3) Fallback local.
export function getAdminEmail(): string {
  if (typeof process !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      'salazaroliveros@gmail.com'
    );
  }
  return 'salazaroliveros@gmail.com';
}

export const DEFAULT_ADMIN_EMAIL = getAdminEmail();

export const APP_CONFIG = {
  // The production URL of the application
  // This is set via environment variable NEXT_PUBLIC_APP_URL
  url: getBaseUrl(),
  
  // App metadata
  name: 'CONSTRUCTORA WM/M&S',
  shortName: 'WM/M&S ERP',
  description: 'Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera. "CONSTRUYENDO EL FUTURO"',
  
  // SEO keywords
  keywords: ['construcción', 'ERP', 'presupuestos', 'gestión de proyectos', 'control de costos', 'obras', 'constructora'] as string[],
  
  // Contact info (can be expanded)
  email: 'info@constructora-wm.com',
  
  // Social media (can be expanded)
  social: {
    twitter: '@constructora_wm',
    linkedin: 'constructora-wm',
  },
  
  // Nested configurations
  guatemala: GUATEMALA_CONFIG,
  business: BUSINESS_CONFIG
} as const;

// Helper function to get the full URL for a path
export function getFullPath(path: string = ''): string {
  const baseUrl = APP_CONFIG.url;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Helper function to format currency in GTQ
export function formatGTQ(amount: number): string {
  return `${GUATEMALA_CONFIG.currency.symbol}${amount.toFixed(GUATEMALA_CONFIG.currency.decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Helper function to check if budget exceeds quality tier
export function checkBudgetMarginWarning(
  areaM2: number,
  totalBudget: number,
  qualityLevel: 'basic' | 'moderate' | 'premium'
): { exceeds: boolean; marginPercentage: number; recommendedMargin: string } {
  const costMatrix = GUATEMALA_CONFIG.costMatrices[qualityLevel];
  const costPerM2 = totalBudget / areaM2;
  
  const marginPercentage = ((costPerM2 - costMatrix.min) / (costMatrix.max - costMatrix.min)) * 100;
  const exceeds = costPerM2 > costMatrix.max;
  
  return {
    exceeds,
    marginPercentage: Math.min(100, Math.max(0, marginPercentage)),
    recommendedMargin: `${formatGTQ(costMatrix.min)} - ${formatGTQ(costMatrix.max)}/m²`
  };
}

// Helper function to calculate completion buffer days
export function calculateCompletionBuffer(
  estimatedEndDate: string,
  currentDate: Date = new Date()
): number {
  const endDate = new Date(estimatedEndDate);
  const diffMs = endDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper function to determine buffer severity
export function getBufferSeverity(bufferDays: number): 'safe' | 'warning' | 'critical' {
  if (bufferDays <= BUSINESS_CONFIG.timelineManagement.critical_threshold_days) {
    return 'critical';
  }
  if (bufferDays <= BUSINESS_CONFIG.timelineManagement.warning_threshold_days) {
    return 'warning';
  }
  return 'safe';
}

// Helper function to validate budget against standard costs by typology
export function validateBudgetAgainstStandards(
  areaM2: number,
  totalBudget: number,
  typology: 'residential' | 'commercial' | 'industrial' | 'civil' | 'public',
  qualityLevel: 'basic' | 'moderate' | 'premium'
): {
  isValid: boolean;
  costPerM2: number;
  standardRange: { min: number; max: number };
  deviationPercentage: number;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
} {
  const costMatrix = GUATEMALA_CONFIG.costMatrices[qualityLevel];
  const costPerM2 = totalBudget / areaM2;

  // Calculate deviation from standard range
  const deviationPercentage = ((costPerM2 - costMatrix.min) / (costMatrix.max - costMatrix.min)) * 100;

  let isValid = true;
  let recommendation = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  if (costPerM2 < costMatrix.min) {
    isValid = false;
    recommendation = `El presupuesto está por debajo del estándar mínimo (${formatGTQ(costMatrix.min)}/m²). Riesgo de costos adicionales no cubiertos.`;
    severity = costPerM2 < costMatrix.min * 0.9 ? 'critical' : 'warning';
  } else if (costPerM2 > costMatrix.max) {
    isValid = false;
    recommendation = `El presupuesto excede el estándar máximo (${formatGTQ(costMatrix.max)}/m²). Revisar precios unitarios o consideraciones especiales.`;
    severity = costPerM2 > costMatrix.max * 1.2 ? 'critical' : 'warning';
  } else {
    recommendation = `El presupuesto está dentro del rango estándar (${formatGTQ(costMatrix.min)} - ${formatGTQ(costMatrix.max)}/m²).`;
    severity = 'info';
  }

  return {
    isValid,
    costPerM2,
    standardRange: costMatrix,
    deviationPercentage: Math.round(deviationPercentage),
    recommendation,
    severity
  };
}
