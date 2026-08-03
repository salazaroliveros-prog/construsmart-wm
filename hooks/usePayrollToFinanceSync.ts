/**
 * CONSTRUCTORA WM/M&S - PAYROLL TO FINANCE SYNC HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook for automatic expense generation from payroll to financial transactions
 * Cross-module pipeline: PayrollManager ↔ FinanceManager
 */

import { offlineDB } from '@/lib/db/offlineStore';
import type { LocalPayrollRecord, LocalFinancialTransaction } from '@/lib/db/offlineStore';

export const usePayrollToFinanceSync = () => {
  const syncPayrollToFinance = async (payrollRecord: LocalPayrollRecord): Promise<LocalFinancialTransaction> => {
    if (!payrollRecord.id) {
      throw new Error('Payroll record must have an ID');
    }

    // Calculate totals from payroll record
    const totalAmount = payrollRecord.net_salary + 
                       payrollRecord.igss_deduction + 
                       payrollRecord.aguinaldo_provision + 
                       payrollRecord.vacaciones_provision;

    // Generate UUID using a compatible method
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const financialTransaction: LocalFinancialTransaction = {
      id: generateUUID(),
      project_id: payrollRecord.project_id,
      type: 'expense',
      category: 'Gastos Operativos / Nómina de Mano de Obra',
      description: `Nómina Periodo ${payrollRecord.period_start} - ${payrollRecord.period_end}`,
      quantity: 1, // 1 payroll period
      unit: 'periodo',
      unit_cost: totalAmount,
      total_cost: totalAmount,
      date: new Date().toISOString().split('T')[0],
      receipt_url: undefined,
      sync_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await offlineDB.financialTransactions.add(financialTransaction);
    
    // Trigger sync status update
    await offlineDB.financialTransactions.update(financialTransaction.id!, {
      sync_status: 'pending'
    });
    
    console.log('[Payroll→Finance Sync]', {
      payrollId: payrollRecord.id,
      transactionId: financialTransaction.id,
      amount: totalAmount,
      timestamp: new Date().toISOString()
    });
    
    return financialTransaction;
  };
  
  return { syncPayrollToFinance };
};
