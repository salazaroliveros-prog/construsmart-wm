// Sistema de Badges Unificado
// Basado en estándares de diseño y accesibilidad

export const badgeSizes = {
  xs: 'px-1.5 py-0.25 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const badgeShapes = {
  default: 'rounded-md',
  pill: 'rounded-full',
  square: 'rounded-sm',
};

export const badgeVariants = {
  default: 'bg-white/10 text-white/80 border-white/20',
  primary: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  secondary: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
  info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

export const badgeStatus = {
  active: 'bg-emerald-500/30 text-emerald-200 border-emerald-500/40',
  inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  completed: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

// Clases combinadas por uso específico
export const badgeClasses = {
  // Badge estándar
  standard: 'px-2 py-0.5 rounded-md text-xs font-medium',
  
  // Badge pill
  pill: 'px-2 py-0.5 rounded-full text-xs font-medium',
  
  // Badge con hover
  interactive: 'px-2 py-0.5 rounded-md text-xs font-medium hover:scale-105 active:scale-95 cursor-pointer transition-all',
  
  // Badge con icon
  withIcon: 'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
  
  // Badge grande
  large: 'px-3 py-1.5 rounded-lg text-sm font-medium',
  
  // Badge pequeño
  small: 'px-1.5 py-0.25 rounded-md text-[10px] font-medium',
  
  // Badge outline
  outline: 'border-2 border-current bg-transparent',
  
  // Badge de estado
  status: 'px-2 py-0.5 rounded-full text-xs font-medium',
};

// Colores por tipo de badge
export const badgeColors = {
  // Tipo de proyecto
  project: {
    planning: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    execution: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    delayed: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  
  // Tipo de transacción
  transaction: {
    income: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    expense: 'bg-red-500/20 text-red-300 border-red-500/30',
    transfer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  
  // Tipo de prioridad
  priority: {
    low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
    urgent: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  
  // Tipo de severidad
  severity: {
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    critical: 'bg-red-600/20 text-red-200 border-red-600/30',
  },
};

// Helper para obtener clase de badge
export function getBadgeClass(variant: keyof typeof badgeVariants, size: keyof typeof badgeSizes = 'sm', shape: keyof typeof badgeShapes = 'default'): string {
  return `${badgeSizes[size]} ${badgeShapes[shape]} ${badgeVariants[variant]} font-medium`;
}