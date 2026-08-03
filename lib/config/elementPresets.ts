/**
 * Element Presets by Project Typology
 * Guatemalan Construction Standards - Industry-specific coefficients
 */

export interface ElementPreset {
  id: string;
  name: string;
  espesor: number; // Thickness in meters
  desperdicio: number; // Waste factor (1.05 = 5% waste)
  densidadAcero: number; // Steel density kg/m²
  factorCompactacion?: number; // Compaction factor for industrial floors
  descripcion?: string;
}

export interface TypologyPresets {
  [typology: string]: ElementPreset[];
}

/**
 * Presets matrix by project typology
 * Each typology has specific engineering coefficients based on industry standards
 */
export const PRESETS_POR_TIPOLOGIA: TypologyPresets = {
  Residencial: [
    {
      id: 'res-losa',
      name: 'Losa Tradicional Vivienda (10cm)',
      espesor: 0.10,
      desperdicio: 1.05,
      densidadAcero: 4.2,
      descripcion: 'Losa sólida para vivienda residencial estándar',
    },
    {
      id: 'res-losa-12',
      name: 'Losa Reforzada Vivienda (12cm)',
      espesor: 0.12,
      desperdicio: 1.05,
      densidadAcero: 5.0,
      descripcion: 'Losa con mayor refuerzo para áreas de carga',
    },
    {
      id: 'res-zapata',
      name: 'Zapata Confinamiento Estándar',
      espesor: 0.20,
      desperdicio: 1.05,
      densidadAcero: 5.5,
      descripcion: 'Zapata aislada para cimentación residencial',
    },
    {
      id: 'res-losa-prefab',
      name: 'Losa Prefabricada Vigueta y Bovedilla',
      espesor: 0.05, // Compression layer only
      desperdicio: 1.05,
      densidadAcero: 3.5,
      descripcion: 'Sistema prefabricado para entrepisos',
    },
  ],
  Comercial: [
    {
      id: 'com-losa',
      name: 'Losa Comercial Reforzada (15cm)',
      espesor: 0.15,
      desperdicio: 1.08,
      densidadAcero: 6.8,
      descripcion: 'Losa para oficinas y locales comerciales',
    },
    {
      id: 'com-losa-18',
      name: 'Losa Comercial Alta Carga (18cm)',
      espesor: 0.18,
      desperdicio: 1.08,
      densidadAcero: 8.0,
      descripcion: 'Losa para áreas de alta carga comercial',
    },
    {
      id: 'com-zapata',
      name: 'Zapata Comercial Reforzada',
      espesor: 0.25,
      desperdicio: 1.08,
      densidadAcero: 7.5,
      descripcion: 'Cimentación para edificios comerciales',
    },
  ],
  Industrial: [
    {
      id: 'ind-piso',
      name: 'Piso Industrial Alta Resistencia (20cm)',
      espesor: 0.20,
      desperdicio: 1.12,
      densidadAcero: 8.5,
      factorCompactacion: 1.03,
      descripcion: 'Piso para naves industriales y maquinaria pesada',
    },
    {
      id: 'ind-piso-25',
      name: 'Piso Industrial Muy Alta Carga (25cm)',
      espesor: 0.25,
      desperdicio: 1.12,
      densidadAcero: 10.0,
      factorCompactacion: 1.03,
      descripcion: 'Piso para áreas de carga muy pesada',
    },
    {
      id: 'ind-losa',
      name: 'Losa Industrial Estructural (18cm)',
      espesor: 0.18,
      desperdicio: 1.12,
      densidadAcero: 9.5,
      descripcion: 'Losa para estructuras industriales',
    },
  ],
  Civil: [
    {
      id: 'civ-pavimento',
      name: 'Pavimento Rígido Vialidad (22cm)',
      espesor: 0.22,
      desperdicio: 1.10,
      densidadAcero: 10.0,
      descripcion: 'Pavimento de concreto para vías',
    },
    {
      id: 'civ-cimentacion',
      name: 'Cimentación Civil Reforzada',
      espesor: 0.30,
      desperdicio: 1.10,
      densidadAcero: 8.0,
      descripcion: 'Cimentación para obras civiles',
    },
    {
      id: 'civ-losa',
      name: 'Losa Civil Estándar (15cm)',
      espesor: 0.15,
      desperdicio: 1.10,
      densidadAcero: 7.0,
      descripcion: 'Losa para infraestructura civil',
    },
  ],
  Publica: [
    {
      id: 'pub-estandar',
      name: 'Estructura Modular Licitación (12cm)',
      espesor: 0.12,
      desperdicio: 1.05,
      densidadAcero: 6.0,
      descripcion: 'Estructura estándar para proyectos públicos',
    },
    {
      id: 'pub-losa',
      name: 'Losa Pública Reforzada (14cm)',
      espesor: 0.14,
      desperdicio: 1.05,
      densidadAcero: 7.0,
      descripcion: 'Losa para edificios públicos',
    },
    {
      id: 'pub-pavimento',
      name: 'Pavimento Público (18cm)',
      espesor: 0.18,
      desperdicio: 1.05,
      densidadAcero: 8.0,
      descripcion: 'Pavimento para áreas públicas',
    },
  ],
};

/**
 * Get presets for a specific typology
 */
export function getPresetsByTypology(typology: string): ElementPreset[] {
  return PRESETS_POR_TIPOLOGIA[typology] || [];
}

/**
 * Get a specific preset by ID across all typologies
 */
export function getPresetById(presetId: string): ElementPreset | undefined {
  for (const typology in PRESETS_POR_TIPOLOGIA) {
    const preset = PRESETS_POR_TIPOLOGIA[typology].find(p => p.id === presetId);
    if (preset) return preset;
  }
  return undefined;
}

/**
 * Typology labels for UI display
 */
export const TYPOLOGY_LABELS: Record<string, string> = {
  Residencial: 'Residencial',
  Comercial: 'Comercial',
  Industrial: 'Industrial',
  Civil: 'Civil',
  Publica: 'Pública',
};
