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
  },
  {
    id: 'RES-026',
    number: 26,
    code: 'GRADAS',
    description: 'Gradas interiores/exteriores',
    unit: 'Escalón',
    formula: 'Concreto + acabado anti-deslizante',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Cantidad_escalones',
      wastePercentage: 5,
      materialUnitCost: 350, // Q/escalón (concreto + acabado)
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 4,
      unit: 'escalón'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-027',
    number: 27,
    code: 'BARANDAL',
    description: 'Barandal de seguridad',
    unit: 'ml',
    formula: 'Tubular metálico o madera según diseño',
    category: 'Carpintería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Longitud_barandal',
      wastePercentage: 10,
      materialUnitCost: 180, // Q/ml tubular + accesorios
      unit: 'ml'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 20,
      unit: 'ml'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-028',
    number: 28,
    code: 'CLOSET',
    description: 'Closets empotrados',
    unit: 'Unidad',
    formula: 'Melamina o madera con puertas',
    category: 'Carpintería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 5,
      materialUnitCost: 3500, // Q/closet completo
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 1,
      unit: 'unid'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-029',
    number: 29,
    code: 'COCINA_INTEGRAL',
    description: 'Cocina integral',
    unit: 'Unidad',
    formula: 'Módulos de melamina + encimera',
    category: 'Carpintería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 5,
      materialUnitCost: 8000, // Q/cocina integral
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 450,
      dailyPerformance: 0.5,
      unit: 'unid'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-030',
    number: 30,
    code: 'EXTRACTOR',
    description: 'Extractor de cocina',
    unit: 'Unidad',
    formula: 'Capacidad CFM según área cocina',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 0,
      materialUnitCost: 1200, // Q/extractor
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
    id: 'RES-031',
    number: 31,
    code: 'CALIENTADOR',
    description: 'Calentador de agua',
    unit: 'Unidad',
    formula: 'Capacidad en litros según ocupantes',
    category: 'Instalaciones',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 0,
      materialUnitCost: 2500, // Q/calentador
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
    id: 'RES-032',
    number: 32,
    code: 'PATIO_LAVADO',
    description: 'Patio de lavado',
    unit: 'm²',
    formula: 'Piso antiderrapante + drenaje',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_patio',
      wastePercentage: 10,
      materialUnitCost: 200, // Q/m² piso + drenaje
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 15,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-033',
    number: 33,
    code: 'FONDO_ESCALERA',
    description: 'Fondo de escalera',
    unit: 'm²',
    formula: 'Cielo falso en área de circulación vertical',
    category: 'Acabados',
    typology: 'residential',
    materialFormula: {
      baseQuantity: 'Área_escalera',
      wastePercentage: 5,
      materialUnitCost: 180, // Q/m² cielo falso
      unit: 'm²'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 350,
      dailyPerformance: 25,
      unit: 'm²'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-034',
    number: 34,
    code: 'PLACARD',
    description: 'Placard de almacenamiento',
    unit: 'Unidad',
    formula: 'Estructura de madera + puertas',
    category: 'Carpintería',
    typology: 'residential',
    materialFormula: {
      baseQuantity: '1',
      wastePercentage: 5,
      materialUnitCost: 2800, // Q/placard
      unit: 'unid'
    },
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
      dailyPerformance: 1,
      unit: 'unid'
    },
    machineryFormula: undefined,
    defaultValues: {
      efficiency: 100
    }
  },
  {
    id: 'RES-035',
    number: 35,
    code: 'ENTREGA_OBRA',
    description: 'Entrega de obra',
    unit: 'Global',
    formula: 'Acta de recepción y garantías',
    category: 'Cierre',
    typology: 'residential',
    materialFormula: undefined,
    laborFormula: {
      crewSize: 2,
      dailySalary: 400,
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
  // Renglones COM-026 a COM-035
  {
    id: 'COM-026',
    number: 26,
    code: 'COUNTER',
    description: 'Counter de atención',
    unit: 'ml',
    formula: 'Madera laminada + cristal templado',
    category: 'Carpintería',
    typology: 'commercial',
    materialFormula: { baseQuantity: 'Longitud_counter', wastePercentage: 5, materialUnitCost: 450, unit: 'ml' },
    laborFormula: { crewSize: 2, dailySalary: 450, dailyPerformance: 8, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-027',
    number: 27,
    code: 'DIVISORIAS',
    description: 'Divisorias de oficina',
    unit: 'm²',
    formula: 'Melamina o vidrio según requerimiento',
    category: 'Mampostería',
    typology: 'commercial',
    materialFormula: { baseQuantity: 'Área_divisoria', wastePercentage: 10, materialUnitCost: 350, unit: 'm²' },
    laborFormula: { crewSize: 2, dailySalary: 400, dailyPerformance: 15, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-028',
    number: 28,
    code: 'PUERTA_EMERGENCIA',
    description: 'Puerta de emergencia',
    unit: 'Unidad',
    formula: 'Antipánico + barra de empuje',
    category: 'Carpintería',
    typology: 'commercial',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 4000, unit: 'unid' },
    laborFormula: { crewSize: 2, dailySalary: 450, dailyPerformance: 2, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-029',
    number: 29,
    code: 'ESCALERAS_METALICAS',
    description: 'Escaleras metálicas',
    unit: 'Escalón',
    formula: 'Acero estructural + pasamanos',
    category: 'Estructura',
    typology: 'commercial',
    materialFormula: { baseQuantity: 'Cantidad_escalones', wastePercentage: 5, materialUnitCost: 600, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 500, dailyPerformance: 3, unit: 'escalón' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-030',
    number: 30,
    code: 'ASCENSOR',
    description: 'Ascensor comercial',
    unit: 'Unidad',
    formula: 'Capacidad en personas y paradas',
    category: 'Instalaciones',
    typology: 'commercial',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 150000, unit: 'unid' },
    laborFormula: { crewSize: 4, dailySalary: 500, dailyPerformance: 0.1, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-031',
    number: 31,
    code: 'SISTEMA_BOMBEROS',
    description: 'Sistema contra incendios (Bomberos)',
    unit: 'Punto',
    formula: 'Gabinetes + mangueras + monitores',
    category: 'Instalaciones',
    typology: 'commercial',
    materialFormula: { baseQuantity: 'Cantidad_puntos', wastePercentage: 5, materialUnitCost: 3500, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 450, dailyPerformance: 1, unit: 'punto' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-032',
    number: 32,
    code: 'CABLE_FIBRA',
    description: 'Cableado de fibra óptica',
    unit: 'ml',
    formula: 'Backbone de datos + conectores',
    category: 'Instalaciones',
    typology: 'commercial',
    materialFormula: { baseQuantity: 'Longitud_fibra', wastePercentage: 15, materialUnitCost: 25, unit: 'ml' },
    laborFormula: { crewSize: 2, dailySalary: 500, dailyPerformance: 100, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-033',
    number: 33,
    code: 'SERVIDOR',
    description: 'Sala de servidores',
    unit: 'Unidad',
    formula: 'Rack + UPS + climatización',
    category: 'Instalaciones',
    typology: 'commercial',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 25000, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 500, dailyPerformance: 0.5, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-034',
    number: 34,
    code: 'CONTROL_ACCESO',
    description: 'Sistema de control de acceso',
    unit: 'Punto',
    formula: 'Tarjetas + lectores + software',
    category: 'Instalaciones',
    typology: 'commercial',
    materialFormula: { baseQuantity: 'Cantidad_puntos', wastePercentage: 5, materialUnitCost: 2000, unit: 'unid' },
    laborFormula: { crewSize: 2, dailySalary: 450, dailyPerformance: 3, unit: 'punto' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'COM-035',
    number: 35,
    code: 'ENTREGA_LLAVES',
    description: 'Entrega de llaves y manuales',
    unit: 'Global',
    formula: 'Documentación operativa completa',
    category: 'Final de Obra',
    typology: 'commercial',
    materialFormula: undefined,
    laborFormula: { crewSize: 2, dailySalary: 400, dailyPerformance: 1, unit: 'global' },
    defaultValues: { efficiency: 100 }
  }
];

// ============================================================================
// TIPOLOGÍA INDUSTRIAL 🏭
// ============================================================================
export const RENGLONES_INDUSTRIAL_DETAILED: APURenglon[] = [
  // Renglones IND-026 a IND-035
  {
    id: 'IND-026',
    number: 26,
    code: 'PLATAFORMA_TRABAJO',
    description: 'Plataforma de trabajo elevada',
    unit: 'm²',
    formula: 'Estructura metálica + piso antiderrapante',
    category: 'Estructura',
    typology: 'industrial',
    materialFormula: { baseQuantity: 'Área_plataforma', wastePercentage: 5, materialUnitCost: 600, unit: 'm²' },
    laborFormula: { crewSize: 4, dailySalary: 500, dailyPerformance: 20, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-027',
    number: 27,
    code: 'TANQUE_COMBUSTIBLE',
    description: 'Tanque de combustible',
    unit: 'Unidad',
    formula: 'Capacidad en galones + sistema bombeo',
    category: 'Instalaciones',
    typology: 'industrial',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 45000, unit: 'unid' },
    laborFormula: { crewSize: 4, dailySalary: 500, dailyPerformance: 0.2, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-028',
    number: 28,
    code: 'SISTEMA_GAS',
    description: 'Sistema de gas industrial',
    unit: 'ml',
    formula: 'Tubería de alta presión + reguladores',
    category: 'Instalaciones',
    typology: 'industrial',
    materialFormula: { baseQuantity: 'Longitud_tubería', wastePercentage: 10, materialUnitCost: 350, unit: 'ml' },
    laborFormula: { crewSize: 3, dailySalary: 500, dailyPerformance: 30, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-029',
    number: 29,
    code: 'COMPRESOR',
    description: 'Compresor de aire principal',
    unit: 'Unidad',
    formula: 'CFM según demanda de neumáticos',
    category: 'Instalaciones',
    typology: 'industrial',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 35000, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 500, dailyPerformance: 0.3, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-030',
    number: 30,
    code: 'SISTEMA_AGUA_PROCESO',
    description: 'Sistema de agua de proceso',
    unit: 'ml',
    formula: 'Tubería + filtros + bombas',
    category: 'Instalaciones',
    typology: 'industrial',
    materialFormula: { baseQuantity: 'Longitud_sistema', wastePercentage: 10, materialUnitCost: 280, unit: 'ml' },
    laborFormula: { crewSize: 3, dailySalary: 500, dailyPerformance: 25, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-031',
    number: 31,
    code: 'TRATAMIENTO_EFLUENTES',
    description: 'Planta de tratamiento de efluentes',
    unit: 'Unidad',
    formula: 'Capacidad m³/día según proceso',
    category: 'Instalaciones',
    typology: 'industrial',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 80000, unit: 'unid' },
    laborFormula: { crewSize: 4, dailySalary: 500, dailyPerformance: 0.1, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-032',
    number: 32,
    code: 'ZONA_CARGA',
    description: 'Zona de carga camiones',
    unit: 'm²',
    formula: 'Piso reforzado + drenaje industrial',
    category: 'Acabados',
    typology: 'industrial',
    materialFormula: { baseQuantity: 'Área_carga', wastePercentage: 5, materialUnitCost: 350, unit: 'm²' },
    laborFormula: { crewSize: 4, dailySalary: 450, dailyPerformance: 50, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-033',
    number: 33,
    code: 'OFICINA_CONTROL',
    description: 'Oficina de control de procesos',
    unit: 'm²',
    formula: 'Estructura + acabados industriales',
    category: 'Acabados',
    typology: 'industrial',
    materialFormula: { baseQuantity: 'Área_oficina', wastePercentage: 5, materialUnitCost: 550, unit: 'm²' },
    laborFormula: { crewSize: 3, dailySalary: 450, dailyPerformance: 20, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-034',
    number: 34,
    code: 'AREAS_ESTACIONAMIENTO',
    description: 'Áreas de estacionamiento',
    unit: 'm²',
    formula: 'Pavimento + demarcación',
    category: 'Acabados',
    typology: 'industrial',
    materialFormula: { baseQuantity: 'Área_estacionamiento', wastePercentage: 5, materialUnitCost: 180, unit: 'm²' },
    laborFormula: { crewSize: 3, dailySalary: 400, dailyPerformance: 40, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'IND-035',
    number: 35,
    code: 'PRUEBAS_OPERAC',
    description: 'Pruebas operacionales',
    unit: 'Global',
    formula: 'Arranque y ajuste de sistemas',
    category: 'Final de Obra',
    typology: 'industrial',
    materialFormula: undefined,
    laborFormula: { crewSize: 4, dailySalary: 500, dailyPerformance: 1, unit: 'global' },
    defaultValues: { efficiency: 100 }
  }
];

// ============================================================================
// TIPOLOGÍA OBRA CIVIL 🌉
// ============================================================================
export const RENGLONES_CIVIL_DETAILED: APURenglon[] = [
  // Renglones OC-026 a OC-035
  {
    id: 'OC-026',
    number: 26,
    code: 'MURO_CONCRETO',
    description: 'Muro de concreto ciclópeo',
    unit: 'm³',
    formula: 'Concreto + piedra + acero de refuerzo',
    category: 'Contención',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Volumen_muro', wastePercentage: 5, materialUnitCost: 700, unit: 'm³' },
    laborFormula: { crewSize: 4, dailySalary: 450, dailyPerformance: 8, unit: 'm³' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-027',
    number: 27,
    code: 'PILOTAJE',
    description: 'Pilotes de concreto',
    unit: 'ml',
    formula: 'Diámetro × profundidad hincado',
    category: 'Cimentación',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Longitud_pilote', wastePercentage: 5, materialUnitCost: 180, unit: 'ml' },
    laborFormula: { crewSize: 4, dailySalary: 500, dailyPerformance: 15, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-028',
    number: 28,
    code: 'VIGUETA',
    description: 'Vigueta y bovedilla',
    unit: 'm²',
    formula: 'Sistema de losa prefabricada',
    category: 'Estructura',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Área_losa', wastePercentage: 5, materialUnitCost: 320, unit: 'm²' },
    laborFormula: { crewSize: 3, dailySalary: 450, dailyPerformance: 40, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-029',
    number: 29,
    code: 'ACERA',
    description: 'Acera peatonal',
    unit: 'm²',
    formula: 'Ancho estándar 1.50m + rampas',
    category: 'Pavimentación',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Área_acera', wastePercentage: 5, materialUnitCost: 180, unit: 'm²' },
    laborFormula: { crewSize: 3, dailySalary: 400, dailyPerformance: 30, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-030',
    number: 30,
    code: 'BORDILLO',
    description: 'Bordillo de concreto',
    unit: 'ml',
    formula: 'Separación calzada-acera',
    category: 'Pavimentación',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Longitud_bordillo', wastePercentage: 5, materialUnitCost: 120, unit: 'ml' },
    laborFormula: { crewSize: 2, dailySalary: 400, dailyPerformance: 50, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-031',
    number: 31,
    code: 'DREN_LATERAL',
    description: 'Drenaje lateral profundo',
    unit: 'ml',
    formula: 'Tubería perforada + grava',
    category: 'Drenaje',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Longitud_drenaje', wastePercentage: 10, materialUnitCost: 250, unit: 'ml' },
    laborFormula: { crewSize: 3, dailySalary: 450, dailyPerformance: 25, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-032',
    number: 32,
    code: 'CANALETAS',
    description: 'Canaletas de desagüe',
    unit: 'ml',
    formula: 'Concreto reforzado en lados',
    category: 'Drenaje',
    typology: 'civil',
    materialFormula: { baseQuantity: 'Longitud_canaleta', wastePercentage: 5, materialUnitCost: 180, unit: 'ml' },
    laborFormula: { crewSize: 2, dailySalary: 400, dailyPerformance: 30, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-033',
    number: 33,
    code: 'SENALIZACION_TEMP',
    description: 'Señalización temporal de obra',
    unit: 'Unidad',
    formula: 'Conos + barreras + luces',
    category: 'Señalización',
    typology: 'civil',
    materialFormula: { baseQuantity: '1', wastePercentage: 10, materialUnitCost: 3500, unit: 'unid' },
    laborFormula: { crewSize: 2, dailySalary: 350, dailyPerformance: 2, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-034',
    number: 34,
    code: 'VEHICULOS_CONTROL',
    description: 'Control de vehículos',
    unit: 'Punto',
    formula: 'Caseta de control + barrieras',
    category: 'Seguridad Vial',
    typology: 'civil',
    materialFormula: { baseQuantity: '1', wastePercentage: 5, materialUnitCost: 15000, unit: 'unid' },
    laborFormula: { crewSize: 2, dailySalary: 400, dailyPerformance: 1, unit: 'punto' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OC-035',
    number: 35,
    code: 'MANTENIMIENTO',
    description: 'Mantenimiento de vía',
    unit: 'Global',
    formula: 'Periodo de garantía contratado',
    category: 'Final de Obra',
    typology: 'civil',
    materialFormula: undefined,
    laborFormula: { crewSize: 3, dailySalary: 400, dailyPerformance: 1, unit: 'global' },
    defaultValues: { efficiency: 100 }
  }
];

// ============================================================================
// TIPOLOGÍA OBRA PÚBLICA 🏛️
// ============================================================================
export const RENGLONES_PUBLIC_DETAILED: APURenglon[] = [
  // Renglones OP-026 a OP-035
  {
    id: 'OP-026',
    number: 26,
    code: 'CERRAMIENTO_PERIM',
    description: 'Cerramiento perimetral',
    unit: 'ml',
    formula: 'Muro de block + alambre/púas',
    category: 'Cerramiento',
    typology: 'public',
    materialFormula: { baseQuantity: 'Longitud_cerramiento', wastePercentage: 5, materialUnitCost: 200, unit: 'ml' },
    laborFormula: { crewSize: 3, dailySalary: 350, dailyPerformance: 25, unit: 'ml' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-027',
    number: 27,
    code: 'PORTON_ACCESO',
    description: 'Portón de acceso vehicular',
    unit: 'Unidad',
    formula: 'Motorizado + control remoto',
    category: 'Carpintería',
    typology: 'public',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 12000, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 450, dailyPerformance: 0.5, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-028',
    number: 28,
    code: 'CASETA_GUARDIA',
    description: 'Caseta de guardia',
    unit: 'Unidad',
    formula: 'Estructura + acabados + sanitario',
    category: 'Estructura',
    typology: 'public',
    materialFormula: { baseQuantity: '1', wastePercentage: 5, materialUnitCost: 25000, unit: 'unid' },
    laborFormula: { crewSize: 4, dailySalary: 400, dailyPerformance: 0.3, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-029',
    number: 29,
    code: 'BODEGA_ALMACEN',
    description: 'Bodega de almacenamiento',
    unit: 'm²',
    formula: 'Concreto + bloque + repello',
    category: 'Estructura',
    typology: 'public',
    materialFormula: { baseQuantity: 'Área_bodega', wastePercentage: 5, materialUnitCost: 500, unit: 'm²' },
    laborFormula: { crewSize: 4, dailySalary: 400, dailyPerformance: 15, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-030',
    number: 30,
    code: 'ESTACIONAMIENTO_PUB',
    description: 'Estacionamiento público',
    unit: 'm²',
    formula: 'Pavimento + demarcación + señalización',
    category: 'Acabados',
    typology: 'public',
    materialFormula: { baseQuantity: 'Área_estacionamiento', wastePercentage: 5, materialUnitCost: 180, unit: 'm²' },
    laborFormula: { crewSize: 3, dailySalary: 400, dailyPerformance: 30, unit: 'm²' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-031',
    number: 31,
    code: 'AREA_DESCANSO',
    description: 'Área de descanso/bancas',
    unit: 'Unidad',
    formula: 'Bancas + sombras + arborización',
    category: 'Paisajismo',
    typology: 'public',
    materialFormula: { baseQuantity: '1', wastePercentage: 5, materialUnitCost: 4500, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 350, dailyPerformance: 2, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-032',
    number: 32,
    code: 'CISTERNADO_PUBLICO',
    description: 'Cisternado público',
    unit: 'm³',
    formula: 'Almacenamiento de agua + sistema bombeo',
    category: 'Instalaciones',
    typology: 'public',
    materialFormula: { baseQuantity: 'Volumen_cisterna', wastePercentage: 5, materialUnitCost: 800, unit: 'm³' },
    laborFormula: { crewSize: 3, dailySalary: 450, dailyPerformance: 5, unit: 'm³' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-033',
    number: 33,
    code: 'PLANTA_ELECTRICA',
    description: 'Planta eléctrica de emergencia',
    unit: 'Unidad',
    formula: 'KVA según carga crítica',
    category: 'Instalaciones',
    typology: 'public',
    materialFormula: { baseQuantity: '1', wastePercentage: 0, materialUnitCost: 80000, unit: 'unid' },
    laborFormula: { crewSize: 3, dailySalary: 500, dailyPerformance: 0.2, unit: 'unid' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-034',
    number: 34,
    code: 'SISTEMA_SEGURIDAD',
    description: 'Sistema de seguridad CCTV',
    unit: 'Punto',
    formula: 'Cámaras + DVR + monitoreo',
    category: 'Instalaciones',
    typology: 'public',
    materialFormula: { baseQuantity: 'Cantidad_cámaras', wastePercentage: 5, materialUnitCost: 3500, unit: 'unid' },
    laborFormula: { crewSize: 2, dailySalary: 450, dailyPerformance: 2, unit: 'punto' },
    defaultValues: { efficiency: 100 }
  },
  {
    id: 'OP-035',
    number: 35,
    code: 'RECEPCION_FINAL',
    description: 'Recepción final por supervisión',
    unit: 'Global',
    formula: 'Acta de recepción + liquidación',
    category: 'Final de Obra',
    typology: 'public',
    materialFormula: undefined,
    laborFormula: { crewSize: 3, dailySalary: 400, dailyPerformance: 1, unit: 'global' },
    defaultValues: { efficiency: 100 }
  }
];

// ============================================================================
// MAPEO POR TIPOLOGÍA
// ============================================================================
export const RENGLONES_BY_TYPOLOGY_DETAILED: Record<ProjectTypology, APURenglon[]> = {
  residential: RENGLONES_RESIDENCIAL_DETAILED,
  commercial: RENGLONES_COMERCIAL_DETAILED,
  industrial: RENGLONES_INDUSTRIAL_DETAILED,
  civil: RENGLONES_CIVIL_DETAILED,
  public: RENGLONES_PUBLIC_DETAILED
};
