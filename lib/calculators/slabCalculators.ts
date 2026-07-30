/**
 * Structural Calculators for Guatemalan Construction Standards
 * Based on INSTRUCCIONES_SISTEMA_WM_MS-v2.md specifications
 */

export interface SlabCalculationResult {
  concreteVolume: number;
  steelWeight: number;
  formworkArea: number;
  compressionLayerVolume?: number;
  electroweldedMeshArea?: number;
  viguetasLength?: number;
  bovedillasCount?: number;
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
  const area = length * width;
  const concreteVolume = area * thickness * 1.05; // 5% waste
  const steelWeight = area * 8.5; // kg/m²
  const formworkArea = area * 1.15;

  return {
    concreteVolume,
    steelWeight,
    formworkArea,
    description: `Losa Sólida ${thickness}m - ${area.toFixed(2)}m²`,
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
  const area = length * width;
  const compressionLayerThickness = 0.05;
  
  const viguetasLength = area / 0.70;
  const bovedillasCount = area * 5.2;
  const compressionLayerVolume = area * compressionLayerThickness * 1.05;
  const electroweldedMeshArea = area * 1.10;

  return {
    concreteVolume: compressionLayerVolume,
    steelWeight: 0, // Calculated separately for mesh
    formworkArea: 0, // Minimal for prefabricated
    compressionLayerVolume,
    electroweldedMeshArea,
    viguetasLength,
    bovedillasCount,
    description: `Losa Prefabricada Vigueta y Bovedilla - ${area.toFixed(2)}m²`,
  };
}

/**
 * Pérgola Metálica
 * Main Beams (Tubo Estructural 4"x4" x 1/8"): 0.85 m/m²
 * Secondary Joists (Tubo Estructural 2"x4"): 1.80 m/m²
 */
export function calculateMetalPergola(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;
  const area = length * width;
  
  const mainBeamsLength = area * 0.85;
  const secondaryJoistsLength = area * 1.80;

  return {
    concreteVolume: 0,
    steelWeight: mainBeamsLength + secondaryJoistsLength, // Approximate steel weight
    formworkArea: 0,
    description: `Pérgola Metálica - ${area.toFixed(2)}m²`,
  };
}

/**
 * Pérgola de Madera
 * Wood Beams (Conacaste/Pino Tratado): 12 board-feet (pies tablares) per m²
 */
export function calculateWoodPergola(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;
  const area = length * width;
  
  const boardFeet = area * 12;

  return {
    concreteVolume: 0,
    steelWeight: 0,
    formworkArea: 0,
    description: `Pérgola de Madera - ${area.toFixed(2)}m² (${boardFeet.toFixed(0)} pies tablares)`,
  };
}

/**
 * Tejado (Teja de Barro)
 * Clay Tiles (Teja de Barro Estándar): 32 to 36 units/m²
 */
export function calculateClayTileRoof(dimensions: SlabDimensions): SlabCalculationResult {
  const { length, width } = dimensions;
  const area = length * width;
  
  const tilesCount = area * 34; // Average of 32-36

  return {
    concreteVolume: 0,
    steelWeight: 0,
    formworkArea: 0,
    description: `Tejado Teja de Barro - ${area.toFixed(2)}m² (${tilesCount.toFixed(0)} tejas)`,
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
  let totalCost = 0;

  // Concrete cost
  if (result.concreteVolume > 0) {
    totalCost += result.concreteVolume * params.concretePricePerM3;
  }

  // Steel cost
  if (result.steelWeight > 0) {
    totalCost += result.steelWeight * params.steelPricePerKg;
  }

  // Formwork cost
  if (result.formworkArea > 0) {
    totalCost += result.formworkArea * params.formworkPricePerM2;
  }

  // Electrowelded mesh cost
  if (result.electroweldedMeshArea && params.meshPricePerM2) {
    totalCost += result.electroweldedMeshArea * params.meshPricePerM2;
  }

  // Viguetas cost
  if (result.viguetasLength && params.viguetaPricePerM) {
    totalCost += result.viguetasLength * params.viguetaPricePerM;
  }

  // Bovedillas cost
  if (result.bovedillasCount && params.bovedillaPricePerUnit) {
    totalCost += result.bovedillasCount * params.bovedillaPricePerUnit;
  }

  // Wood cost
  if (params.woodPricePerBoardFoot && result.description.includes('pies tablares')) {
    const boardFeet = parseFloat(result.description.match(/\d+/)?.[0] || '0');
    totalCost += boardFeet * params.woodPricePerBoardFoot;
  }

  // Tiles cost
  if (params.tilePricePerUnit && result.description.includes('tejas')) {
    const tiles = parseFloat(result.description.match(/\d+/)?.[0] || '0');
    totalCost += tiles * params.tilePricePerUnit;
  }

  return totalCost;
}
