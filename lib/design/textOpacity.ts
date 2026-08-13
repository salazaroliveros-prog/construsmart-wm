// Sistema de Opacidad de Texto Unificado
// Basado en estándares de contraste y accesibilidad WCAG

export const textOpacity = {
  // Muy tenue (decorativo, footer, elementos no críticos)
  decorative: 'text-white/30',
  
  // Tenue (placeholders, iconos deshabilitados, hints)
  disabled: 'text-white/40',
  
  // Secundario (información no crítica, metadata)
  secondary: 'text-white/60',
  
  // Normal (texto estándar, contenido principal)
  normal: 'text-white/80',
  
  // Destacado (texto importante, enlaces activos)
  highlighted: 'text-white/90',
  
  // Emphasis (texto más importante, headings)
  emphasis: 'text-white',
  
  // Inverso (para fondos claros)
  inverseDecorative: 'text-black/30',
  inverseDisabled: 'text-black/40',
  inverseSecondary: 'text-black/60',
  inverseNormal: 'text-black/80',
  inverseHighlighted: 'text-black/90',
  inverseEmphasis: 'text-black',
};

// Clases utilitarias por uso específico
export const textOpacityByUsage = {
  // Formularios
  formLabel: 'text-white/80',
  formPlaceholder: 'text-white/40',
  formHelper: 'text-white/60',
  formError: 'text-red-400',
  formSuccess: 'text-emerald-400',
  
  // Botones
  buttonText: 'text-white',
  buttonTextSecondary: 'text-white/90',
  buttonTextDisabled: 'text-white/50',
  
  // Navigation
  navItem: 'text-white/80',
  navItemActive: 'text-white',
  navItemDisabled: 'text-white/40',
  
  // Cards
  cardTitle: 'text-white',
  cardSubtitle: 'text-white/80',
  cardContent: 'text-white/70',
  cardMetadata: 'text-white/60',
  
  // Badges
  badgeText: 'text-white/90',
  badgeTextSecondary: 'text-white/70',
  
  // Tables
  tableHeader: 'text-white/80',
  tableContent: 'text-white/70',
  tableMetadata: 'text-white/60',
  
  // Alerts
  alertTitle: 'text-white',
  alertContent: 'text-white/80',
  alertMetadata: 'text-white/60',
  
  // Modals
  modalTitle: 'text-white',
  modalContent: 'text-white/80',
  modalMetadata: 'text-white/60',
  
  // Tooltips
  tooltipText: 'text-white',
  
  // Status indicators
  statusText: 'text-white/80',
  statusTextSmall: 'text-white/60',
  
  // Footers
  footerText: 'text-white/40',
  footerLink: 'text-white/60',
  
  // Metadata
  metadata: 'text-white/60',
  metadataSmall: 'text-white/40',
  
  // Links
  link: 'text-cyan-400',
  linkHover: 'text-cyan-300',
  linkDisabled: 'text-white/40',
  
  // Code
  code: 'text-cyan-400',
  codeSecondary: 'text-cyan-400/70',
};

// Colores de texto con opacidad
export const coloredTextOpacity = {
  // Cyan (primary color)
  cyanDecorative: 'text-cyan-400/30',
  cyanDisabled: 'text-cyan-400/40',
  cyanSecondary: 'text-cyan-400/60',
  cyanNormal: 'text-cyan-400/80',
  cyanHighlighted: 'text-cyan-400/90',
  cyanEmphasis: 'text-cyan-400',
  
  // Violet (secondary color)
  violetDecorative: 'text-violet-400/30',
  violetDisabled: 'text-violet-400/40',
  violetSecondary: 'text-violet-400/60',
  violetNormal: 'text-violet-400/80',
  violetHighlighted: 'text-violet-400/90',
  violetEmphasis: 'text-violet-400',
  
  // Emerald (success)
  emeraldDecorative: 'text-emerald-400/30',
  emeraldDisabled: 'text-emerald-400/40',
  emeraldSecondary: 'text-emerald-400/60',
  emeraldNormal: 'text-emerald-400/80',
  emeraldHighlighted: 'text-emerald-400/90',
  emeraldEmphasis: 'text-emerald-400',
  
  // Red (error, danger)
  redDecorative: 'text-red-400/30',
  redDisabled: 'text-red-400/40',
  redSecondary: 'text-red-400/60',
  redNormal: 'text-red-400/80',
  redHighlighted: 'text-red-400/90',
  redEmphasis: 'text-red-400',
  
  // Amber (warning)
  amberDecorative: 'text-amber-400/30',
  amberDisabled: 'text-amber-400/40',
  amberSecondary: 'text-amber-400/60',
  amberNormal: 'text-amber-400/80',
  amberHighlighted: 'text-amber-400/90',
  amberEmphasis: 'text-amber-400',
};

// Responsive text opacity
export const responsiveTextOpacity = {
  // Mobile-first responsive (más opaco en móvil para legibilidad)
  mobileToDesktop: 'text-white/90 sm:text-white/80 lg:text-white/70',
  
  // Desktop-first responsive
  desktopToMobile: 'text-white/70 sm:text-white/80 lg:text-white/70',
};