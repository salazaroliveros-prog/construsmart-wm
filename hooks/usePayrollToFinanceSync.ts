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

    // --- Idempotencia: evitar transacciones financieras duplicadas por re-sincronización ---
    // Antes de insertar, se busca una transacción que ya represente este mismo registro de
    // nómina. No existe un campo de referencia/source dedicado, por lo que se usa una regla
    // determinista con los campos disponibles: la descripción guarda el periodo de nómina
    // (period_start - period_end), que actúa como clave natural del registro (como payroll_id),
    // y se cruza con categoría, proyecto y monto.
    const existingTransaction = await offlineDB.financialTransactions
      .filter(tx =>
        tx.type === 'expense' &&
        tx.category === 'gastos_operativos_nomina' &&
        (payrollRecord.project_id === undefined || tx.project_id === payrollRecord.project_id) &&
        tx.description.includes(`${payrollRecord.period_start} - ${payrollRecord.period_end}`) &&
        tx.total_cost === totalAmount
      )
      .first();

    // Si ya existe, se omite el insert para no duplicar el gasto (acumula AC en EVM)
    if (existingTransaction) {
      console.log('[Payroll→Finance Sync] Duplicado omitido para registro de nómina', {
        payrollId: payrollRecord.id,
        existingTransactionId: existingTransaction.id,
        amount: existingTransaction.total_cost,
        reason: 'Ya existe una transacción financiera para este periodo de nómina'
      });
      return existingTransaction;
    }

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
      category: 'gastos_operativos_nomina',
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
