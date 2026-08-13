// Sistema de Tamaños de Iconos Unificado
// Basado en escalas de iconos estándar

export const iconSizes = {
  // Extra pequeño (badges, metadata)
  xs: 'w-3 h-3',
  
  // Pequeño (compact buttons, badges)
  sm: 'w-4 h-4',
  
  // Mediano (botones estándar, inputs, navegación)
  md: 'w-5 h-5',
  
  // Grande (botones grandes, section headers)
  lg: 'w-6 h-6',
  
  // Extra grande (hero elements, logos grandes)
  xl: 'w-8 h-8',
  
  // Muy grande (login logo, hero icons)
  '2xl': 'w-10 h-10',
  
  // Extra extra grande (hero elements especiales)
  '3xl': 'w-12 h-12',
  
  // Enorme (hero icons muy grandes)
  '4xl': 'w-16 h-16',
};

// Clases utilitarias por uso específico
export const iconSizesByUsage = {
  // Navigation
  nav: 'w-5 h-5',
  navSmall: 'w-4 h-4',
  navLarge: 'w-6 h-6',
  
  // Botones
  button: 'w-4 h-4',
  buttonSmall: 'w-3 h-3',
  buttonLarge: 'w-5 h-5',
  
  // Inputs
  input: 'w-5 h-5',
  inputSmall: 'w-4 h-4',
  inputLarge: 'w-6 h-6',
  
  // Badges
  badge: 'w-3 h-3',
  badgeSmall: 'w-2.5 h-2.5',
  
  // Cards
  card: 'w-5 h-5',
  cardSmall: 'w-4 h-4',
  cardLarge: 'w-6 h-6',
  
  // Tables
  table: 'w-4 h-4',
  tableSmall: 'w-3 h-3',
  
  // Forms
  form: 'w-5 h-5',
  formSmall: 'w-4 h-4',
  
  // Status indicators
  status: 'w-4 h-4',
  statusSmall: 'w-3 h-3',
  
  // Hero elements
  hero: 'w-10 h-10',
  heroLarge: 'w-12 h-12',
  
  // Logos
  logo: 'w-8 h-8',
  logoSmall: 'w-6 h-6',
  logoLarge: 'w-10 h-10',
  
  // Action buttons
  action: 'w-5 h-5',
  actionSmall: 'w-4 h-4',
  actionLarge: 'w-6 h-6',
  
  // Tooltips
  tooltip: 'w-4 h-4',
  
  // Modals
  modal: 'w-6 h-6',
  modalLarge: 'w-8 h-8',
  
  // Notifications
  notification: 'w-5 h-5',
  notificationSmall: 'w-4 h-4',
};

// Responsive icon sizes
export const responsiveIconSizes = {
  // Mobile-first responsive
  mobileToDesktop: 'w-4 h-4 sm:w-5 h-5 lg:w-6 h-6',
  
  // Desktop-first responsive
  desktopToMobile: 'w-5 h-5 sm:w-4 h-4 lg:w-5 h-5',
  
  // Compact to spacious
  compactToSpacious: 'w-3 h-3 sm:w-4 h-4 md:w-5 h-5 lg:w-6 h-6',
};