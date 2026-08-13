// Sistema de Estados Interactivos Unificado
// Basado en estándares de accesibilidad y UX modernos

export const interactiveStates = {
  // Hover states
  hover: {
    default: 'hover:bg-white/10 hover:text-white',
    subtle: 'hover:bg-white/5 hover:text-white/90',
    prominent: 'hover:bg-white/15 hover:text-white hover:shadow-lg',
    colored: 'hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40',
    danger: 'hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40',
    success: 'hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40',
  },
  
  // Focus states
  focus: {
    default: 'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
    subtle: 'focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/30',
    prominent: 'focus:outline-none focus:ring-3 focus:ring-cyan-500/60 focus:border-cyan-500/60',
    colored: 'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50',
  },
  
  // Active states
  active: {
    default: 'active:bg-white/20 active:scale-95',
    subtle: 'active:bg-white/15 active:scale-98',
    prominent: 'active:bg-white/25 active:scale-95',
  },
  
  // Disabled states
  disabled: {
    default: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    subtle: 'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  },
  
  // Loading states
  loading: {
    default: 'opacity-70 cursor-wait',
    spinner: 'animate-spin',
    pulse: 'animate-pulse',
  },
};

// Clases combinadas por tipo de elemento
export const interactiveStatesByUsage = {
  // Botones
  button: {
    default: 'hover:bg-white/15 hover:shadow-lg active:scale-95 focus:ring-2 focus:ring-cyan-500/50',
    primary: 'hover:from-cyan-500/30 hover:to-violet-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 focus:ring-2 focus:ring-cyan-500/50',
    secondary: 'hover:bg-white/25 hover:shadow-md active:scale-95 focus:ring-2 focus:ring-white/30',
    danger: 'hover:bg-red-500/30 hover:shadow-lg active:scale-95 focus:ring-2 focus:ring-red-500/50',
    ghost: 'hover:bg-white/10 active:bg-white/15 focus:ring-2 focus:ring-white/20',
  },
  
  // Inputs
  input: {
    default: 'hover:border-white/20 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
    error: 'hover:border-red-500/40 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20',
    success: 'hover:border-emerald-500/40 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20',
  },
  
  // Cards
  card: {
    default: 'hover:bg-white/5 hover:shadow-lg active:scale-[1.02] focus:ring-2 focus:ring-cyan-500/20',
    interactive: 'hover:bg-white/10 hover:shadow-xl hover:-translate-y-1 active:scale-95 focus:ring-2 focus:ring-cyan-500/30',
  },
  
  // Navigation items
  nav: {
    default: 'hover:bg-white/10 hover:text-white active:bg-white/15 focus:ring-2 focus:ring-cyan-500/30',
    active: 'bg-cyan-500/20 text-white hover:bg-cyan-500/30 focus:ring-2 focus:ring-cyan-500/40',
  },
  
  // Tabs
  tab: {
    default: 'hover:bg-white/10 active:bg-white/15 focus:ring-2 focus:ring-cyan-500/30',
    active: 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white hover:from-cyan-500/30 hover:to-violet-500/30 focus:ring-2 focus:ring-cyan-500/40',
  },
  
  // List items
  listItem: {
    default: 'hover:bg-white/5 active:bg-white/10 focus:ring-2 focus:ring-cyan-500/20',
    interactive: 'hover:bg-white/10 hover:shadow-md active:scale-[1.01] focus:ring-2 focus:ring-cyan-500/30',
  },
  
  // Badges
  badge: {
    default: 'hover:opacity-80 active:scale-95 focus:ring-2 focus:ring-cyan-500/30',
    interactive: 'hover:scale-105 active:scale-95 cursor-pointer focus:ring-2 focus:ring-cyan-500/30',
  },
  
  // Links
  link: {
    default: 'hover:text-cyan-300 hover:underline focus:ring-2 focus:ring-cyan-500/30 rounded',
    external: 'hover:text-cyan-300 hover:underline focus:ring-2 focus:ring-cyan-500/30 rounded after:content-["↗"] after:ml-1',
  },
};

// Transiciones específicas por estado
export const stateTransitions = {
  hover: 'transition-all duration-200 ease-out',
  focus: 'transition-all duration-200 ease-out',
  active: 'transition-all duration-150 ease-out',
  loading: 'transition-all duration-300 ease-in-out',
};