/**
 * CONSTRUCTORA WM/M&S - APU LIBRARY SYSTEM
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Standard APU (Análisis de Precios Unitarios) Library
 * 40 default items per typology according to Guatemalan construction standards
 */

export interface APUItem {
  id?: string;
  code: string;
  typology: 'residential' | 'commercial' | 'industrial' | 'civil' | 'public';
  chronological_order: number;
  description: string;
  unit: string;
  default_yield_per_day: number;
  category: string;
}

export interface APUWithCalculations extends APUItem {
  estimated_cost?: number;
  material_cost?: number;
  labor_cost?: number;
  equipment_cost?: number;
}

/**
 * Residential APU Library - 40 Standard Items
 * Organized by category with proper chronological order
 */
export const RESIDENTIAL_APU_LIBRARY: APUItem[] = [
  // MOVIMIENTO DE TIERRAS (1-3)
  {
    code: '1.1',
    typology: 'residential',
    chronological_order: 1,
    description: 'Limpieza y desbroce del terreno',
    unit: 'm2',
    default_yield_per_day: 150.0,
    category: 'movimiento_tierras'
  },
  {
    code: '1.2',
    typology: 'residential',
    chronological_order: 2,
    description: 'Excavación manual para cimientos',
    unit: 'm3',
    default_yield_per_day: 3.0,
    category: 'movimiento_tierras'
  },
  {
    code: '1.3',
    typology: 'residential',
    chronological_order: 3,
    description: 'Relleno y compactación de terreno',
    unit: 'm3',
    default_yield_per_day: 25.0,
    category: 'movimiento_tierras'
  },

  // CIMENTACIONES (4-8)
  {
    code: '2.1',
    typology: 'residential',
    chronological_order: 4,
    description: 'Zapata de concreto armado 1.00x1.00x0.25m',
    unit: 'unidad',
    default_yield_per_day: 2.0,
    category: 'cimentaciones'
  },
  {
    code: '2.2',
    typology: 'residential',
    chronological_order: 5,
    description: 'Cadena de cimentación (cinta) 15x20cm',
    unit: 'ml',
    default_yield_per_day: 20.0,
    category: 'cimentaciones'
  },
  {
    code: '2.3',
    typology: 'residential',
    chronological_order: 6,
    description: 'Impermeabilización de cimientos con asfalto',
    unit: 'm2',
    default_yield_per_day: 50.0,
    category: 'cimentaciones'
  },
  {
    code: '2.4',
    typology: 'residential',
    chronological_order: 7,
    description: 'Drenaje alrededor de cimientos',
    unit: 'ml',
    default_yield_per_day: 40.0,
    category: 'cimentaciones'
  },
  {
    code: '2.5',
    typology: 'residential',
    chronological_order: 8,
    description: 'Replanteo y nivelación de cimientos',
    unit: 'global',
    default_yield_per_day: 1.0,
    category: 'cimentaciones'
  },

  // ESTRUCTURA DE MAMPOSTERÍA (9-14)
  {
    code: '3.1',
    typology: 'residential',
    chronological_order: 9,
    description: 'Muro de block 15x20x40cm levantado',
    unit: 'm2',
    default_yield_per_day: 15.0,
    category: 'mamposteria'
  },
  {
    code: '3.2',
    typology: 'residential',
    chronological_order: 10,
    description: 'Columna de block 15x20x40cm con varilla',
    unit: 'unidad',
    default_yield_per_day: 3.0,
    category: 'mamposteria'
  },
  {
    code: '3.3',
    typology: 'residential',
    chronological_order: 11,
    description: 'Cadena de amarre (dintel) 15x20cm',
    unit: 'ml',
    default_yield_per_day: 18.0,
    category: 'mamposteria'
  },
  {
    code: '3.4',
    typology: 'residential',
    chronological_order: 12,
    description: 'Castillo de concreto armado 15x20cm',
    unit: 'ml',
    default_yield_per_day: 15.0,
    category: 'mamposteria'
  },
  {
    code: '3.5',
    typology: 'residential',
    chronological_order: 13,
    description: 'Aplanado de mortero en muros interiores',
    unit: 'm2',
    default_yield_per_day: 25.0,
    category: 'mamposteria'
  },
  {
    code: '3.6',
    typology: 'residential',
    chronological_order: 14,
    description: 'Aplanado de mortero en muros exteriores',
    unit: 'm2',
    default_yield_per_day: 20.0,
    category: 'mamposteria'
  },

  // LOSAS Y CUBIERTAS (15-20)
  {
    code: '4.1',
    typology: 'residential',
    chronological_order: 15,
    description: 'Losa sólida de concreto 0.10m espesor',
    unit: 'm2',
    default_yield_per_day: 12.0,
    category: 'losas_cubiertas'
  },
  {
    code: '4.2',
    typology: 'residential',
    chronological_order: 16,
    description: 'Losa prefabricada vigueta y bovedilla',
    unit: 'm2',
    default_yield_per_day: 25.0,
    category: 'losas_cubiertas'
  },
  {
    code: '4.3',
    typology: 'residential',
    chronological_order: 17,
    description: 'Losa prefabricada capa de compresión 0.05m',
    unit: 'm2',
    default_yield_per_day: 40.0,
    category: 'losas_cubiertas'
  },
  {
    code: '4.4',
    typology: 'residential',
    chronological_order: 18,
    description: 'Malla electrosoldada 6x6-10/10',
    unit: 'm2',
    default_yield_per_day: 60.0,
    category: 'losas_cubiertas'
  },
  {
    code: '4.5',
    typology: 'residential',
    chronological_order: 19,
    description: 'Pérgola metálica estructural',
    unit: 'm2',
    default_yield_per_day: 8.0,
    category: 'losas_cubiertas'
  },
  {
    code: '4.6',
    typology: 'residential',
    chronological_order: 20,
    description: 'Tejado de teja de barro tradicional',
    unit: 'm2',
    default_yield_per_day: 18.0,
    category: 'losas_cubiertas'
  },

  // ACABADOS INTERIORES (21-28)
  {
    code: '5.1',
    typology: 'residential',
    chronological_order: 21,
    description: 'Piso de loseta cerámica 30x30cm',
    unit: 'm2',
    default_yield_per_day: 12.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.2',
    typology: 'residential',
    chronological_order: 22,
    description: 'Piso de porcelanato 60x60cm',
    unit: 'm2',
    default_yield_per_day: 8.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.3',
    typology: 'residential',
    chronological_order: 23,
    description: 'Piso de mármol natural',
    unit: 'm2',
    default_yield_per_day: 6.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.4',
    typology: 'residential',
    chronological_order: 24,
    description: 'Aplanado fino en paredes interiores',
    unit: 'm2',
    default_yield_per_day: 30.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.5',
    typology: 'residential',
    chronological_order: 25,
    description: 'Pintura látex interior (2 manos)',
    unit: 'm2',
    default_yield_per_day: 40.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.6',
    typology: 'residential',
    chronological_order: 26,
    description: 'Cenefa decorativa interior',
    unit: 'ml',
    default_yield_per_day: 35.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.7',
    typology: 'residential',
    chronological_order: 27,
    description: 'Molduras de yeso interiores',
    unit: 'ml',
    default_yield_per_day: 25.0,
    category: 'acabados_interiores'
  },
  {
    code: '5.8',
    typology: 'residential',
    chronological_order: 28,
    description: 'Plafón de PVC laminado',
    unit: 'm2',
    default_yield_per_day: 15.0,
    category: 'acabados_interiores'
  },

  // ACABADOS EXTERIORES (29-34)
  {
    code: '6.1',
    typology: 'residential',
    chronological_order: 29,
    description: 'Aplanado fino en fachadas',
    unit: 'm2',
    default_yield_per_day: 25.0,
    category: 'acabados_exteriores'
  },
  {
    code: '6.2',
    typology: 'residential',
    chronological_order: 30,
    description: 'Pintura elastomérica exterior',
    unit: 'm2',
    default_yield_per_day: 35.0,
    category: 'acabados_exteriores'
  },
  {
    code: '6.3',
    typology: 'residential',
    chronological_order: 31,
    description: 'Revestimiento de piedra natural',
    unit: 'm2',
    default_yield_per_day: 8.0,
    category: 'acabados_exteriores'
  },
  {
    code: '6.4',
    typology: 'residential',
    chronological_order: 32,
    description: 'Cantera decorativa en fachadas',
    unit: 'm2',
    default_yield_per_day: 10.0,
    category: 'acabados_exteriores'
  },
  {
    code: '6.5',
    typology: 'residential',
    chronological_order: 33,
    description: 'Cornisas y molduras exteriores',
    unit: 'ml',
    default_yield_per_day: 20.0,
    category: 'acabados_exteriores'
  },
  {
    code: '6.6',
    typology: 'residential',
    chronological_order: 34,
    description: 'Impermeabilización de azoteas',
    unit: 'm2',
    default_yield_per_day: 40.0,
    category: 'acabados_exteriores'
  },

  // CARPINTERÍA Y HERRERÍA (35-38)
  {
    code: '7.1',
    typology: 'residential',
    chronological_order: 35,
    description: 'Puerta de madera sólida con marco',
    unit: 'unidad',
    default_yield_per_day: 2.0,
    category: 'carpinteria_herreria'
  },
  {
    code: '7.2',
    typology: 'residential',
    chronological_order: 36,
    description: 'Ventana de aluminio con vidrio',
    unit: 'm2',
    default_yield_per_day: 8.0,
    category: 'carpinteria_herreria'
  },
  {
    code: '7.3',
    typology: 'residential',
    chronological_order: 37,
    description: 'Estructura metálica para cubierta',
    unit: 'kg',
    default_yield_per_day: 15.0,
    category: 'carpinteria_herreria'
  },
  {
    code: '7.4',
    typology: 'residential',
    chronological_order: 38,
    description: 'Barandales de hierro forjado',
    unit: 'ml',
    default_yield_per_day: 12.0,
    category: 'carpinteria_herreria'
  },

  // INSTALACIONES (39-40)
  {
    code: '8.1',
    typology: 'residential',
    chronological_order: 39,
    description: 'Instalación hidráulica completa',
    unit: 'global',
    default_yield_per_day: 1.0,
    category: 'instalaciones'
  },
  {
    code: '8.2',
    typology: 'residential',
    chronological_order: 40,
    description: 'Instalación eléctrica completa',
    unit: 'global',
    default_yield_per_day: 1.0,
    category: 'instalaciones'
  }
];

