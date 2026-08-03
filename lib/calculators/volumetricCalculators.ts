/**
 * Volumetric and Dimensional Calculators for Construction
 * Guatemalan Standards
 */

import { roundMoney, validateDimensions, validateWasteFactor } from './financialUtils';

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

  // Short-circuit validation
  if (!validateDimensions(length, width, depth, height)) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Volumen Rectangular - Dimensiones inválidas',
    };
  }

  const volume = roundMoney(length * width * (depth || height));
  const surfaceArea = roundMoney(2 * (length * width + length * (depth || height) + width * (depth || height)));
  const perimeter = roundMoney(2 * (length + width));

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

  // Short-circuit validation
  if (diameter <= 0 || (depth <= 0 && height <= 0)) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Volumen Cilíndrico - Dimensiones inválidas',
    };
  }

  const radius = diameter / 2;
  const volume = roundMoney(Math.PI * radius * radius * (depth || height));
  const surfaceArea = roundMoney(2 * Math.PI * radius * (radius + (depth || height)));
  const perimeter = roundMoney(2 * Math.PI * radius);

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

  // Short-circuit validation
  if (baseLength <= 0 || baseWidth <= 0 || topLength <= 0 || topWidth <= 0 || height <= 0) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Volumen Trapezoidal - Dimensiones inválidas',
    };
  }

  const baseArea = baseLength * baseWidth;
  const topArea = topLength * topWidth;
  const volume = roundMoney((height / 3) * (baseArea + topArea + Math.sqrt(baseArea * topArea)));
  const surfaceArea = roundMoney(baseArea + topArea + (baseLength + topLength) * height / 2 + (baseWidth + topWidth) * height / 2);
  const perimeter = roundMoney(2 * (baseLength + baseWidth + topLength + topWidth));

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

  // Short-circuit validation
  if (!validateDimensions(length, width, depth)) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Excavación - Dimensiones inválidas',
    };
  }

  if (!validateWasteFactor(expansionFactor)) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Excavación - Factor de expansión inválido',
    };
  }

  const volume = roundMoney(length * width * depth * expansionFactor);
  const surfaceArea = roundMoney(length * width);
  const perimeter = roundMoney(2 * (length + width));

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

  // Short-circuit validation
  if (length <= 0 || height <= 0) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Área de Muro - Dimensiones inválidas',
    };
  }

  const area = roundMoney(length * height);
  const perimeter = roundMoney(length * 2); // Assuming both sides

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
  if (baseArea <= 0 || coats <= 0) {
    return 0;
  }

  if (!validateWasteFactor(wasteFactor)) {
    return 0;
  }

  return roundMoney(baseArea * coats * wasteFactor);
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
  // Short-circuit validation
  if (!validateDimensions(length, width)) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Área de Piso - Dimensiones inválidas',
    };
  }

  if (!validateWasteFactor(wasteFactor)) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Área de Piso - Factor de desperdicio inválido',
    };
  }

  const area = roundMoney(length * width * wasteFactor);
  const perimeter = roundMoney(2 * (length + width));

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

  // Short-circuit validation
  if (totalHeight <= 0 || treadDepth <= 0 || riserHeight <= 0 || width <= 0) {
    return {
      volume: 0,
      surfaceArea: 0,
      perimeter: 0,
      description: 'Escalera - Dimensiones inválidas',
    };
  }

  const numberOfSteps = Math.floor(totalHeight / riserHeight);
  const actualHeight = roundMoney(numberOfSteps * riserHeight);
  const actualRun = roundMoney(numberOfSteps * treadDepth);

  // Approximate volume (simplified)
  const volume = roundMoney((actualRun * width * actualHeight) / 2); // Triangular prism approximation
  const surfaceArea = roundMoney((actualRun * width) + (numberOfSteps * treadDepth * width) + (numberOfSteps * riserHeight * width));
  const perimeter = roundMoney(2 * (actualRun + width));

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
  // Short-circuit validation
  if (volume <= 0) {
    return {
      cement: 0,
      sand: 0,
      gravel: 0,
      water: 0,
    };
  }

  // Standard Guatemalan mixes (approximate)
  const mixes = {
    '1500': { cement: 5.5, sand: 0.45, gravel: 0.65, water: 140 }, // per m³
    '2000': { cement: 6.5, sand: 0.42, gravel: 0.62, water: 145 },
    '2500': { cement: 7.5, sand: 0.40, gravel: 0.60, water: 150 },
    '3000': { cement: 8.5, sand: 0.38, gravel: 0.58, water: 155 },
  };

  const mix = mixes[strength];
  return {
    cement: roundMoney(mix.cement * volume),
    sand: roundMoney(mix.sand * volume),
    gravel: roundMoney(mix.gravel * volume),
    water: roundMoney(mix.water * volume),
  };
}

/**
 * Calculate mortar mix for masonry
 */
export function calculateMortarMix(area: number, thickness: number = 0.02): ConcreteMix {
  // Short-circuit validation
  if (area <= 0 || thickness <= 0) {
    return {
      cement: 0,
      sand: 0,
      gravel: 0,
      water: 0,
    };
  }

  const volume = roundMoney(area * thickness);
  // Standard mortar mix (1:4 cement:sand)
  return {
    cement: roundMoney(volume * 250), // ~250 kg cement per m³
    sand: roundMoney(volume * 0.8),
    gravel: 0,
    water: roundMoney(volume * 100),
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
  // Short-circuit validation
  if (diameterMM <= 0 || length <= 0 || quantity <= 0) {
    return {
      weight: 0,
      totalLength: 0,
      description: 'Acero - Dimensiones inválidas',
    };
  }

  // Steel density: 7850 kg/m³
  const radius = diameterMM / 2000; // convert to meters
  const crossSectionArea = Math.PI * radius * radius;
  const weightPerMeter = crossSectionArea * 7850;
  const totalWeight = roundMoney(weightPerMeter * length * quantity);
  const totalLength = roundMoney(length * quantity);

  return {
    weight: totalWeight,
    totalLength,
    description: `Acero #${diameterMM}: ${quantity} varillas de ${length}m (${totalWeight} kg)`,
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
  // Short-circuit validation
  if (surfaceArea <= 0) {
    return {
      plywoodSheets: 0,
      lumber: 0,
      description: 'Encofrado - Área inválida',
    };
  }

  if (!validateWasteFactor(reuseFactor)) {
    return {
      plywoodSheets: 0,
      lumber: 0,
      description: 'Encofrado - Factor de reuso inválido',
    };
  }

  // Standard plywood sheet: 1.22m × 2.44m = 2.98m²
  const plywoodArea = 2.98;
  const plywoodSheets = Math.ceil((surfaceArea / plywoodArea) * reuseFactor);

  // Lumber for supports (approximate)
  const lumber = roundMoney(surfaceArea * 0.1); // linear meters per m²

  return {
    plywoodSheets,
    lumber,
    description: `Encofrado: ${plywoodSheets} láminas de plywood, ${lumber}m madera`,
  };
}
