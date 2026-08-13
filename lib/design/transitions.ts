// Sistema de Transiciones Unificado
// Basado en transiciones fluidas y consistentes

export const transitions = {
  // Duraciones
  duration: {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
    slower: 'duration-700',
  },
  
  // Timing functions
  ease: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    bounce: 'ease-bounce',
  },
  
  // Transiciones completas
  all: 'transition-all',
  colors: 'transition-colors',
  transform: 'transition-transform',
  opacity: 'transition-opacity',
  spacing: 'transition-spacing',
  
  // Combinaciones comunes
  standard: 'transition-all duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-500 ease-in-out',
  hover: 'transition-all duration-200 ease-out',
  focus: 'transition-all duration-300 ease-out',
};

// Clases por uso específico
export const transitionsByUsage = {
  // Botones
  button: 'transition-all duration-200 ease-out',
  buttonHover: 'hover:transition-all hover:duration-150 hover:ease-out',
  
  // Inputs
  input: 'transition-all duration-300 ease-in-out',
  inputFocus: 'focus:transition-all focus:duration-200 focus:ease-out',
  
  // Cards
  card: 'transition-all duration-300 ease-in-out',
  cardHover: 'hover:transition-all hover:duration-200 hover:ease-out',
  
  // Modals
  modal: 'transition-all duration-300 ease-in-out',
  modalEnter: 'animate-in fade-in zoom-in duration-300',
  modalExit: 'animate-out fade-out zoom-out duration-200',
  
  // Navigation
  nav: 'transition-all duration-300 ease-in-out',
  navHover: 'hover:transition-all hover:duration-200 hover:ease-out',
  
  // Tabs
  tab: 'transition-all duration-200 ease-out',
  tabActive: 'transition-all duration-300 ease-in-out',
  
  // Dropdowns
  dropdown: 'transition-all duration-200 ease-out',
  dropdownOpen: 'animate-in slide-in-from-top-2 duration-200',
  dropdownClose: 'animate-out slide-out-to-top-2 duration-150',
  
  // Tooltips
  tooltip: 'transition-all duration-200 ease-out',
  tooltipEnter: 'animate-in fade-in zoom-in duration-200',
  tooltipExit: 'animate-out fade-out zoom-out duration-150',
  
  // Alerts
  alert: 'transition-all duration-300 ease-in-out',
  alertEnter: 'animate-in slide-in-from-top-4 duration-300',
  alertExit: 'animate-out slide-out-to-top-4 duration-200',
  
  // Toasts
  toast: 'transition-all duration-300 ease-in-out',
  toastEnter: 'animate-in slide-in-from-right-4 duration-300',
  toastExit: 'animate-out slide-out-to-right-4 duration-200',
  
  // Skeletons
  skeleton: 'animate-pulse duration-1000 ease-in-out',
  
  // Loading
  loading: 'animate-spin duration-1000 linear',
};