/**
 * Get APU items by typology
 */
export function getAPUByTypology(typology: APUItem['typology']): APUItem[] {
  return RESIDENTIAL_APU_LIBRARY.filter(item => item.typology === typology);
}

/**
 * Get APU items by category
 */
export function getAPUByCategory(category: string): APUItem[] {
  return RESIDENTIAL_APU_LIBRARY.filter(item => item.category === category);
}

/**
 * Get APU item by code
 */
export function getAPUByCode(code: string): APUItem | undefined {
  return RESIDENTIAL_APU_LIBRARY.find(item => item.code === code);
}

/**
 * Get all APU categories
 */
export function getAPUCategories(): string[] {
  const categories = new Set(RESIDENTIAL_APU_LIBRARY.map(item => item.category));
  return Array.from(categories).sort();
}

/**
 * Calculate estimated duration based on quantity and yield
 */
export function calculateDuration(apuItem: APUItem, quantity: number): number {
  const daysNeeded = quantity / apuItem.default_yield_per_day;
  return Math.ceil(daysNeeded);
}

/**
 * Format APU item for display
 */
export function formatAPUItem(apuItem: APUItem): string {
  return `${apuItem.code} - ${apuItem.description} (${apuItem.unit})`;
}

/**
 * Get APU library for budget calculation
 */
export function getAPULibraryForBudget(typology: APUItem['typology'] = 'residential'): APUItem[] {
  return getAPUByTypology(typology).sort((a, b) => a.chronological_order - b.chronological_order);
}