// Sistema de Filtros Unificado
// Basado en estándares de UX para interfaces de filtrado

export const filterTypes = {
  // Text filter
  text: {
    type: 'text',
    label: 'Texto',
    placeholder: 'Buscar...',
  },
  
  // Number filter
  number: {
    type: 'number',
    label: 'Número',
    placeholder: '0',
  },
  
  // Date filter
  date: {
    type: 'date',
    label: 'Fecha',
    placeholder: 'DD/MM/YYYY',
  },
  
  // Select filter
  select: {
    type: 'select',
    label: 'Seleccionar',
    placeholder: 'Seleccionar opción',
  },
  
  // Multi-select filter
  multiSelect: {
    type: 'multiSelect',
    label: 'Múltiple',
    placeholder: 'Seleccionar opciones',
  },
  
  // Boolean filter
  boolean: {
    type: 'boolean',
    label: 'Sí/No',
  },
  
  // Range filter
  range: {
    type: 'range',
    label: 'Rango',
    placeholder: 'Min - Max',
  },
};

export const filterOperators = {
  // Text operators
  contains: 'Contiene',
  equals: 'Igual a',
  startsWith: 'Comienza con',
  endsWith: 'Termina con',
  
  // Number operators
  greaterThan: 'Mayor que',
  lessThan: 'Menor que',
  greaterThanOrEqual: 'Mayor o igual que',
  lessThanOrEqual: 'Menor o igual que',
  
  // Date operators
  after: 'Después de',
  before: 'Antes de',
  on: 'En',
  between: 'Entre',
  
  // Boolean operators
  isTrue: 'Es verdadero',
  isFalse: 'Es falso',
};

// Clases para componentes de filtros
export const filterClasses = {
  // Container de filtros
  container: 'flex flex-col gap-4 p-4 bg-white/5 border border-white/10 rounded-lg',
  
  // Header de filtros
  header: 'flex items-center justify-between mb-4',
  
  // Título de filtros
  title: 'text-sm font-medium text-white',
  
  // Input de filtro
  input: 'px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all min-h-[44px]',
  
  // Select de filtro
  select: 'px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all min-h-[44px]',
  
  // Checkbox de filtro
  checkbox: 'w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500/50',
  
  // Botón de aplicar filtros
  applyButton: 'px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all min-h-[44px]',
  
  // Botón de limpiar filtros
  clearButton: 'px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 rounded-lg text-sm font-medium transition-all min-h-[44px]',
  
  // Badge de filtro activo
  activeFilter: 'flex items-center gap-2 px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md text-xs',
  
  // Remove button de filtro
  removeFilter: 'text-white/60 hover:text-white transition-colors',
  
  // Panel de filtros
  panel: 'fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-l border-white/20 shadow-2xl z-50 transition-transform',
  
  // Overlay de filtros
  overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-40',
};

// Estados de filtros
export const filterStates = {
  // Pristine - sin cambios
  pristine: 'border-white/10',
  
  // Dirty - con cambios
  dirty: 'border-cyan-500/30',
  
  // Applied - filtros aplicados
  applied: 'border-emerald-500/30',
  
  // Error - error en filtro
  error: 'border-red-500/30',
};

// Helper para construir query string de filtros
export function buildFilterQuery(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

// Helper para parsear query string a filtros
export function parseFilterQuery(queryString: string): Record<string, any> {
  const params = new URLSearchParams(queryString);
  const filters: Record<string, any> = {};
  
  params.forEach((value, key) => {
    filters[key] = value;
  });
  
  return filters;
}

// Helper para validar filtro
export function validateFilter(filter: any): boolean {
  if (!filter) return false;
  if (filter.value === undefined || filter.value === null || filter.value === '') return false;
  return true;
}

// Helper para contar filtros activos
export function countActiveFilters(filters: Record<string, any>): number {
  return Object.values(filters).filter(validateFilter).length;
}