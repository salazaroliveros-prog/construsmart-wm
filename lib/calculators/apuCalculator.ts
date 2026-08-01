// ============================================================================
// APU (Análisis de Precios Unitarios) - Calculation Engine
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Based on INSTRUCCIONES_APU_PRESUPUESTOS.md
// All calculations run 100% client-side (Zero API roundtrip)
// ============================================================================

import { APUFormulaParams, APUResult, MaterialFactor, MATERIAL_FACTORS } from '@/lib/types/apu';

/**
 * Calculate Total Material Quantity with volumetric factors
 * Considers waste percentage, swelling (abundamiento), and contraction
 * Formula: Cantidad Total = [Cantidad Teórica × (1 + %Desperdicio)] × Factor Volumétrico
 */
export function calculateTotalMaterialQuantity(
  theoreticalQuantity: number,
  wastePercentage: number,
  volumetricFactor: number
): number {
  const wasteMultiplier = 1 + (wastePercentage / 100);
  return theoreticalQuantity * wasteMultiplier * volumetricFactor;
}

/**
 * Calculate Unit Labor Cost
 * Formula: Costo_MO = Salario Diario Cuadrilla / Rendimiento Diario
 */
export function calculateUnitLaborCost(
  crewDailySalary: number,
  dailyPerformance: number
): number {
  if (dailyPerformance <= 0) return 0;
  return crewDailySalary / dailyPerformance;
}

/**
 * Calculate Direct Cost (CD)
 * Formula: CD = Σ(Materiales) + Σ(Mano de Obra) + Σ(Maquinaria y Equipo)
 */
export function calculateDirectCost(
  materialCost: number,
  laborCost: number,
  machineryCost: number = 0
): number {
  return materialCost + laborCost + machineryCost;
}

/**
 * Calculate Indirect Cost (CI)
 * Formula: CI = CD × %Factor_Indirecto
 */
export function calculateIndirectCost(
  directCost: number,
  indirectPercentage: number
): number {
  return directCost * (indirectPercentage / 100);
}

/**
 * Calculate Total Cost with Indirects
 * Formula: Costo_Total = CD × (1 + %Factor_Indirecto)
 */
export function calculateTotalCost(
  directCost: number,
  indirectPercentage: number
): number {
  return directCost * (1 + indirectPercentage / 100);
}

/**
 * Full APU Calculation for a single renglon
 * Integrates all formulas for complete unit price analysis
 */
export function calculateAPU(params: APUFormulaParams): APUResult {
  const {
    theoreticalQuantity,
    wastePercentage,
    volumetricFactor,
    crewDailySalary,
    dailyPerformance,
    indirectPercentage,
    materialUnitCost = 0,
    machineryCost = 0,
  } = params;

  // Calculate total material quantity with factors
  const totalMaterialQuantity = calculateTotalMaterialQuantity(
    theoreticalQuantity,
    wastePercentage,
    volumetricFactor
  );

  // Calculate unit labor cost
  const unitLaborCost = calculateUnitLaborCost(crewDailySalary, dailyPerformance);

  // Calculate cost breakdown
  const materials = totalMaterialQuantity * (materialUnitCost || 0);
  const labor = theoreticalQuantity * unitLaborCost;
  const machinery = machineryCost || 0;

  // Calculate direct cost
  const directCost = calculateDirectCost(materials, labor, machinery);

  // Calculate indirect cost
  const indirectCost = calculateIndirectCost(directCost, indirectPercentage);

  // Calculate total cost
  const totalCost = calculateTotalCost(directCost, indirectPercentage);

  return {
    totalMaterialQuantity,
    unitLaborCost,
    directCost,
    indirectCost,
    totalCost,
    breakdown: {
      materials,
      labor,
      machinery,
    },
  };
}

/**
 * Get volumetric factor based on soil type and operation type
 * Returns appropriate factor for abundance (corte) or contraction (relleno)
 */
export function getVolumetricFactor(
  soilType: string,
  operationType: 'corte' | 'relleno'
): number {
  const factor = MATERIAL_FACTORS[soilType];
  if (!factor) return 1.0; // Default to no factor if soil type unknown

  return operationType === 'corte' ? factor.abundanceFactor : factor.contractionFactor;
}

/**
 * Calculate earthwork volume with factors
 * Used for integration with Topography/CivilCAD module
 */
export function calculateEarthworkVolume(
  designVolume: number,
  soilType: string,
  operationType: 'corte' | 'relleno'
): number {
  const factor = getVolumetricFactor(soilType, operationType);
  
  if (operationType === 'relleno') {
    // For fill: V_necessary = V_design / ContractionFactor
    return designVolume / factor;
  } else {
    // For cut: V_total = V_design × AbundanceFactor
    return designVolume * factor;
  }
}

/**
 * Calculate reinforced concrete cost
 * Includes concrete, steel reinforcement, and formwork
 */
