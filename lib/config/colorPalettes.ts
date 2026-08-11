/**
 * CONSTRUCTORA WM/M&S - PALETAS DE COLORES CENTRALIZADAS
 * Slogan: "CONSTRUYENDO EL FUTURO"
 *
 * Paletas de colores consistentes para toda la aplicación
 * Utilizadas en módulos de Finanzas, Warehouse, Payroll, etc.
 */

// Colores principales de la marca
export const BRAND_COLORS = {
  cyan: '#06b6d4',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
  blue: '#3b82f6',
} as const;

// Colores con mejor contraste para modo oscuro (WCAG AA compliant)
export const HIGH_CONTRAST_COLORS = {
  cyan: '#67e8f9',      // cyan-300 (mejor que cyan-400)
  emerald: '#6ee7b7',   // emerald-300
  violet: '#c4b5fd',    // violet-300
  amber: '#fcd34d',     // amber-300
  red: '#fca5a5',       // red-300
  blue: '#93c5fd',      // blue-300
  rose: '#fda4af',      // rose-300
  orange: '#fdba74',    // orange-300
} as const;

// Colores para badges con contraste mejorado
export const BADGE_COLORS = {
  cyan: { bg: 'rgba(6, 182, 212, 0.3)', text: '#a5f3fc', border: 'rgba(6, 182, 212, 0.4)' },
  emerald: { bg: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.4)' },
  violet: { bg: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd', border: 'rgba(139, 92, 246, 0.4)' },
  amber: { bg: 'rgba(245, 158, 11, 0.3)', text: '#fcd34d', border: 'rgba(245, 158, 11, 0.4)' },
  red: { bg: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.4)' },
  blue: { bg: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.4)' },
  rose: { bg: 'rgba(244, 63, 94, 0.3)', text: '#fda4af', border: 'rgba(244, 63, 94, 0.4)' },
  orange: { bg: 'rgba(249, 115, 22, 0.3)', text: '#fdba74', border: 'rgba(249, 115, 22, 0.4)' },
} as const;

// Categorías de transacciones financieras
export const FINANCIAL_CATEGORY_COLORS: Record<string, string> = {
  materiales: BRAND_COLORS.cyan,
  mano_de_obra: BRAND_COLORS.emerald,
  herramienta: BRAND_COLORS.violet,
  sub_contrato: BRAND_COLORS.amber,
  administrativo: BRAND_COLORS.slate,
  personal: BRAND_COLORS.blue,
  transporte: BRAND_COLORS.red,
  fijos: BRAND_COLORS.slate,
  hogar: BRAND_COLORS.violet,
  aporte: BRAND_COLORS.emerald,
  trabajos_extra: BRAND_COLORS.amber,
  gastos_operativos_nomina: BRAND_COLORS.red,
} as const;

// Unidades de almacén
export const WAREHOUSE_UNIT_COLORS: Record<string, string> = {
  kg: BRAND_COLORS.cyan,
  lb: BRAND_COLORS.cyan,
  m: BRAND_COLORS.emerald,
  m2: BRAND_COLORS.emerald,
  m3: BRAND_COLORS.violet,
  unidad: BRAND_COLORS.amber,
  bolsa: BRAND_COLORS.slate,
  saco: BRAND_COLORS.slate,
  pieza: BRAND_COLORS.blue,
  rollo: BRAND_COLORS.violet,
  litro: BRAND_COLORS.blue,
  galón: BRAND_COLORS.blue,
} as const;

// Categorías de empleados (Payroll)
export const PAYROLL_CATEGORY_COLORS: Record<string, string> = {
  obrero: BRAND_COLORS.cyan,
  empleado: BRAND_COLORS.violet,
} as const;

// Estados de órdenes de compra
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: BRAND_COLORS.amber,
  approved: BRAND_COLORS.cyan,
  ordered: BRAND_COLORS.violet,
  received: BRAND_COLORS.emerald,
  cancelled: BRAND_COLORS.red,
} as const;

// Estados de proyectos
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: BRAND_COLORS.amber,
  execution: BRAND_COLORS.cyan,
  paused: BRAND_COLORS.slate,
  completed: BRAND_COLORS.emerald,
} as const;

// Tipologías de proyectos
export const PROJECT_TYPOLOGY_COLORS: Record<string, string> = {
  residential: BRAND_COLORS.cyan,
  commercial: BRAND_COLORS.violet,
  industrial: BRAND_COLORS.blue,
  civil: BRAND_COLORS.emerald,
  public: BRAND_COLORS.amber,
} as const;

// Helper para obtener color de categoría financiera
export const getFinancialCategoryColor = (category: string): string => {
  return FINANCIAL_CATEGORY_COLORS[category] || BRAND_COLORS.slate;
};

// Helper para obtener color de unidad de almacén
export const getWarehouseUnitColor = (unit: string): string => {
  return WAREHOUSE_UNIT_COLORS[unit] || BRAND_COLORS.slate;
};

// Helper para obtener color de categoría de empleado
export const getPayrollCategoryColor = (category: string): string => {
  return PAYROLL_CATEGORY_COLORS[category] || BRAND_COLORS.slate;
};

// Helper para obtener color de estado de orden
export const getOrderStatusColor = (status: string): string => {
  return ORDER_STATUS_COLORS[status] || BRAND_COLORS.slate;
};

// Helper para obtener color de estado de proyecto
export const getProjectStatusColor = (status: string): string => {
  return PROJECT_STATUS_COLORS[status] || BRAND_COLORS.slate;
};

// Helper para obtener color de tipología de proyecto
export const getProjectTypologyColor = (typology: string): string => {
  return PROJECT_TYPOLOGY_COLORS[typology] || BRAND_COLORS.slate;
};

// Helper para obtener color de alto contraste
export const getHighContrastColor = (color: keyof typeof HIGH_CONTRAST_COLORS): string => {
  return HIGH_CONTRAST_COLORS[color] || HIGH_CONTRAST_COLORS.cyan;
};

// Helper para obtener estilos de badge con contraste mejorado
export const getBadgeStyles = (color: keyof typeof BADGE_COLORS): {
  bg: string;
  text: string;
  border: string;
} => {
  return BADGE_COLORS[color] || BADGE_COLORS.cyan;
};
