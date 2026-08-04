// ============================================================================
// Motor de Cálculo Automático por Renglón
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Calcula automáticamente: materiales, MO, rendimiento, tiempo
// con recálculo en cascada cuando cambian cuadrillas
// ============================================================================

import { APURenglon } from '@/lib/types/apu';

// ============================================================================
// INTERFACES
// ============================================================================

export interface RenglonCalculationParams {
  quantity: number; // Cantidad total del renglón
  renglon: APURenglon;
  customCrewSize?: number; // Tamaño de cuadrilla personalizado
  customMaterialCost?: number; // Costo de material personalizado
  customLaborCost?: number; // Costo de mano de obra personalizado
  customPerformance?: number; // Rendimiento personalizado
  efficiency?: number; // % eficiencia (default: 100)
}

export interface MaterialBreakdownItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface ProjectRenglon {
  id: string;
  quantity: number;
  renglon: APURenglon;
  customCrewSize?: number;
}

export interface RenglonCalculationResult {
  // Costos
  materialCost: number; // Costo total de materiales
  laborCost: number; // Costo total de mano de obra
  machineryCost: number; // Costo total de maquinaria
  total_cost: number; // Costo total

  // Materiales
  materialQuantity: number; // Cantidad de material con desperdicio
  materialUnitCost: number; // Costo unitario de material
  materialUnit: string; // Unidad de material

  // Mano de Obra
  crewSize: number; // Tamaño de cuadrilla
  dailySalary: number; // Salario diario por cuadrilla
  dailyPerformance: number; // Rendimiento diario
  laborUnit: string; // Unidad de rendimiento

  // Maquinaria
  machineryType?: string;
  machineryHourlyCost?: number;
  machineryHours?: number;

  // Tiempo
  daysRequired: number; // Días requeridos para este renglón
  crewHours: number; // Horas-hombre totales

  // Rendimientos
  materialYield: number; // Rendimiento de material (unidades/base)
  laborYield: number; // Rendimiento de mano de obra (unidades/día)

  // Efectos en cascada
  crewSizeChange?: number; // Cambio en tamaño de cuadrilla
  timeReduction?: number; // Reducción de tiempo (días) por cambio de cuadrilla
}

export interface ProjectTimeImpact {
  totalDays: number; // Días totales del proyecto
  renglonDays: Record<string, number>; // Días por renglón
  criticalPath: string[]; // Renglones en ruta crítica
  bottleneck?: string; // Renglón cuello de botella
}

// ============================================================================
// MOTOR DE CÁLCULO PRINCIPAL
// ============================================================================

export class RenglonCalculator {
  /**
   * Calcula todos los valores de un renglón automáticamente
   */
  static calculateRenglon(params: RenglonCalculationParams): RenglonCalculationResult {
    const {
      quantity,
      renglon,
      customCrewSize,
      customMaterialCost,
      customLaborCost,
      customPerformance,
      efficiency = renglon.defaultValues?.efficiency || 100
    } = params;

    // Eficiencia como factor (0-1)
    const efficiencyFactor = efficiency / 100;

    // =========================================================================
    // CÁLCULO DE MATERIALES
    // =========================================================================
    let materialCost = 0;
    let materialQuantity = 0;
    let materialUnitCost = 0;
    let materialUnit = '';

    if (renglon.materialFormula) {
      const baseQuantity = quantity;
      const wastePercentage = renglon.materialFormula.wastePercentage / 100;
      materialQuantity = baseQuantity * (1 + wastePercentage);
      materialUnitCost = customMaterialCost || renglon.materialFormula.materialUnitCost;
      materialCost = materialQuantity * materialUnitCost;
      materialUnit = renglon.materialFormula.unit;
    }

    // =========================================================================
    // CÁLCULO DE MANO DE OBRA
    // =========================================================================
    let laborCost = 0;
    let crewSize = renglon.laborFormula?.crewSize || 1;
    let dailySalary = renglon.laborFormula?.dailySalary || 0;
    let dailyPerformance = renglon.laborFormula?.dailyPerformance || 1;
    let laborUnit = renglon.laborFormula?.unit || 'unid';

    // Aplicar valores personalizados si existen
    if (customCrewSize) crewSize = customCrewSize;
    if (customLaborCost) dailySalary = customLaborCost;
    if (customPerformance) dailyPerformance = customPerformance;

    // Ajustar rendimiento por eficiencia
    const adjustedPerformance = dailyPerformance * efficiencyFactor;

    // Calcular días requeridos
    const daysRequired = quantity / adjustedPerformance;

    // Calcular costo de mano de obra
    laborCost = daysRequired * dailySalary;

    // Calcular horas-hombre (8 horas por día)
    const crewHours = daysRequired * crewSize * 8;

    // =========================================================================
    // CÁLCULO DE MAQUINARIA
    // =========================================================================
    let machineryCost = 0;
    let machineryType: string | undefined;
    let machineryHourlyCost: number | undefined;
    let machineryHours: number | undefined;

    if (renglon.machineryFormula) {
      machineryType = renglon.machineryFormula.equipmentType;
      machineryHourlyCost = renglon.machineryFormula.hourlyCost;
      const hourlyRate = renglon.machineryFormula.hourlyRate;
      machineryHours = quantity / hourlyRate;
      machineryCost = machineryHours * machineryHourlyCost;
    }

    // =========================================================================
    // CÁLCULO DE COSTO TOTAL
    // =========================================================================
    const total_cost = materialCost + laborCost + machineryCost;

    // =========================================================================
    // CÁLCULO DE RENDIMIENTOS
    // =========================================================================
    const materialYield = materialQuantity > 0 ? quantity / materialQuantity : 0;
    const laborYield = adjustedPerformance;

    // =========================================================================
    // CÁLCULO DE EFECTO EN CASCADA (cambio de cuadrilla)
    // =========================================================================
    let crewSizeChange: number | undefined;
    let timeReduction: number | undefined;

    if (customCrewSize && renglon.laborFormula) {
      const originalCrewSize = renglon.laborFormula.crewSize;
      const originalDays = quantity / (renglon.laborFormula.dailyPerformance * efficiencyFactor);
      const newDays = quantity / (renglon.laborFormula.dailyPerformance * efficiencyFactor * (customCrewSize / originalCrewSize));
      
      crewSizeChange = customCrewSize - originalCrewSize;
      timeReduction = originalDays - newDays;
    }

    return {
      materialCost,
      laborCost,
      machineryCost,
      total_cost,
      materialQuantity,
      materialUnitCost,
      materialUnit,
      crewSize,
      dailySalary,
      dailyPerformance: adjustedPerformance,
      laborUnit,
      machineryType,
      machineryHourlyCost,
      machineryHours,
      daysRequired,
      crewHours,
      materialYield,
      laborYield,
      crewSizeChange,
      timeReduction
    };
  }

