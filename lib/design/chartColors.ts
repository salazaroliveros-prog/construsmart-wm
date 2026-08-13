// Sistema de Colores para Gráficos Unificado
// Basado en paletas de colores accesibles y consistentes

export const chartColors = {
  // Paleta principal (para datos principales)
  primary: {
    cyan: '#06b6d4',
    violet: '#8b5cf6',
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
    blue: '#3b82f6',
    orange: '#f97316',
  },
  
  // Paleta secundaria (para datos secundarios)
  secondary: {
    cyan: '#22d3ee',
    violet: '#a78bfa',
    emerald: '#34d399',
    amber: '#fbbf24',
    red: '#f87171',
    pink: '#f472b6',
    blue: '#60a5fa',
    orange: '#fb923c',
  },
  
  // Paleta de fondo (para fondos de gráficos)
  background: {
    primary: 'rgba(6, 182, 212, 0.1)',
    secondary: 'rgba(139, 92, 246, 0.1)',
    success: 'rgba(16, 185, 129, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
  },
  
  // Paleta de estado (para indicadores de estado)
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    neutral: '#6b7280',
  },
  
  // Paleta para múltiples series de datos
  series: [
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#3b82f6', // blue
    '#f97316', // orange
  ],
  
  // Paleta para gradientes
  gradients: {
    primary: ['rgba(6, 182, 212, 0.8)', 'rgba(139, 92, 246, 0.8)'],
    success: ['rgba(16, 185, 129, 0.8)', 'rgba(6, 182, 212, 0.8)'],
    warning: ['rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
    error: ['rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)'],
  },
};

// Clases Tailwind para gráficos
export const chartClasses = {
  // Chart container
  container: 'w-full h-full',
  
  // Chart grid
  grid: 'stroke-white/10',
  
  // Chart axis
  axis: 'stroke-white/20',
  axisText: 'fill-white/60 text-xs',
  
  // Chart tooltip
  tooltip: 'bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl',
  tooltipText: 'text-white text-sm',
  
  // Chart legend
  legend: 'flex items-center gap-2 text-xs text-white/60',
  legendItem: 'flex items-center gap-2',
  legendColor: 'w-3 h-3 rounded-full',
  
  // Chart animations
  animation: 'transition-all duration-300 ease-in-out',
};

// Colores por tipo de gráfico
export const chartColorsByType = {
  // Line charts
  line: {
    stroke: chartColors.primary.cyan,
    fill: chartColors.background.primary,
    point: chartColors.primary.cyan,
  },
  
  // Bar charts
  bar: {
    fill: chartColors.primary.violet,
    hover: chartColors.secondary.violet,
  },
  
  // Pie charts
  pie: chartColors.series,
  
  // Area charts
  area: {
    fill: chartColors.background.primary,
    stroke: chartColors.primary.cyan,
  },
  
  // Scatter plots
  scatter: {
    fill: chartColors.primary.emerald,
    stroke: chartColors.primary.emerald,
  },
};

// Colores por categoría de datos
export const chartColorsByCategory = {
  // Financial data
  financial: {
    income: chartColors.primary.emerald,
    expense: chartColors.primary.red,
    profit: chartColors.primary.cyan,
    loss: chartColors.primary.amber,
  },
  
  // Project data
  project: {
    planning: chartColors.primary.blue,
    execution: chartColors.primary.cyan,
    completed: chartColors.primary.emerald,
    delayed: chartColors.primary.amber,
    cancelled: chartColors.primary.red,
  },
  
  // Status data
  status: {
    active: chartColors.primary.cyan,
    inactive: chartColors.status.neutral,
    pending: chartColors.primary.amber,
    completed: chartColors.primary.emerald,
    failed: chartColors.primary.red,
  },
};

// Función para obtener color por índice
export function getChartColor(index: number, palette: keyof typeof chartColors = 'primary'): string {
  const colors = Object.values(chartColors[palette]);
  return colors[index % colors.length];
}

// Función para obtener color de serie
export function getSeriesColor(index: number): string {
  return chartColors.series[index % chartColors.series.length];
}

// Función para obtener color de estado
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    success: chartColors.status.success,
    warning: chartColors.status.warning,
    error: chartColors.status.error,
    info: chartColors.status.info,
    neutral: chartColors.status.neutral,
  };
  return statusMap[status] || chartColors.status.neutral;
}