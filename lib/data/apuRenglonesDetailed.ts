// ============================================================================
// APU Renglones Catalogo con Fórmulas de Cálculo Detalladas
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Cada renglón tiene fórmulas específicas para cálculo automático
// ============================================================================

import { APURenglon, ProjectTypology } from '@/lib/types/apu';

// ============================================================================
// TIPOLOGÍA RESIDENCIAL 🏠
// ============================================================================
export const RENGLONES_RESIDENCIAL_DETAILED: APURenglon[] = [
  {
    id: 'RES-001',
    number: 1,
    code: 'LIMPIEZA',
    description: 'Limpieza y chapeo',
    unit: 'm²',
    formula: 'Área_terreno',
    category: 'Preparación del Sitio',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_terreno',
      wastePercentage: 0,
      materialUnitCost: 15, // Q/m² para mano de obra de limpieza
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 250,
      dailyPerformance: 150,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-002',
    number: 2,
    code: 'TRAZO',
    description: 'Trazo y nivelación',
    unit: 'm²',
    formula: 'Área_planta. Estacas y cordel.',
    category: 'Preparación del Sitio',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_planta',
      wastePercentage: 5,
      materialUnitCost: 20, // Q/m² para estacas, cordel, nivelación
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 3,
      dailySalary: 300,
      dailyPerformance: 100,
      unit: 'm²'
    },
    machineryFormula: {
      equipmentType: 'Niveladora láser',
      hourlyCost: 150,
      hourlyRate: 200,
      unit: 'm²'
    },
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-003',
    number: 3,
    code: 'EXCAVACION',
    description: 'Excavación de cimiento',
    unit: 'm³',
    formula: 'Ancho × Profundidad × Largo',
    category: 'Cimentación',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Volumen_corte',
      wastePercentage: 15,
      materialUnitCost: 0, // excavación, no material directo
      unit: 'm³'
    },
    laborFormula: {
      crewSize: 4,
      dailySalary: 350,
      dailyPerformance: 8,
      unit: 'm³'
    },
    machineryFormula: {
      equipmentType: 'Miniexcavadora',
      hourlyCost: 400,
      hourlyRate: 10,
      unit: 'm³'
    },
    defaultValues: {
      efficiency: 95
    }
  },
  {
    id: 'RES-004',
    number: 4,
    code: 'CIMIENTO',
    description: 'Cimiento corrido',
    unit: 'm³',
    formula: 'Concreto + Acero por metro lineal',
    category: 'Cimentación',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Volumen_cimiento',
      wastePercentage: 5,
      materialUnitCost: 650, // Q/m³ concreto 3000psi
      unit: 'm³'
    },
    laborFormula: {
      crewSize: 4,
      dailySalary: 400,
      dailyPerformance: 6,
      unit: 'm³'
    },
    machineryFormula: {
      equipmentType: 'Vibradora',
      hourlyCost: 100,
      hourlyRate: 20,
      unit: 'm³'
    },
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-005',
    number: 5,
    code: 'REFUERZO_V',
    description: 'Refuerzo vertical (Columnas)',
    unit: 'kg',
    formula: 'Longitud varilla × peso nominal',
    category: 'Estructura',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Peso_acero',
      wastePercentage: 5,
      materialUnitCost: 8.5, // Q/kg acero de refuerzo
      unit: 'kg'
    },
    laborFormula: {
      crewSize: 3,
      dailySalary: 450,
      dailyPerformance: 500,
      unit: 'kg'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-006',
    number: 6,
    code: 'IMPERMEABILIZACION',
    description: 'Impermeabilización cimientos',
    unit: 'm²',
    formula: 'Área de contacto con el suelo',
    category: 'Cimentación',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_impermeabilización',
      wastePercentage: 10,
      materialUnitCost: 45, // Q/m² impermeabilizante asfáltico
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 80,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-007',
    number: 7,
    code: 'MURO_BLOCK',
    description: 'Muro de block/ladrillo',
    unit: 'm²',
    formula: 'Unidades/m² (considerando sisa de 1.5cm)',
    category: 'Mampostería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_muro',
      wastePercentage: 10,
      materialUnitCost: 4, // Q/block incluido
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 40,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 95
    }
  },
  {
    id: 'RES-008',
    number: 8,
    code: 'SOLERA',
    description: 'Solera de amarre',
    unit: 'm',
    formula: 'Concreto y acero transversal',
    category: 'Estructura',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Volumen_solera',
      wastePercentage: 5,
      materialUnitCost: 700, // Q/m³ concreto
      unit: 'm³'
    },
    laborFormula: {
      crewSize: 3,
      dailySalary: 400,
      dailyPerformance: 15,
      unit: 'm'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-009',
    number: 9,
    code: 'RELLENO',
    description: 'Relleno compactado',
    unit: 'm³',
    formula: 'Volumen × Factor_abundamiento',
    category: 'Cimentación',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Volumen_relleno',
      wastePercentage: 10,
      materialUnitCost: 0, // tierra compactada, no material
      unit: 'm³'
    },
    laborFormula: {
      crewSize: 4,
      dailySalary: 350,
      dailyPerformance: 12,
      unit: 'm³'
    },
    machineryFormula: {
      equipmentType: 'Compactadora',
      hourlyCost: 350,
      hourlyRate: 25,
      unit: 'm³'
    },
    defaultValues: {
      efficiency: 95
    }
  },
  {
    id: 'RES-010',
    number: 10,
    code: 'HIDRAULICA_BASE',
    description: 'Instalación hidráulica base',
    unit: 'ml',
    formula: 'Longitud de tubería + % accesorios',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Longitud_tubería',
      wastePercentage: 15,
      materialUnitCost: 120, // Q/ml tubería PVC
      unit: 'ml'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 300,
      dailyPerformance: 30,
      unit: 'ml'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-011',
    number: 11,
    code: 'DRENAJES',
    description: 'Drenajes sanitarios',
    unit: 'ml',
    formula: 'Pendiente mínima y excavación por tramo',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Longitud_drenaje',
      wastePercentage: 10,
      materialUnitCost: 150, // Q/ml tubería PVC sanitaria
      unit: 'ml'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 25,
      unit: 'ml'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-012',
    number: 12,
    code: 'VIGA_CARGA',
    description: 'Viga de carga',
    unit: 'm³',
    formula: 'Acero longitudinal + estribos',
    category: 'Estructura',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Volumen_viga',
      wastePercentage: 5,
      materialUnitCost: 700, // Q/m³ concreto
      unit: 'm³'
    },
    laborFormula: {
      crewSize: 3,
      dailySalary: 450,
      dailyPerformance: 8,
      unit: 'm³'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-013',
    number: 13,
    code: 'LOSA_ENTREPISO',
    description: 'Losa de entrepiso',
    unit: 'm²',
    formula: 'Espesor × área (acero 2 direcciones)',
    category: 'Estructura',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Volumen_losa',
      wastePercentage: 5,
      materialUnitCost: 750, // Q/m³ concreto 3500psi
      unit: 'm³'
    },
    laborFormula: {
      crewSize: 4,
      dailySalary: 400,
      dailyPerformance: 30,
      unit: 'm²'
    },
    machineryFormula: {
      equipmentType: 'Bomba concreto',
      hourlyCost: 200,
      hourlyRate: 50,
      unit: 'm²'
    },
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-014',
    number: 14,
    code: 'ELECTRICA',
    description: 'Instalación eléctrica',
    unit: 'Punto',
    formula: 'Ducto y cable por salida',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Cantidad_puntos',
      wastePercentage: 10,
      materialUnitCost: 200, // Q/punto (cable, ducto, caja)
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 8,
      unit: 'Punto'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-015',
    number: 15,
    code: 'RELLO',
    description: 'Repello de muros',
    unit: 'm²',
    formula: 'Área neta (descontando vanos)',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_repello',
      wastePercentage: 5,
      materialUnitCost: 50, // Q/m² para repello fino
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 40,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-016',
    number: 16,
    code: 'CERNIDO',
    description: 'Cernido/Acabado fino',
    unit: 'm²',
    formula: 'Rendimiento por saco de mezcla fina',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_cernido',
      wastePercentage: 5,
      materialUnitCost: 60, // Q/m² para acabado fino
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 300,
      dailyPerformance: 50,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-017',
    number: 17,
    code: 'PISO_CERAMICO',
    description: 'Piso cerámico',
    unit: 'm²',
    formula: 'Área × (1 + %Desperdicio) + pegamento',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_piso',
      wastePercentage: 10,
      materialUnitCost: 85, // Q/m² cerámico
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 30,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-018',
    number: 18,
    code: 'AZULEJO',
    description: 'Azulejo en baños',
    unit: 'm²',
    formula: 'Altura instalación × perímetro',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_azulejo',
      wastePercentage: 15,
      materialUnitCost: 150, // Q/m² azulejo
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 450,
      dailyPerformance: 20,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 95
    }
  },
  {
    id: 'RES-019',
    number: 19,
    code: 'CIELO_FALSO',
    description: 'Cielo falso',
    unit: 'm²',
    formula: 'Suspensión y estructura de soporte',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_cielo',
      wastePercentage: 5,
      materialUnitCost: 180, // Q/m² cielo falso
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 35,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-020',
    number: 20,
    code: 'PUERTA',
    description: 'Puertas de madera/metal',
    unit: 'Unidad',
    formula: 'Marco, chapa y bisagras',
    category: 'Carpintería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 0,
      materialUnitCost: 2500, // Q/puerta
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 2,
      unit: 'unid'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-021',
    number: 21,
    code: 'VENTANA',
    description: 'Ventanas de aluminio',
    unit: 'm²',
    formula: 'Medidas de vano en plano',
    category: 'Carpintería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_ventana',
      wastePercentage: 10,
      materialUnitCost: 350, // Q/m² ventana aluminio
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 450,
      dailyPerformance: 15,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-022',
    number: 22,
    code: 'PINTURA',
    description: 'Pintura látex',
    unit: 'm²',
    formula: 'Área × Num_manos / Rendimiento galón',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_pintura',
      wastePercentage: 10,
      materialUnitCost: 45, // Q/m² por mano (incluye pintura)
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 60,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-023',
    number: 23,
    code: 'ARTEFACTO',
    description: 'Artefactos sanitarios',
    unit: 'Unidad',
    formula: 'Inodoro, lavamanos, grifería',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 0,
      materialUnitCost: 800, // Q/artefacto
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 3,
      unit: 'unid'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-024',
    number: 24,
    code: 'ILUMINACION',
    description: 'Iluminación',
    unit: 'Unidad',
    formula: 'Lámparas según diseño eléctrico',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 0,
      materialUnitCost: 300, // Q/lámpara
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 5,
      unit: 'unid'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-025',
    number: 25,
    code: 'LIMPIEZA_FINAL',
    description: 'Limpieza final',
    unit: 'Global',
    formula: 'Retiro de ripio y limpieza de vidrios',
    category: 'Cierre',
    typology: 'residential',
    materialFormula: undefined,
    laborFormula: {
      crewSize: 4,
      dailySalary: 300,
      dailyPerformance: 1,
      unit: 'global'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  }
];

