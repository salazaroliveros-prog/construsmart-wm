// Sistema de Espaciado Unificado
// Basado en escalas de espaciado de 4px (tailwind default)

export const spacing = {
  // Horizontal padding
  paddingX: {
    none: 'px-0',
    xs: 'px-1',
    sm: 'px-2',
    md: 'px-3',
    lg: 'px-4',
    xl: 'px-6',
    '2xl': 'px-8',
  },
  
  // Vertical padding
  paddingY: {
    none: 'py-0',
    xs: 'py-1',
    sm: 'py-2',
    md: 'py-3',
    lg: 'py-4',
    xl: 'py-6',
    '2xl': 'py-8',
  },
  
  // Padding completo
  padding: {
    none: 'p-0',
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
    '2xl': 'p-8',
  },
  
  // Gaps entre elementos
  gap: {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
    '2xl': 'gap-8',
  },
  
  // Espaciado vertical en listas
  spaceY: {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
    xl: 'space-y-6',
    '2xl': 'space-y-8',
  },
  
  // Espaciado horizontal en listas
  spaceX: {
    none: 'space-x-0',
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-3',
    lg: 'space-x-4',
    xl: 'space-x-6',
    '2xl': 'space-x-8',
  },
  
  // Margins
  margin: {
    none: 'm-0',
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-3',
    lg: 'm-4',
    xl: 'm-6',
    '2xl': 'm-8',
  },
  
  // Margin horizontal
  marginX: {
    none: 'mx-0',
    xs: 'mx-1',
    sm: 'mx-2',
    md: 'mx-3',
    lg: 'mx-4',
    xl: 'mx-6',
    '2xl': 'mx-8',
  },
  
  // Margin vertical
  marginY: {
    none: 'my-0',
    xs: 'my-1',
    sm: 'my-2',
    md: 'my-3',
    lg: 'my-4',
    xl: 'my-6',
    '2xl': 'my-8',
  },
};

// Clases utilitarias por uso específico
export const spacingByUsage = {
  // Formularios
  formGroup: 'space-y-4',
  formInput: 'px-4 py-3',
  formLabel: 'mb-2',
  
  // Botones
  button: 'px-4 py-3',
  buttonSmall: 'px-3 py-2',
  buttonLarge: 'px-6 py-4',
  
  // Cards
  card: 'p-4',
  cardCompact: 'p-3',
  cardLarge: 'p-6',
  
  // Tabs
  tab: 'px-3 py-2.5',
  tabCompact: 'px-2 py-2',
  
  // Badges
  badge: 'px-2 py-0.5',
  badgeSmall: 'px-1.5 py-0.25',
  
  // Modals
  modal: 'p-6',
  modalLarge: 'p-8',
  
  // Tables
  tableCell: 'px-4 py-3',
  tableHeader: 'px-4 py-3',
  
  // Lists
  listItem: 'py-2',
  listItemCompact: 'py-1',
  
  // Navigation
  navItem: 'px-3 py-3',
  navItemCompact: 'px-2 py-2',
  
  // Sections
  section: 'py-6',
  sectionCompact: 'py-4',
  sectionLarge: 'py-8',
};

// Responsive spacing
export const responsiveSpacing = {
  // Mobile-first responsive
  mobileToDesktop: 'p-3 sm:p-4 lg:p-6',
  
  // Desktop-first responsive
  desktopToMobile: 'p-4 sm:p-3 lg:p-4',
  
  // Compact to spacious
  compactToSpacious: 'p-2 sm:p-3 md:p-4 lg:p-6',
};

// Touch targets (accesibilidad)
export const touchTargets = {
  // Mínimo accesible (44px)
  minimum: 'min-h-[44px] min-w-[44px]',
  
  // Recomendado para móvil (48px)
  recommended: 'min-h-[48px] min-w-[48px]',
  
  // Cómodo (52px)
  comfortable: 'min-h-[52px] min-w-[52px]',
  
  // Grande (56px)
  large: 'min-h-[56px] min-w-[56px]',
  
  // Extra grande (64px)
  extraLarge: 'min-h-[64px] min-w-[64px]',
};