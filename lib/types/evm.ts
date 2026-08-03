/**
 * CONSTRUCTORA WM/M&S - EARNED VALUE MANAGEMENT TYPES
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Type definitions for Earned Value Management (EVM) calculations
 * Used for project performance tracking and predictive forecasting
 */

/**
 * Core EVM Metrics
 * PV: Planned Value - Budgeted cost of work scheduled
 * EV: Earned Value - Budgeted cost of work performed
 * AC: Actual Cost - Actual cost of work performed
 */
export interface EVMMetrics {
  plannedValue: number; // PV - Presupuesto Valorado del Trabajo Programado
  earnedValue: number; // EV - Valor Ganado del Trabajo Realizado
  actualCost: number; // AC - Costo Real del Trabajo Realizado
  
  // Variance Metrics
  scheduleVariance: number; // SV = EV - PV (Varianza de Programación)
  costVariance: number; // CV = EV - AC (Varianza de Costo)
  
  // Performance Indices
  schedulePerformanceIndex: number; // SPI = EV / PV (Índice de Desempeño de Programación)
  costPerformanceIndex: number; // CPI = EV / AC (Índice de Desempeño de Costo)
  
  // Forecasting Metrics
  budgetAtCompletion: number; // BAC - Presupuesto al Completar (total project budget)
  estimatedAtCompletion: number; // EAC = BAC / CPI (Estimado al Completar)
  varianceAtCompletion: number; // VAC = BAC - EAC (Varianza al Completar)
  estimateToComplete: number; // ETC = EAC - AC (Estimado para Completar)
  
  // Performance Indicators
  isAheadOfSchedule: boolean; // SPI > 1
  isBehindSchedule: boolean; // SPI < 1
  isUnderBudget: boolean; // CPI > 1
  isOverBudget: boolean; // CPI < 1
  
  // Calculated at
  calculatedAt: string;
}

/**
 * EVM Prediction Point
 * Represents a single point in the predictive forecast curve
 */
export interface EVMPrediction {
  date: string;
  plannedValue: number; // PV at this date
  predictedEV: number; // Predicted EV at this date
  predictedAC: number; // Predicted AC at this date
  predictedSV: number; // Predicted Schedule Variance
  predictedCV: number; // Predicted Cost Variance
  cumulativeProgress: number; // % complete
}

/**
 * EVM Forecast Configuration
 * Parameters for predictive forecasting
 */
export interface EVMForecastConfig {
  forecastPeriod: number; // Number of days to forecast
  projectDuration: number; // Total project duration in days
  startDate: string; // Project start date
  currentProgress: number; // Current % complete (0-100)
  dailyBurnRate: number; // Average daily cost
  expectedAcceleration: number; // Expected acceleration factor (1.0 = constant)
}

/**
 * EVM Analysis Result
 * Complete analysis with recommendations
 */
export interface EVMAnalysis {
  metrics: EVMMetrics;
  predictions: EVMPrediction[];
  healthScore: number; // 0-100 project health score
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  trends: {
    spiTrend: 'improving' | 'stable' | 'declining';
    cpiTrend: 'improving' | 'stable' | 'declining';
  };
}

/**
 * EVM Period Data
 * Historical EVM data for trend analysis
 */
export interface EVMPeriodData {
  period: string; // Date or period identifier
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  progress: number; // % complete
}

/**
 * EVM Thresholds
 * Warning and critical thresholds for EVM metrics
 */
export interface EVMThresholds {
  spiWarning: number; // SPI below this triggers warning (default: 0.9)
  spiCritical: number; // SPI below this triggers critical (default: 0.8)
  cpiWarning: number; // CPI below this triggers warning (default: 0.9)
  cpiCritical: number; // CPI below this triggers critical (default: 0.8)
  svWarningPercentage: number; // SV as % of PV (default: -10%)
  svCriticalPercentage: number; // SV as % of PV (default: -20%)
  cvWarningPercentage: number; // CV as % of EV (default: -10%)
  cvCriticalPercentage: number; // CV as % of EV (default: -20%)
}

/**
 * Default EVM Thresholds
 */
export const DEFAULT_EVM_THRESHOLDS: EVMThresholds = {
  spiWarning: 0.9,
  spiCritical: 0.8,
  cpiWarning: 0.9,
  cpiCritical: 0.8,
  svWarningPercentage: -0.10, // -10%
  svCriticalPercentage: -0.20, // -20%
  cvWarningPercentage: -0.10, // -10%
  cvCriticalPercentage: -0.20, // -20%
};
