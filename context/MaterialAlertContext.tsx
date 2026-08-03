/**
 * CONSTRUCTORA WM/M&S - MATERIAL ALERT CONTEXT
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Context for managing material shortage alerts from budget to warehouse
 * Cross-module pipeline: BudgetCalculator ↔ WarehouseManager
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { offlineDB } from '@/lib/db/offlineStore';

export interface MaterialAlert {
  projectId: string;
  projectName: string;
  materialCode: string;
  materialDescription: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortage: number;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

interface MaterialAlertContextType {
  alerts: MaterialAlert[];
  addAlert: (alert: MaterialAlert) => void;
  clearAlerts: (projectId: string) => void;
  clearAllAlerts: () => void;
  triggerStockCheck: (projectId: string, budgetItems: any[], projectName: string) => Promise<MaterialAlert[]>;
}

const MaterialAlertContext = createContext<MaterialAlertContextType | undefined>(undefined);

export const MaterialAlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<MaterialAlert[]>([]);

  const addAlert = (alert: MaterialAlert) => {
    setAlerts(prev => {
      // Evitar duplicados
      const exists = prev.some(
        a => a.projectId === alert.projectId && a.materialCode === alert.materialCode
      );
      if (exists) return prev;
      return [...prev, alert];
    });
  };

  const clearAlerts = (projectId: string) => {
    setAlerts(prev => prev.filter(alert => alert.projectId !== projectId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const triggerStockCheck = async (
    projectId: string, 
    budgetItems: any[], 
    projectName: string
  ): Promise<MaterialAlert[]> => {
    // Calcular requerimientos totales por material
    const materialRequirements = new Map<string, number>();
    
    budgetItems.forEach(item => {
      if (item.materialBreakdown) {
        item.materialBreakdown.forEach((material: any) => {
          const current = materialRequirements.get(material.code) || 0;
          materialRequirements.set(material.code, current + material.quantity);
        });
      }
    });
    
    // Obtener stock actual del almacén
    const warehouseStock = await offlineDB.warehouse_stock.toArray();
    const stockMap = new Map<string, number>();
    
    warehouseStock.forEach(item => {
      stockMap.set(item.item_code, item.current_stock);
    });
    
    // Identificar déficits de stock
    const newAlerts: MaterialAlert[] = [];
    
    materialRequirements.forEach((required, materialCode) => {
      const available = stockMap.get(materialCode) || 0;
      const shortage = required - available;
      
      if (shortage > 0) {
        const materialDescription = budgetItems.find(item => 
          item.materialBreakdown?.some((m: any) => m.code === materialCode)
        )?.description || materialCode;
        
        newAlerts.push({
          projectId,
          projectName,
          materialCode,
          materialDescription,
          requiredQuantity: required,
          availableQuantity: available,
          shortage,
          priority: shortage > required * 0.5 ? 'high' : 'medium',
          timestamp: new Date()
        });
      }
    });
    
    // Agregar alertas al contexto
    newAlerts.forEach(alert => addAlert(alert));
    
    console.log('[Material Alert] Stock check completed:', {
      projectId,
      materialsChecked: materialRequirements.size,
      alertsGenerated: newAlerts.length
    });
    
    return newAlerts;
  };

  return (
    <MaterialAlertContext.Provider
      value={{
        alerts,
        addAlert,
        clearAlerts,
        clearAllAlerts,
        triggerStockCheck
      }}
    >
      {children}
    </MaterialAlertContext.Provider>
  );
};

export const useMaterialAlertContext = () => {
  const context = useContext(MaterialAlertContext);
  if (!context) {
    throw new Error('useMaterialAlertContext must be used within MaterialAlertProvider');
  }
  return context;
};