// ============================================================================
// TIPOLOGÍA COMERCIAL 🏢
// ============================================================================
export const RENGLONES_COMERCIAL_DETAILED: APURenglon[] = [
  {
    id: 'COM-001',
    number: 1,
    code: 'CERRAMIENTO',
    description: 'Cerramiento provisional',
    unit: 'ml',
    formula: 'Perímetro del local/terreno',
    category: 'Preparación',
    typology: 'commercial',
    materialFormula: {
      baseQuantity: 'Perímetro_cerramiento',
      wastePercentage: 5,
      materialUnitCost: 80, // Q/ml plywood lámina
      unit: 'ml'
    },
    laborFormula: {
      crewSize: 3,
      dailySalary: 400,
      dailyPerformance: 40,
      unit: 'ml'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  // ... (resto de renglones comerciales, industriales, obra civil, obra pública con fórmulas similares)
];

// ============================================================================
// MAPEO POR TIPOLOGÍA
// ============================================================================
export const RENGLONES_BY_TYPOLOGY_DETAILED: Record<ProjectTypology, APURenglon[]> = {
  residential: RENGLONES_RESIDENCIAL_DETAILED,
  commercial: RENGLONES_COMERCIAL_DETAILED,
  industrial: [], // completar después
  civil: [], // completar después
  public: [] // completar después
};
