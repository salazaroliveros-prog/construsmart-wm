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
import { offlineDB, LocalPayrollRecord, LocalBudgetItem } from '@/lib/db/offlineStore';
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

      // Obtener límites de la configuración de negocio
      const overtimeDailyLimit = BUSINESS_CONFIG.laborOverrun.overtime_daily_limit; // Horas extra por día
      // warning_threshold/critical_threshold son razones (1.10 = +10% sobre presupuesto).
      const warningPct = (BUSINESS_CONFIG.laborOverrun.warning_threshold - 1) * 100;
      const criticalPct = (BUSINESS_CONFIG.laborOverrun.critical_threshold - 1) * 100;

      // Calculate overtime hours
      const totalHours = payrollRecord.total_hours || 8; // Default to 8 hours if not set
      const overtimeHours = Math.max(0, totalHours - 8); // Assuming 8-hour workday
      const actualHours = totalHours;
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

      if (overtimeHours > overtimeDailyLimit || overrunPercentage > warningPct) {
        severity = 'warning';
      }

      if (overtimeHours > overtimeDailyLimit * 2 || overrunPercentage > criticalPct) {
        severity = 'critical';
      }

      // Generate alert if overrun detected
      const newAlerts: LaborOverrunAlert[] = [];

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

        // Marcar el registro de nómina con el flag de aviso. NO se inserta una
        // transacción financiera adicional: el costo de nómina completo ya es
        // registrado por usePayrollToFinanceSync, e insertar la diferencia aquí
        // inflaría el costo real (AC) en EVM (doble conteo).
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
        warningTransactionId: undefined,
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
    const totalHours = payrollRecord.total_hours || 8;
    const overtimeHours = Math.max(0, totalHours - 8);
    return overtimeHours > overtimeDailyLimit;
  };

  /**
   * Calculate cost overrun for a payroll record
   */
  const calculateCostOverrun = (payrollRecord: LocalPayrollRecord): number => {
    const plannedHours = payrollRecord.planned_hours || 8;
    const actualHours = payrollRecord.total_hours || 8;
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
        const allRecords = await offlineDB.payrollRecords.toArray();
        records = allRecords.filter(record => record.is_overrun_warning_fired === true);
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