  /**
   * Calcula el impacto en tiempo total del proyecto
   * cuando se modifican cuadrillas de renglones
   */
  static calculateProjectTimeImpact(
    renglones: ProjectRenglon[],
    efficiency: number = 100
  ): ProjectTimeImpact {
    const renglonDays: Record<string, number> = {};
    let totalDays = 0;

    renglones.forEach(({ id, quantity, renglon, customCrewSize }) => {
      const calc = this.calculateRenglon({
        quantity,
        renglon,
        customCrewSize,
        efficiency
      });
      renglonDays[id] = calc.daysRequired;
      totalDays += calc.daysRequired;
    });

    // Identificar cuello de botella (renglón con más días)
    const sorted = Object.entries(renglonDays).sort((a, b) => b[1] - a[1]);
    const bottleneck = sorted[0]?.[0];

    // Ruta crítica (top 3 renglones con más días)
    const criticalPath = sorted.slice(0, 3).map(([id]) => id);

    return {
      totalDays,
      renglonDays,
      criticalPath,
      bottleneck
    };
  }

  /**
   * Calcula el desglose de materiales para almacén
   */
  static calculateMaterialBreakdown(params: RenglonCalculationParams): MaterialBreakdownItem[] {
    const { quantity, renglon, customMaterialCost } = params;

    if (!renglon.materialFormula) {
      return [];
    }

    const wastePercentage = renglon.materialFormula.wastePercentage / 100;
    const materialQuantity = quantity * (1 + wastePercentage);
    const materialUnitCost = customMaterialCost || renglon.materialFormula.materialUnitCost;
    const total_cost = materialQuantity * materialUnitCost;

    return [
      {
        code: renglon.code,
        description: renglon.description,
        unit: renglon.materialFormula.unit,
        quantity: materialQuantity,
        unit_cost: materialUnitCost,
        total_cost
      }
    ];
  }

  /**
   * Calcula el costo agregado por renglón para almacén
   */
  static calculateWarehouseCost(params: RenglonCalculationParams): number {
    const breakdown = this.calculateMaterialBreakdown(params);
    return breakdown.reduce((sum, item) => sum + item.total_cost, 0);
  }

  /**
   * Recalcula en cascada cuando cambia un parámetro
   */
  static recalculateCascade(
    params: RenglonCalculationParams,
    allRenglones: ProjectRenglon[]
  ): {
    currentRenglon: RenglonCalculationResult;
    projectImpact: ProjectTimeImpact;
  } {
    const currentRenglon = this.calculateRenglon(params);
    const projectImpact = this.calculateProjectTimeImpact(allRenglones);

    return {
      currentRenglon,
      projectImpact
    };
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

export function formatDays(days: number): string {
  if (days < 1) {
    return `${Math.round(days * 8)} horas`;
  }
  return `${Math.round(days)} días`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function calculateEfficiencyGain(
  originalDays: number,
  newDays: number
): number {
  if (originalDays === 0) return 0;
  return ((originalDays - newDays) / originalDays) * 100;
}
