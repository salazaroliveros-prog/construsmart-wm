import { offlineDB, LocalFinancialTransaction, LocalSubcontractor } from '@/lib/db/offlineStore';
import { resolveSyncStatus } from '@/lib/utils/syncState';

export const useSubcontractorBalance = () => {
  const updateSubcontractorBalance = async (
    subcontractorId: string,
    transactionType: 'advance' | 'payment' | 'retention' | 'regular',
    amount: number
  ) => {
    try {
      const subcontractor = await offlineDB.subcontractors.get(subcontractorId);
      if (!subcontractor) throw new Error(`Subcontractista ${subcontractorId} no encontrado`);

      const updates: Partial<LocalSubcontractor> = {};

      if (transactionType === 'advance') {
        // Anticipo otorgado → suma al saldo
        updates.advance_balance = (subcontractor.advance_balance || 0) + amount;
      } else if (transactionType === 'payment') {
        // Pago a cuenta → resta del saldo de anticipo
        updates.advance_balance = Math.max(0, (subcontractor.advance_balance || 0) - amount);
      } else if (transactionType === 'retention') {
        // Retención de garantía → suma al saldo retenido
        updates.retention_balance = (subcontractor.retention_balance || 0) + amount;
      }

      // Guardar cambios
      await offlineDB.subcontractors.update(subcontractorId, {
        ...updates,
        sync_status: resolveSyncStatus({ 
          isNewRecord: false, 
          previousStatus: subcontractor.sync_status, 
          isOnline: true 
        }),
        updated_at: new Date().toISOString(),
      });

      return { success: true, newBalances: { ...subcontractor, ...updates } };
    } catch (error) {
      console.error('Error updating subcontractor balance:', error);
      throw error;
    }
  };

  return { updateSubcontractorBalance };
};