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
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

// Aliases de unidades para normalizar equivalentes escritos distinto
// (p.ej. "m3" ↔ "m³", "und" ↔ "unidad") y evitar falsas alertas por unidades.
const MATERIAL_UNIT_ALIASES: Record<string, string> = {
  'unidad': 'unidad',
  'unidades': 'unidad',
  'unid': 'unidad',
  'und': 'unidad',
  'kg': 'kg',
  'kilogramo': 'kg',
  'kilogramos': 'kg',
  'tonelada': 'tonelada',
  'ton': 'tonelada',
  'm': 'm',
  'metro': 'm',
  'metros': 'm',
  'ml': 'm',
  'm³': 'm³',
  'm3': 'm³',
  'metro cúbico': 'm³',
  'metros cúbicos': 'm³',
  'm²': 'm²',
  'm2': 'm²',
  'metro cuadrado': 'm²',
  'metros cuadrados': 'm²',
  'l': 'l',
  'lts': 'l',
  'litro': 'l',
  'litros': 'l',
  'gal': 'gal',
  'galón': 'gal',
  'galones': 'gal',
};

// Normaliza la unidad recibida (descripción o vacía) a su forma canónica
const normalizeUnit = (unit: unknown): string => {
  if (unit === undefined || unit === null) return '';
  const key = String(unit).trim().toLowerCase();
  return MATERIAL_UNIT_ALIASES[key] || key;
};

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
    // ---- Agregación de requerimientos SÓLO para el proyecto indicado ----
    // Se agrupa por código de material conservando su unidad, para no
    // mezclar magnitudes de unidades distintas (m³ vs m², und vs bolsa).
    const materialRequirements = new Map<string, { quantity: number; unit: string }>();
    
    budgetItems.forEach(item => {
      // Scoping: descartar ítems que pertenecen a otro proyecto
      if (item.project_id && String(item.project_id) !== String(projectId)) return;
      if (!item.materialBreakdown) return;

      item.materialBreakdown.forEach((material: any) => {
        const code = material.code;
        if (!code) return;

        const unit = normalizeUnit(material.unit);
        const quantity = Number(material.quantity) || 0;

        const existing = materialRequirements.get(code);
        if (!existing) {
          materialRequirements.set(code, { quantity, unit });
          return;
        }

        // Si la misma clave llega con otra unidad no se puede sumar:
        // se omite este aporte para conservar la consistencia de unidades.
        if (unit !== existing.unit) {
          console.log(
            '[Material Alert] Unidad inconsistente para el material', code,
            `(${existing.unit} vs ${unit}) - aporte omitido`
          );
          return;
        }
        existing.quantity += quantity;
      });
    });
    
    // ---- Obtener stock del almacén SÓLO del proyecto actual (o compartido) ----
    const userId = await getUserScope();
    const warehouseStock = scopeLocalRows(await offlineDB.warehouseStock.toArray(), userId);
    const stockMap = new Map<string, { quantity: number; unit: string }>();
    
    warehouseStock.forEach(item => {
      // Scoping: sólo stock del proyecto actual o stock compartido (sin proyecto asignado)
      if (item.project_id && String(item.project_id) !== String(projectId)) return;

      const entry = {
        quantity: Number(item.current_stock) || 0,
        unit: normalizeUnit(item.unit),
      };

      const existing = stockMap.get(item.item_code);
      if (!existing || existing.unit === entry.unit) {
        stockMap.set(item.item_code, {
          quantity: (existing ? existing.quantity : 0) + entry.quantity,
          unit: existing ? existing.unit : entry.unit,
        });
      }
    });
    
    // ---- Identificar déficits de stock ----
    const newAlerts: MaterialAlert[] = [];
    
    materialRequirements.forEach((req, materialCode) => {
      // Guardar contra división por cero / valores no numéricos
      const required = req.quantity;
      if (!isFinite(required) || required <= 0) return;

      const stockEntry = stockMap.get(materialCode);

      let available = 0;
      if (stockEntry) {
        if (stockEntry.unit === req.unit) {
          // Unidades consistentes: comparar directamente
          available = stockEntry.quantity;
        } else if (req.unit && stockEntry.unit) {
          // Unidades distintas sin conversión confiable: se omite con motivo
          // registrado, en lugar de emitir una falsa alerta de escasez.
          console.log(
            '[Material Alert] Unidad de almacén distinta a la del presupuesto para',
            materialCode, `(${stockEntry.unit} vs ${req.unit}) - verificación omitida`
          );
          return;
        }
      }

      const shortage = required - available;
      if (!isFinite(shortage) || shortage <= 0) return;

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
