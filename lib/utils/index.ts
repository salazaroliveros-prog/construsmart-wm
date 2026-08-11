// ============================================================================
// UTILIDADES CENTRALIZADAS
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Exportaciones centralizadas de todas las utilidades del proyecto.
// ============================================================================

export { generateId, isValidUUID } from './generateId';
export { logger, useLogger, logApiError, logDbOperation } from './logger';
export { 
  calculateDashboardStats,
  calculateSummaryMetrics,
  calculateBudgetComparison,
  calculateWarehouseSummary,
  calculateFinanceSummary,
  calculatePayrollSummary,
  calculateProgressMetrics,
  calculatePurchaseOrderSummary,
  calculateSupplierSummary,
  calculateClientSummary,
  calculateProjectLogSummary,
  type DashboardStatsInput,
  type DashboardStatsResult,
  type DashboardChartsMetricsInput,
  type SummaryMetrics,
  type BudgetComparisonInput,
  type BudgetComparisonResult,
  type WarehouseSummaryResult,
  type PayrollSummaryResult,
  type ProgressMetrics
} from './summaryCalculations';
export { getUserScope, scopeLocalRows } from './userScope';
export { applyUISettings } from './applySettings';
export { 
  syncOfflineData, 
  forceFullSync, 
  getSyncStats, 
  updateSyncStatus,
  type SyncResult,
  type SyncStats
} from './offlineSync';
export { 
  normalizeSyncStatus, 
  isPendingSyncStatus, 
  resolveSyncStatus,
  type SyncStatusValue,
  type ResolveSyncStatusOptions
} from './syncState';

// Función utilitaria para combinar clases de Tailwind (clsx + tailwind-merge)
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
