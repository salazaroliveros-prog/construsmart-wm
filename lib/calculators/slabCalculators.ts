/**
 * Structural Calculators for Guatemalan Construction Standards
 * Based on INSTRUCCIONES_SISTEMA_WM_MS-v2.md specifications
 */

import { roundMoney, validateDimensions, validateWasteFactor } from './financialUtils';

export interface SlabCalculationResult {
  concreteVolume: number;
  steelWeight: number;
  formworkArea: number;
  compressionLayerVolume?: number;
  electroweldedMeshArea?: number;
  viguetasLength?: number;
  bovedillasCount?: number;
  boardFeet?: number; // Pies tablares de madera (pérgola de madera)
  tileCount?: number; // Unidades de teja / cerámica / porcelanato
  description: string;
}

export interface SlabDimensions {
  length: number;
  width: number;
  thickness?: number;
  slabType: 'solid' | 'prefabricated' | 'metal_pergola' | 'wood_pergola' | 'clay_tile';
}

/**
 * Losa Sólida Traditional (h = 0.10m to 0.12m)
 * Concrete Volume: V = Area × Thickness × 1.05 (5% waste)
 * Steel (#3 @ 0.15m both ways): ~8.5 kg/m²
 * Formwork (Encofrado de Madera): 1.15 × Area
 */
export function calculateSolidSlab(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width, thickness = 0.10 } = dimensions;

  // Short-circuit validation
  if (!validateDimensions(length, width, thickness)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Losa Sólida - Dimensiones inválidas',
    };
  }

  const WASTE_FACTOR = 1.05;
  if (!validateWasteFactor(WASTE_FACTOR)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Losa Sólida - Factor de desperdicio inválido',
    };
  }

  const area = length * width;
  const concreteVolume = roundMoney(area * thickness * WASTE_FACTOR);
  const steelWeight = roundMoney(area * 8.5); // kg/m²
  const formworkArea = roundMoney(area * 1.15);

  return {
    concreteVolume,
    steelWeight,
    formworkArea,
    description: `Losa Sólida ${thickness}m - ${roundMoney(area)}m²`,
  };
}

/**
 * Losa Prefabricada (Vigueta y Bovedilla)
 * Viguetas: Length = Area / 0.70m
 * Bovedillas: 5.2 units/m²
 * Compression Layer Concrete (h=0.05m): V = Area × 0.05 × 1.05
 * Electrowelded Mesh (Malla Electrosoldada 6x6-10/10): Area × 1.10
 */
export function calculatePrefabricatedSlab(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;

  // Short-circuit validation
  if (!validateDimensions(length, width)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Losa Prefabricada - Dimensiones inválidas',
    };
  }

  const WASTE_FACTOR = 1.05;
  if (!validateWasteFactor(WASTE_FACTOR)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Losa Prefabricada - Factor de desperdicio inválido',
    };
  }

  const area = length * width;
  const compressionLayerThickness = 0.05;

  const viguetasLength = roundMoney(area / 0.70);
  const bovedillasCount = roundMoney(area * 5.2);
  const compressionLayerVolume = roundMoney(area * compressionLayerThickness * WASTE_FACTOR);
  const electroweldedMeshArea = roundMoney(area * 1.10);

  return {
    concreteVolume: compressionLayerVolume,
    steelWeight: 0, // Calculated separately for mesh
    formworkArea: 0, // Minimal for prefabricated
    compressionLayerVolume,
    electroweldedMeshArea,
    viguetasLength,
    bovedillasCount,
    description: `Losa Prefabricada Vigueta y Bovedilla - ${roundMoney(area)}m²`,
  };
}

/**
 * Pérgola Metálica
 * Main Beams (Tubo Estructural 4"x4" x 1/8"): 0.85 m/m²
 * Secondary Joists (Tubo Estructural 2"x4"): 1.80 m/m²
 */
export function calculateMetalPergola(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;

  // Short-circuit validation
  if (!validateDimensions(length, width)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Pérgola Metálica - Dimensiones inválidas',
    };
  }

  const area = length * width;
  const mainBeamsLength = roundMoney(area * 0.85);
  const secondaryJoistsLength = roundMoney(area * 1.80);

  return {
    concreteVolume: 0,
    steelWeight: roundMoney(mainBeamsLength + secondaryJoistsLength), // Approximate steel weight
    formworkArea: 0,
    description: `Pérgola Metálica - ${roundMoney(area)}m²`,
  };
}

/**
 * Pérgola de Madera
 * Wood Beams (Conacaste/Pino Tratado): 12 board-feet (pies tablares) per m²
 */
