// ============================================================================
// APU (Análisis de Precios Unitarios) - Types and Interfaces
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// ============================================================================

export type ProjectTypology = 'residencial' | 'comercial' | 'industrial' | 'obra_civil' | 'obra_publica';

export interface APURenglon {
  id: string;
  number: number;
  code: string;
  description: string;
  unit: string;
  formula: string;
  category: string;
  typology: ProjectTypology;
}

export interface APUFormulaParams {
  // Input parameters
  theoreticalQuantity: number;        // Cantidad Teórica
  wastePercentage: number;            // % Desperdicio (0-100)
  volumetricFactor: number;           // Factor Volumétrico (Abundamiento/Contracción)
  crewDailySalary: number;            // Salario Diario Cuadrilla (Q)
  dailyPerformance: number;           // Rendimiento Diario (Unidades/Día)
  indirectPercentage: number;         // % Gastos Indirectos (0-100)
  materialUnitCost?: number;          // Costo unitario del material (Q)
  machineryCost?: number;            // Costo de maquinaria (Q)
}

export interface APUResult {
  // Calculated values
  totalMaterialQuantity: number;      // Cantidad Total de Material
  unitLaborCost: number;             // Costo Unitario Mano de Obra
  directCost: number;                // Costo Directo (CD)
  indirectCost: number;              // Costo Indirecto (CI)
  totalCost: number;                 // Costo Total del Renglón
  breakdown: {
    materials: number;
    labor: number;
    machinery: number;
  };
}

export interface APUProjectData {
  projectId: string;
  typology: ProjectTypology;
  budgetId?: string;
  topographyData?: {
    volumeCut: number;               // Volúmenes de corte (m³)
    volumeFill: number;              // Volúmenes de relleno (m³)
    terrainArea: number;             // Área de terreno (m²)
  };
  totalDirectCost: number;
  totalIndirectCost: number;
  totalCost: number;
  calculatedAt: string;
}

export interface MaterialFactor {
  soilType: string;
  abundanceFactor: number;           // Factor de Abundamiento (1.25-1.50)
  contractionFactor: number;         // Factor de Contracción (0.85-0.95)
}

export const MATERIAL_FACTORS: Record<string, MaterialFactor> = {
  'tierra_organica': { soilType: 'Tierra Orgánica', abundanceFactor: 1.25, contractionFactor: 0.90 },
  'arena': { soilType: 'Arena', abundanceFactor: 1.20, contractionFactor: 0.92 },
  'grava': { soilType: 'Grava', abundanceFactor: 1.15, contractionFactor: 0.94 },
  'roca_blanda': { soilType: 'Roca Blanda', abundanceFactor: 1.40, contractionFactor: 0.95 },
  'roca_dura': { soilType: 'Roca Dura', abundanceFactor: 1.50, contractionFactor: 0.95 },
};

export const TYPOLOGY_LABELS: Record<ProjectTypology, string> = {
  residencial: 'Residencial 🏠',
  comercial: 'Comercial 🏢',
  industrial: 'Industrial 🏭',
  obra_civil: 'Obra Civil / Vial 🌉',
  obra_publica: 'Obra Pública 🏛️',
};
