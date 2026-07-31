/**
 * Volumetric and Dimensional Calculators for Construction
 * Guatemalan Standards
 */

export interface VolumeResult {
  volume: number;
  surfaceArea: number;
  perimeter: number;
  description: string;
}

export interface DimensionalParams {
  length: number;
  width: number;
  depth?: number;
  height?: number;
  diameter?: number;
}

/**
 * Calculate rectangular prism volume (cimentaciones, columnas, vigas)
 */
export function calculateRectangularVolume(params: DimensionalParams): VolumeResult {
  const { length, width, depth = 0, height = 0 } = params;
  const volume = length * width * (depth || height);
  const surfaceArea = 2 * (length * width + length * (depth || height) + width * (depth || height));
  const perimeter = 2 * (length + width);

  return {
    volume,
    surfaceArea,
    perimeter,
    description: `Volumen Rectangular: ${length}m × ${width}m × ${depth || height}m`,
  };
}

/**
 * Calculate cylindrical volume (pilotes, columnas circulares)
 */
export function calculateCylindricalVolume(params: DimensionalParams): VolumeResult {
  const { diameter = 0, depth = 0, height = 0 } = params;
  const radius = diameter / 2;
  const volume = Math.PI * radius * radius * (depth || height);
  const surfaceArea = 2 * Math.PI * radius * (radius + (depth || height));
  const perimeter = 2 * Math.PI * radius;

  return {
    volume,
    surfaceArea,
    perimeter,
    description: `Volumen Cilíndrico: Ø${diameter}m × ${depth || height}m`,
  };
}

/**
 * Calculate trapezoidal volume (zapatas, estribos)
 * Volume = (Height/3) × (BaseArea + TopArea + √(BaseArea × TopArea))
 */
export interface TrapezoidalParams {
  baseLength: number;
  baseWidth: number;
  topLength: number;
  topWidth: number;
  height: number;
}

export function calculateTrapezoidalVolume(params: TrapezoidalParams): VolumeResult {
  const { baseLength, baseWidth, topLength, topWidth, height } = params;
  const baseArea = baseLength * baseWidth;
  const topArea = topLength * topWidth;
  const volume = (height / 3) * (baseArea + topArea + Math.sqrt(baseArea * topArea));
  const surfaceArea = baseArea + topArea + (baseLength + topLength) * height / 2 + (baseWidth + topWidth) * height / 2;
  const perimeter = 2 * (baseLength + baseWidth + topLength + topWidth);

  return {
    volume,
    surfaceArea,
    perimeter,
    description: `Volumen Trapezoidal: ${baseLength}×${baseWidth}m → ${topLength}×${topWidth}m × ${height}m`,
  };
}

/**
 * Calculate excavation volume for foundations
 * Includes expansion factor for soil
 */
export function calculateExcavationVolume(
  params: DimensionalParams,
  expansionFactor: number = 1.2
): VolumeResult {
  const { length, width, depth = 0 } = params;
  const volume = length * width * depth * expansionFactor;
  const surfaceArea = length * width;
  const perimeter = 2 * (length + width);

  return {
    volume,
    surfaceArea,
    perimeter,
    description: `Excavación: ${length}m × ${width}m × ${depth}m (factor ${expansionFactor})`,
  };
}

/**
 * Calculate wall area for masonry
 */
export function calculateWallArea(params: DimensionalParams): VolumeResult {
  const { length, height = 0 } = params;
  const area = length * height;
  const perimeter = length * 2; // Assuming both sides

  return {
    volume: area, // Using volume field for area
    surfaceArea: area,
    perimeter,
    description: `Área de Muro: ${length}m × ${height}m`,
  };
}

/**
 * Calculate paint/coating area
 * Accounts for multiple coats and waste
 */
export function calculatePaintArea(
  baseArea: number,
  coats: number = 2,
  wasteFactor: number = 1.1
): number {
  return baseArea * coats * wasteFactor;
}

/**
 * Calculate flooring area
 * Includes waste factor for cuts
 */
export function calculateFlooringArea(
  length: number,
  width: number,
  wasteFactor: number = 1.1
): VolumeResult {
  const area = length * width * wasteFactor;
  const perimeter = 2 * (length + width);

  return {
    volume: area,
    surfaceArea: area,
    perimeter,
    description: `Área de Piso: ${length}m × ${width}m (factor ${wasteFactor})`,
  };
}