export function calculateWoodPergola(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;

  // Short-circuit validation
  if (!validateDimensions(length, width)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Pérgola de Madera - Dimensiones inválidas',
    };
  }

  const area = length * width;
  const boardFeet = roundMoney(area * 12);

  return {
    concreteVolume: 0,
    steelWeight: 0,
    formworkArea: 0,
    boardFeet,
    description: `Pérgola de Madera - ${roundMoney(area)}m² (${boardFeet} pies tablares)`,
  };
}

/**
 * Tejado (Teja de Barro)
 * Clay Tiles (Teja de Barro Estándar): 32 to 36 units/m²
 */
export function calculateClayTileRoof(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;

  // Short-circuit validation
  if (!validateDimensions(length, width)) {
    return {
      concreteVolume: 0,
      steelWeight: 0,
      formworkArea: 0,
      description: 'Tejado Teja de Barro - Dimensiones inválidas',
    };
  }

  const area = length * width;
  const tilesCount = roundMoney(area * 34); // Average of 32-36

  return {
    concreteVolume: 0,
    steelWeight: 0,
    formworkArea: 0,
    tileCount: tilesCount,
    description: `Tejado Teja de Barro - ${roundMoney(area)}m² (${tilesCount} tejas)`,
  };
}

/**
 * Main calculator function that routes to specific calculator based on slab type
 */
export function calculateSlab(dimensions: SlabDimensions): SlabCalculationResult {
  switch (dimensions.slabType) {
    case 'solid':
      return calculateSolidSlab(dimensions);
    case 'prefabricated':
      return calculatePrefabricatedSlab(dimensions);
    case 'metal_pergola':
      return calculateMetalPergola(dimensions);
    case 'wood_pergola':
      return calculateWoodPergola(dimensions);
    case 'clay_tile':
      return calculateClayTileRoof(dimensions);
    default:
      return calculateSolidSlab(dimensions);
  }
}

/**
 * Calculate total cost based on unit prices
 */
export interface SlabCostParams {
  concretePricePerM3: number;
  steelPricePerKg: number;
  formworkPricePerM2: number;
  meshPricePerM2?: number;
  viguetaPricePerM?: number;
  bovedillaPricePerUnit?: number;
  woodPricePerBoardFoot?: number;
  tilePricePerUnit?: number;
}

export function calculateSlabCost(
  result: SlabCalculationResult,
  params: SlabCostParams
): number {
  let total_cost = 0;

  // Concrete cost
  if (result.concreteVolume > 0) {
    total_cost += result.concreteVolume * params.concretePricePerM3;
  }

  // Steel cost
  if (result.steelWeight > 0) {
    total_cost += result.steelWeight * params.steelPricePerKg;
  }

  // Formwork cost
  if (result.formworkArea > 0) {
    total_cost += result.formworkArea * params.formworkPricePerM2;
  }

  // Electrowelded mesh cost
  if (result.electroweldedMeshArea && params.meshPricePerM2) {
    total_cost += result.electroweldedMeshArea * params.meshPricePerM2;
  }

  // Viguetas cost
  if (result.viguetasLength && params.viguetaPricePerM) {
    total_cost += result.viguetasLength * params.viguetaPricePerM;
  }

  // Bovedillas cost
  if (result.bovedillasCount && params.bovedillaPricePerUnit) {
    total_cost += result.bovedillasCount * params.bovedillaPricePerUnit;
  }

  // Wood cost (pies tablares): usa el campo estructurado cuando está
  // disponible; de lo contrario se extrae la cantidad entre paréntesis.
  if (params.woodPricePerBoardFoot && (result.boardFeet !== undefined || result.description.includes('pies tablares'))) {
    const boardFeet = result.boardFeet !== undefined
      ? result.boardFeet
      : parseDescriptionCount(result.description);
    total_cost += boardFeet * params.woodPricePerBoardFoot;
  }

  // Tiles cost (teja / cerámica / porcelanato): misma lógica de cantidad.
  if (params.tilePricePerUnit && (result.tileCount !== undefined || result.description.includes('tejas'))) {
    const tiles = result.tileCount !== undefined
      ? result.tileCount
      : parseDescriptionCount(result.description);
    total_cost += tiles * params.tilePricePerUnit;
  }

  return roundMoney(total_cost);
}

/**
 * Extrae la cantidad (número) encerrada entre paréntesis de la descripción,
 * p.ej. "(120 pies tablares)" → 120. Previene NaN ante descripciones vacías.
 */
function parseDescriptionCount(description: string): number {
  if (!description) return 0;
  const match = description.match(/\((\d+(?:\.\d+)?)/);
  const value = match ? parseFloat(match[1]) : 0;
  return isFinite(value) ? value : 0;
}
