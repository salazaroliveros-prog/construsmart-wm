/**
 * Financial Utilities for Construction ERP
 * Precision rounding and commercial conversions for Guatemalan standards
 */

/**
 * Round money to 2 decimal places with floating-point error mitigation
 * Compatible with NUMERIC(12,2) in Supabase PostgreSQL
 */
export const roundMoney = (num: number): number => {
  if (num === 0 || isNaN(num) || !isFinite(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Validate physical dimensions and return 0 if invalid
 * Prevents NaN and infinite cascades in calculations
 */
export const validateDimensions = (
  length: number,
  width: number,
  thickness?: number,
  depth?: number,
  height?: number
): boolean => {
  if (length <= 0 || width <= 0) return false;
  if (thickness !== undefined && thickness <= 0) return false;
  if (depth !== undefined && depth <= 0) return false;
  if (height !== undefined && height <= 0) return false;
  return true;
};

/**
 * Validate waste factor and return 0 if invalid
 */
export const validateWasteFactor = (wasteFactor: number): boolean => {
  return wasteFactor >= 1 && isFinite(wasteFactor);
};

/**
 * Convert cement kilograms to commercial bags (sacos)
 * Standard Guatemala: 42.5 kg per bag
 * Returns ceiling (round up to nearest whole bag)
 */
export const convertCementToBags = (kilograms: number): number => {
  if (kilograms <= 0 || isNaN(kilograms) || !isFinite(kilograms)) {
    return 0;
  }
  const BAG_WEIGHT_KG = 42.5;
  return Math.ceil(kilograms / BAG_WEIGHT_KG);
};

/**
 * Convert steel kilograms to commercial quintales
 * Standard Guatemala: 46.023 kg per quintal
 * Returns rounded to 2 decimal places
 */
export const convertSteelToQuintales = (kilograms: number): number => {
  if (kilograms <= 0 || isNaN(kilograms) || !isFinite(kilograms)) {
    return 0;
  }
  const QUINTAL_WEIGHT_KG = 46.023;
  return roundMoney(kilograms / QUINTAL_WEIGHT_KG);
};

/**
 * Calculate commercial units for materials
 * Returns appropriate commercial units based on material type
 */
export const calculateCommercialUnits = (
  materialType: 'cement' | 'steel' | 'other',
  quantity: number,
  unit: string
): number => {
  if (quantity <= 0 || isNaN(quantity) || !isFinite(quantity)) {
    return 0;
  }

  switch (materialType) {
    case 'cement':
      if (unit === 'kg' || unit === 'kilogramos') {
        return convertCementToBags(quantity);
      }
      return roundMoney(quantity);
    case 'steel':
      if (unit === 'kg' || unit === 'kilogramos') {
        return convertSteelToQuintales(quantity);
      }
      return roundMoney(quantity);
    default:
      return roundMoney(quantity);
  }
};

/**
 * Validate cost per square meter against project category ranges
 * Returns deviation percentage and warning flag
 */
export interface CostValidationResult {
  isValid: boolean;
  deviationPercentage: number;
  warningMessage?: string;
  isOverBudget: boolean;
  isUnderBudget: boolean;
}

export const COST_RANGES_BY_CATEGORY = {
  Básico: { min: 3000, max: 3500 },
  Moderado: { min: 3500, max: 4000 },
  Premium: { min: 4000, max: 5000 },
};

export const validateCostPerSquareMeter = (
  costPerM2: number,
  category: 'Básico' | 'Moderado' | 'Premium',
  tolerancePercentage: number = 15
): CostValidationResult => {
  const range = COST_RANGES_BY_CATEGORY[category];
  const midPoint = (range.min + range.max) / 2;
  const deviation = ((costPerM2 - midPoint) / midPoint) * 100;
  const absoluteDeviation = Math.abs(deviation);

  const isOverBudget = costPerM2 > range.max;
  const isUnderBudget = costPerM2 < range.min;
  const isValid = absoluteDeviation <= tolerancePercentage;

  let warningMessage: string | undefined;
  if (!isValid) {
    if (isOverBudget) {
      warningMessage = `⚠️ SOBRECOSTO: Q${costPerM2.toFixed(2)}/m² excede el rango ${category} (Q${range.min}-${range.max}). Desviación: ${absoluteDeviation.toFixed(1)}%`;
    } else if (isUnderBudget) {
      warningMessage = `⚠️ SUBESTIMACIÓN: Q${costPerM2.toFixed(2)}/m² está por debajo del rango ${category} (Q${range.min}-${range.max}). Desviación: ${absoluteDeviation.toFixed(1)}%`;
    }
  }

  return {
    isValid,
    deviationPercentage: deviation,
    warningMessage,
    isOverBudget,
    isUnderBudget,
  };
};