/**
 * Calculate stair dimensions and volume
 */
export interface StairParams {
  totalHeight: number;
  totalRun: number;
  treadDepth: number;
  riserHeight: number;
  width: number;
}

export function calculateStairs(params: StairParams): VolumeResult {
  const { totalHeight, totalRun, treadDepth, riserHeight, width } = params;
  
  const numberOfSteps = Math.floor(totalHeight / riserHeight);
  const actualHeight = numberOfSteps * riserHeight;
  const actualRun = numberOfSteps * treadDepth;
  
  // Approximate volume (simplified)
  const volume = (actualRun * width * actualHeight) / 2; // Triangular prism approximation
  const surfaceArea = (actualRun * width) + (numberOfSteps * treadDepth * width) + (numberOfSteps * riserHeight * width);
  const perimeter = 2 * (actualRun + width);

  return {
    volume,
    surfaceArea,
    perimeter,
    description: `Escalera: ${numberOfSteps} escalones, ${actualHeight}m alto × ${actualRun}m largo`,
  };
}

/**
 * Guatemalan standard concrete mix calculations
 */
export interface ConcreteMix {
  cement: number; // bags
  sand: number; // m³
  gravel: number; // m³
  water: number; // liters
}

export function calculateConcreteMix(volume: number, strength: '1500' | '2000' | '2500' | '3000'): ConcreteMix {
  // Standard Guatemalan mixes (approximate)
  const mixes = {
    '1500': { cement: 5.5, sand: 0.45, gravel: 0.65, water: 140 }, // per m³
    '2000': { cement: 6.5, sand: 0.42, gravel: 0.62, water: 145 },
    '2500': { cement: 7.5, sand: 0.40, gravel: 0.60, water: 150 },
    '3000': { cement: 8.5, sand: 0.38, gravel: 0.58, water: 155 },
  };

  const mix = mixes[strength];
  return {
    cement: (mix.cement * volume).toFixed(1) as unknown as number,
    sand: mix.sand * volume,
    gravel: mix.gravel * volume,
    water: mix.water * volume,
  };
}

/**
 * Calculate mortar mix for masonry
 */
export function calculateMortarMix(area: number, thickness: number = 0.02): ConcreteMix {
  const volume = area * thickness;
  // Standard mortar mix (1:4 cement:sand)
  return {
    cement: (volume * 250).toFixed(1) as unknown as number, // ~250 kg cement per m³
    sand: volume * 0.8,
    gravel: 0,
    water: volume * 100,
  };
}

/**
 * Calculate rebar weight and length
 */
export function calculateRebar(diameterMM: number, length: number, quantity: number = 1): {
  weight: number;
  totalLength: number;
  description: string;
} {
  // Steel density: 7850 kg/m³
  const radius = diameterMM / 2000; // convert to meters
  const crossSectionArea = Math.PI * radius * radius;
  const weightPerMeter = crossSectionArea * 7850;
  const totalWeight = weightPerMeter * length * quantity;
  const totalLength = length * quantity;

  return {
    weight: totalWeight,
    totalLength,
    description: `Acero #${diameterMM}: ${quantity} varillas de ${length}m (${totalWeight.toFixed(2)} kg)`,
  };
}

/**
 * Calculate formwork (encofrado) requirements
 */
export function calculateFormwork(
  surfaceArea: number,
  reuseFactor: number = 1.0
): {
  plywoodSheets: number;
  lumber: number;
  description: string;
} {
  // Standard plywood sheet: 1.22m × 2.44m = 2.98m²
  const plywoodArea = 2.98;
  const plywoodSheets = (surfaceArea / plywoodArea) * reuseFactor;
  
  // Lumber for supports (approximate)
  const lumber = surfaceArea * 0.1; // linear meters per m²

  return {
    plywoodSheets: Math.ceil(plywoodSheets),
    lumber: lumber.toFixed(1) as unknown as number,
    description: `Encofrado: ${Math.ceil(plywoodSheets)} láminas de plywood, ${lumber.toFixed(1)}m madera`,
  };
}
