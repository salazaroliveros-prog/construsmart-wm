/**
 * CONSTRUCTORA WM/M&S - FINANCIAL DATA REALTIME HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook for real-time financial data streaming to analytics dashboard
 * Cross-module pipeline: FinanceManager ↔ AnalyticsDashboard
 */

import { useState, useEffect } from 'react';
import { offlineDB } from '@/lib/db/offlineStore';

export const useFinancialDataRealtime = (projectId: string) => {
  const [cumulativeCosts, setCumulativeCosts] = useState<Map<string, number>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadFinancialData = async () => {
      try {
        setIsLoading(true);
        
        const transactions = await offlineDB.financialTransactions
          .where('project_id')
          .equals(projectId)
          .and(t => t.type === 'expense')
          .toArray();
        
        // Calcular costos acumulados por fecha
        const costsByDate = new Map<string, number>();
        
        transactions
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .forEach(transaction => {
            const date = transaction.date;
            const current = costsByDate.get(date) || 0;
            costsByDate.set(date, current + transaction.total_cost);
          });
        
        // Convertir a acumulativo
        let runningTotal = 0;
        const cumulativeData = new Map<string, number>();
        
        Array.from(costsByDate.entries())
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .forEach(([date, cost]) => {
            runningTotal += cost;
            cumulativeData.set(date, runningTotal);
          });
        
        if (isMounted) {
          setCumulativeCosts(cumulativeData);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('[Financial Data Realtime] Error loading data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadFinancialData();
    
    // Suscribirse a cambios en offlineDB
    const changeListener = () => {
      if (isMounted) {
        loadFinancialData();
      }
    };
    
    // Setup hooks for Dexie changes
    offlineDB.financialTransactions.hook('creating', changeListener);
    offlineDB.financialTransactions.hook('updating', changeListener);
    offlineDB.financialTransactions.hook('deleting', changeListener);
    
    return () => {
      isMounted = false;
      offlineDB.financialTransactions.hook('creating').unsubscribe(changeListener);
      offlineDB.financialTransactions.hook('updating').unsubscribe(changeListener);
      offlineDB.financialTransactions.hook('deleting').unsubscribe(changeListener);
    };
  }, [projectId]);
  
  return { cumulativeCosts, lastUpdate, isLoading };
};
