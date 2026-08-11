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
