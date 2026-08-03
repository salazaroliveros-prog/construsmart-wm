/**
 * CONSTRUCTORA WM/M&S - LABOR COST OVERRUN DETECTION HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook for detecting labor cost overruns in payroll operations
 * Cross-module pipeline: PayrollManager → FinanceManager → Financial Transactions
 * 
 * Automatically detects when labor costs exceed budget allocations:
 * 1. Monitors overtime hours vs daily limits
 * 2. Links payroll records to budget items
 * 3. Compares actual vs planned labor hours
 * 4. Calculates cost overrun amounts
 * 5. Fires non-blocking warning transactions
 * 6. Updates payroll records with warning flags
 */

import { useState, useEffect } from 'react';
import { offlineDB, LocalPayrollRecord, LocalBudgetItem, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import { generateId } from '@/lib/utils/generateId';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { formatGTQ, BUSINESS_CONFIG } from '@/lib/config/app.config';

export interface LaborOverrunAlert {
  payrollRecord: LocalPayrollRecord;
  budgetItem?: LocalBudgetItem;
  actualHours: number;
  plannedHours: number;
  overtimeHours: number;
  costOverrunAmount: number;
  severity: 'warning' | 'critical';
  message: string;
}

export interface OverrunDetectionResult {
  hasOverrun: boolean;
  severity: 'warning' | 'critical' | 'none';
  alerts: LaborOverrunAlert[];
  warningTransactionId?: string;
}

export const useLaborCostOverrun = () => {
  const [alerts, setAlerts] = useState<LaborOverrunAlert[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  /**
   * Detect labor cost overrun for a single payroll record
   */
  const detectOverrun = async (payrollRecord: LocalPayrollRecord): Promise<OverrunDetectionResult> => {
    try {
      setIsDetecting(true);

      // Get overtime limits from business config
      const overtimeDailyLimit = BUSINESS_CONFIG.laborOverrun.overtime_daily_limit; // Default: 2 hours
      const warningThreshold = BUSINESS_CONFIG.laborOverrun.warning_threshold; // Default: 10%

      // Calculate overtime hours
      const overtimeHours = Math.max(0, payrollRecord.total_hours - 8); // Assuming 8-hour workday
      const actualHours = payrollRecord.total_hours;
      const plannedHours = payrollRecord.planned_hours || 8;

      // Get linked budget item if available
      let budgetItem: LocalBudgetItem | undefined;
      if (payrollRecord.budget_item_id) {
        budgetItem = await offlineDB.budgetItems.get(payrollRecord.budget_item_id);
      }

      // Calculate cost overrun
      const hourlyRate = payrollRecord.hourly_rate || 50; // Default Q50/hour
      const plannedCost = plannedHours * hourlyRate;
      const actualCost = actualHours * hourlyRate;
      const costOverrunAmount = actualCost - plannedCost;

      // Determine severity
      let severity: 'warning' | 'critical' | 'none' = 'none';
      const overrunPercentage = plannedCost > 0 ? (costOverrunAmount / plannedCost) * 100 : 0;

      if (overtimeHours > overtimeDailyLimit || overrunPercentage > warningThreshold) {
        severity = 'warning';
      }

      if (overtimeHours > overtimeDailyLimit * 2 || overrunPercentage > warningThreshold * 2) {
        severity = 'critical';
      }

      // Generate alert if overrun detected
      const newAlerts: LaborOverrunAlert[] = [];
      let warningTransactionId: string | undefined;

      if (severity !== 'none' && !payrollRecord.is_overrun_warning_fired) {
        const alert: LaborOverrunAlert = {
          payrollRecord,
          budgetItem,
          actualHours,
          plannedHours,
          overtimeHours,
          costOverrunAmount,
          severity,
          message: severity === 'critical' 
            ? `CRÍTICO: Exceso de mano de obra ${overrunPercentage.toFixed(1)}% sobre presupuesto (${formatGTQ(costOverrunAmount)})`
            : `Alerta: Exceso de mano de obra ${overrunPercentage.toFixed(1)}% sobre presupuesto (${formatGTQ(costOverrunAmount)})`,
        };

        newAlerts.push(alert);

        // Create warning transaction in financial ledger
        const warningTransaction: LocalFinancialTransaction = {
          id: generateId(),
          project_id: payrollRecord.project_id,
          type: 'warning',
          category: 'labor_overrun',
          description: alert.message,
          amount: costOverrunAmount,
          date: new Date().toISOString().split('T')[0],
          reference: payrollRecord.id,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: navigator.onLine }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        warningTransactionId = await offlineDB.financialTransactions.add(warningTransaction);

        // Update payroll record with warning flag
        await offlineDB.payrollRecords.update(payrollRecord.id!, {
          cost_overrun_amount: costOverrunAmount,
          is_overrun_warning_fired: true,
        });
      }

      setAlerts(newAlerts);

      return {
        hasOverrun: newAlerts.length > 0,
        severity,
        alerts: newAlerts,
        warningTransactionId,
      };

    } catch (error) {
      console.error('[Labor Overrun] Error detecting overrun:', error);
      return {
        hasOverrun: false,
        severity: 'none',
        alerts: [],
      };
    } finally {
      setIsDetecting(false);
    }
  };

  /**
   * Check all payroll records for labor cost overruns
   */
  const detectAllOverruns = async (projectId?: string): Promise<OverrunDetectionResult[]> => {
    try {
      let payrollRecords: LocalPayrollRecord[];

      if (projectId) {
        payrollRecords = await offlineDB.payrollRecords
          .where('project_id')
          .equals(projectId)
          .toArray();
      } else {
        payrollRecords = await offlineDB.payrollRecords.toArray();
      }

      const results: OverrunDetectionResult[] = [];

      for (const record of payrollRecords) {
        const result = await detectOverrun(record);
        results.push(result);
      }

      return results;

    } catch (error) {
      console.error('[Labor Overrun] Error detecting all overruns:', error);
      return [];
    }
  };

  /**
   * Check overtime limits for a payroll record
   */
  const checkOvertimeLimit = (payrollRecord: LocalPayrollRecord): boolean => {
    const overtimeDailyLimit = BUSINESS_CONFIG.laborOverrun.overtime_daily_limit;
    const overtimeHours = Math.max(0, payrollRecord.total_hours - 8);
    return overtimeHours > overtimeDailyLimit;
  };

  /**
   * Calculate cost overrun for a payroll record
   */
  const calculateCostOverrun = (payrollRecord: LocalPayrollRecord): number => {
    const plannedHours = payrollRecord.planned_hours || 8;
    const actualHours = payrollRecord.total_hours;
    const hourlyRate = payrollRecord.hourly_rate || 50;

    const plannedCost = plannedHours * hourlyRate;
    const actualCost = actualHours * hourlyRate;

    return actualCost - plannedCost;
  };

  /**
   * Get payroll records with overrun warnings
   */
  const getOverrunRecords = async (projectId?: string): Promise<LocalPayrollRecord[]> => {
    try {
      let records: LocalPayrollRecord[];

      if (projectId) {
        records = await offlineDB.payrollRecords
          .where('project_id')
          .equals(projectId)
          .and(record => record.is_overrun_warning_fired === true)
          .toArray();
      } else {
        records = await offlineDB.payrollRecords
          .where('is_overrun_warning_fired')
          .equals(true)
          .toArray();
      }

      return records;

    } catch (error) {
      console.error('[Labor Overrun] Error getting overrun records:', error);
      return [];
    }
  };

  return {
    alerts,
    isDetecting,
    detectOverrun,
    detectAllOverruns,
    checkOvertimeLimit,
    calculateCostOverrun,
    getOverrunRecords,
  };
};
