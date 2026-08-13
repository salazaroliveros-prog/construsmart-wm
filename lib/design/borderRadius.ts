// Sistema de Border-Radius Unificado
// Basado en estándares de diseño modernos

export const borderRadius = {
  // Ningún borde
  none: 'rounded-none',
  
  // Pequeño (compacto - badges, small buttons)
  sm: 'rounded-sm',
  
  // Mediano (estándar para inputs, botones normales)
  md: 'rounded-md',
  
  // Grande (cards, panels estándar)
  lg: 'rounded-lg',
  
  // Extra grande (modales, panels grandes)
  xl: 'rounded-xl',
  
  // Muy grande (login, hero elements)
  '2xl': 'rounded-2xl',
  
  // Extra extra grande (elementos hero especiales)
  '3xl': 'rounded-3xl',
  
  // Circular (badges circulares, avatares)
  full: 'rounded-full',
};

// Clases utilitarias por uso específico
export const borderRadiusByUsage = {
  // Formularios
  input: 'rounded-md',
  inputSmall: 'rounded-sm',
  inputLarge: 'rounded-lg',
  
  // Botones
  button: 'rounded-md',
  buttonSmall: 'rounded-sm',
  buttonLarge: 'rounded-lg',
  buttonPill: 'rounded-full',
  
  // Cards
  card: 'rounded-lg',
  cardCompact: 'rounded-md',
  cardLarge: 'rounded-xl',
  
  // Panels
  panel: 'rounded-lg',
  panelLarge: 'rounded-xl',
  
  // Modals
  modal: 'rounded-xl',
  modalLarge: 'rounded-2xl',
  
  // Badges
  badge: 'rounded-md',
  badgePill: 'rounded-full',
  badgeSmall: 'rounded-sm',
  
  // Avatares
  avatar: 'rounded-full',
  avatarSquare: 'rounded-lg',
  
  // Containers
  container: 'rounded-lg',
  containerLarge: 'rounded-xl',
  
  // Hero elements
  hero: 'rounded-2xl',
  heroLarge: 'rounded-3xl',
  
  // Navigation
  navItem: 'rounded-lg',
  navItemPill: 'rounded-full',
  
  // Tabs
  tab: 'rounded-lg',
  tabPill: 'rounded-full',
  
  // Dropdowns
  dropdown: 'rounded-lg',
  dropdownItem: 'rounded-md',
  
  // Tooltips
  tooltip: 'rounded-md',
  
  // Alerts
  alert: 'rounded-lg',
  alertSmall: 'rounded-md',
};

// Responsive border-radius
export const responsiveBorderRadius = {
  // Mobile-first responsive
  mobileToDesktop: 'rounded-md sm:rounded-lg lg:rounded-xl',
  
  // Desktop-first responsive
  desktopToMobile: 'rounded-lg sm:rounded-md lg:rounded-lg',
  
  // Compact to spacious
  compactToSpacious: 'rounded-sm sm:rounded-md md:rounded-lg lg:rounded-xl',
};