export function calculateReinforcedConcreteCost(
  volume: number, // m³
  concretePricePerM3: number,
  steelQuantity: number, // kg
  steelPricePerKg: number,
  formworkArea: number, // m²
  formworkPricePerM2: number
): number {
  const concreteCost = volume * concretePricePerM3;
  const steelCost = steelQuantity * steelPricePerKg;
  const formworkCost = formworkArea * formworkPricePerM2;
  
  return concreteCost + steelCost + formworkCost;
}

/**
 * Calculate masonry wall cost
 * Considers units, mortar, and labor
 */
export function calculateMasonryWallCost(
  area: number, // m²
  unitsPerM2: number,
  unitPrice: number,
  mortarCostPerM2: number,
  laborCostPerM2: number
): number {
  const unitsCost = area * unitsPerM2 * unitPrice;
  const mortarCost = area * mortarCostPerM2;
  const laborCost = area * laborCostPerM2;
  
  return unitsCost + mortarCost + laborCost;
}

/**
 * Calculate slab (losa) cost with steel in two directions
 */
export function calculateSlabCost(
  area: number, // m²
  thickness: number, // m
  concretePricePerM3: number,
  steelAreaPerM2: number, // kg/m²
  steelPricePerKg: number,
  formworkPricePerM2: number
): number {
  const volume = area * thickness;
  const concreteCost = volume * concretePricePerM3;
  const steelCost = area * steelAreaPerM2 * steelPricePerKg;
  const formworkCost = area * formworkPricePerM2;
  
  return concreteCost + steelCost + formworkCost;
}

// Local-use BudgetSummary (aligned with BudgetCalculator component usage)
export interface LocalBudgetSummary {
  directCost: number;
  indirectCost: number;
  contingency: number;
  profit: number;
  total: number;
}

export function localBudgetSummaryFromBudgetSummary(bs: BudgetSummary): LocalBudgetSummary {
  return {
    directCost: bs.totalDirectCost,
    indirectCost: bs.totalIndirectCost,
    contingency: bs.totalContingency,
    profit: bs.totalProfit,
    total: bs.grandTotal,
  };
}

export function calculateLocalBudgetSummary(
  items: { totalCost: number }[],
  indirectPercentage: number,
  contingencyPercentage: number,
  profitPercentage: number,
): LocalBudgetSummary {
  const directCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const indirectCost = directCost * (indirectPercentage / 100);
  const contingency = directCost * (contingencyPercentage / 100);
  const profit = directCost * (profitPercentage / 100);
  const total = directCost + indirectCost + contingency + profit;
  return { directCost, indirectCost, contingency, profit, total };
}

/**
 * Format currency to Quetzales (GTQ)
 */
export function formatQuetzales(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate budget summary from multiple APU items
 */
export interface BudgetSummary {
  totalDirectCost: number;
  totalIndirectCost: number;
  totalContingency: number;
  totalProfit: number;
  grandTotal: number;
  breakdown: {
    materials: number;
    labor: number;
    machinery: number;
  };
}

export function calculateBudgetSummary(
  apuResults: APUResult[],
  contingencyPercentage: number = 5,
  profitPercentage: number = 10
): BudgetSummary {
  const totalDirectCost = apuResults.reduce((sum, result) => sum + result.directCost, 0);
  const totalIndirectCost = apuResults.reduce((sum, result) => sum + result.indirectCost, 0);
  
  const totalMaterials = apuResults.reduce((sum, result) => sum + result.breakdown.materials, 0);
  const totalLabor = apuResults.reduce((sum, result) => sum + result.breakdown.labor, 0);
  const totalMachinery = apuResults.reduce((sum, result) => sum + result.breakdown.machinery, 0);
  
  const totalContingency = totalDirectCost * (contingencyPercentage / 100);
  const totalProfit = totalDirectCost * (profitPercentage / 100);
  const grandTotal = totalDirectCost + totalIndirectCost + totalContingency + totalProfit;
  
  return {
    totalDirectCost,
    totalIndirectCost,
    totalContingency,
    totalProfit,
    grandTotal,
    breakdown: {
      materials: totalMaterials,
      labor: totalLabor,
      machinery: totalMachinery,
    },
  };
}

/**
 * Calculate cost per square meter
 * Used for comparison with residential cost matrix
 */
export function calculateCostPerM2(
  totalCost: number,
  area: number
): number {
  if (area <= 0) return 0;
  return totalCost / area;
}

/**
 * Determine residential cost level based on cost per m²
 * Based on CONSTRUCTORA WM/M&S cost matrix
 */
export type CostLevel = 'basico' | 'moderado' | 'premium';

export function getResidentialCostLevel(costPerM2: number): CostLevel {
  if (costPerM2 < 3500) return 'basico';
  if (costPerM2 < 4000) return 'moderado';
  return 'premium';
}

export function getCostLevelLabel(level: CostLevel): string {
  const labels: Record<CostLevel, string> = {
    basico: 'Nivel Básico (Q. 3,000 - 3,500 / m²)',
    moderado: 'Nivel Moderado (Q. 3,500 - 4,000 / m²)',
    premium: 'Nivel Premium (Q. 4,000 - 5,000 / m²)',
  };
  return labels[level];
}
