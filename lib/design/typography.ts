// Sistema de Tipografía Unificado
// Basado en escalas de tipografía modernas y accesibles

export const typography = {
  // Display (títulos grandes - hero elements, page titles)
  display: 'text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight',
  
  // Heading (títulos de sección - card headers, section titles)
  heading: 'text-lg sm:text-xl lg:text-2xl font-semibold leading-tight',
  
  // Subheading (subtítulos - card subtitles, secondary titles)
  subheading: 'text-base sm:text-lg font-medium leading-normal',
  
  // Body (texto principal - content, descriptions)
  body: 'text-sm sm:text-base leading-relaxed',
  
  // Caption (pequeño/secondary - metadata, helpers)
  caption: 'text-xs sm:text-sm leading-relaxed',
  
  // Label (etiquetas de formularios - form labels)
  label: 'text-sm font-medium leading-normal',
  
  // Micro (badges, metadata - very small text)
  micro: 'text-[10px] sm:text-[11px] leading-tight',
  
  // Button (texto de botones)
  button: 'text-sm sm:text-base font-medium leading-normal',
  
  // Code (código, monospace)
  code: 'text-xs sm:text-sm font-mono leading-relaxed',
};

// Clases utilitarias para tamaños específicos
export const textSize = {
  // Sizes
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  
  // Weights
  weightLight: 'font-light',
  weightNormal: 'font-normal',
  weightMedium: 'font-medium',
  weightSemibold: 'font-semibold',
  weightBold: 'font-bold',
  
  // Leading
  leadingTight: 'leading-tight',
  leadingNormal: 'leading-normal',
  leadingRelaxed: 'leading-relaxed',
  leadingLoose: 'leading-loose',
};

// Responsive helper para texto
export const responsiveText = {
  // Mobile-first responsive text
  mobileToDesktop: 'text-sm sm:text-base lg:text-lg',
  
  // Desktop-first responsive text
  desktopToMobile: 'text-base sm:text-sm lg:text-base',
  
  // Small to large
  smallToLarge: 'text-xs sm:text-sm md:text-base lg:text-lg',
};

// Clases específicas por uso
export const textByUsage = {
  // Page titles
  pageTitle: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
  
  // Section headers
  sectionHeader: 'text-lg sm:text-xl lg:text-2xl font-semibold',
  
  // Card titles
  cardTitle: 'text-base sm:text-lg font-semibold',
  
  // Card content
  cardContent: 'text-sm sm:text-base',
  
  // Tab labels
  tabLabel: 'text-xs sm:text-sm font-medium',
  
  // Badge text
  badgeText: 'text-[10px] sm:text-[11px] font-medium',
  
  // Button text
  buttonText: 'text-sm sm:text-base font-medium',
  
  // Form labels
  formLabel: 'text-sm font-medium',
  
  // Form helpers
  formHelper: 'text-xs sm:text-sm',
  
  // Metadata
  metadata: 'text-xs',
  
  // Navigation
  navItem: 'text-sm sm:text-base font-medium',
  
  // Footer
  footerText: 'text-xs sm:text-sm',
};