// Sistema de Diseño Unificado - Índice
// Exporta todos los sistemas de diseño para uso consistente en la aplicación

import { typography, textSize, responsiveText, textByUsage } from './typography';
import { spacing, spacingByUsage, responsiveSpacing, touchTargets } from './spacing';
import { borderRadius, borderRadiusByUsage, responsiveBorderRadius } from './borderRadius';
import { iconSizes, iconSizesByUsage, responsiveIconSizes } from './iconSizes';
import { textOpacity, textOpacityByUsage, coloredTextOpacity, responsiveTextOpacity } from './textOpacity';
import { feedbackColors, feedbackColorsByUsage, backgroundColors, borderColors, textColors } from './feedbackColors';
import { transitions, transitionsByUsage } from './transitions';
import { validationRules, validationStates, validationTiming, validationStyles, validationClasses } from './validation';
import { chartColors, chartClasses, chartColorsByType, chartColorsByCategory, getChartColor, getSeriesColor, getStatusColor } from './chartColors';
import { interactiveStates, interactiveStatesByUsage, stateTransitions } from './interactiveStates';
import { defaultShortcuts, useKeyboardShortcuts } from './keyboardShortcuts';
import { badgeSizes, badgeShapes, badgeVariants, badgeStatus, badgeClasses, badgeColors, getBadgeClass } from './badges';
import { exportFormats, exportOptions, exportClasses, exportToCSV, exportToJSON, exportToPDF, exportData } from './exportData';
import { filterTypes, filterOperators, filterClasses, filterStates, buildFilterQuery, parseFilterQuery, validateFilter, countActiveFilters } from './filters';

// Re-exportar para uso externo
export { typography, textSize, responsiveText, textByUsage } from './typography';
export { spacing, spacingByUsage, responsiveSpacing, touchTargets } from './spacing';
export { borderRadius, borderRadiusByUsage, responsiveBorderRadius } from './borderRadius';
export { iconSizes, iconSizesByUsage, responsiveIconSizes } from './iconSizes';
export { textOpacity, textOpacityByUsage, coloredTextOpacity, responsiveTextOpacity } from './textOpacity';
export { feedbackColors, feedbackColorsByUsage, backgroundColors, borderColors, textColors } from './feedbackColors';
export { transitions, transitionsByUsage } from './transitions';
export { validationRules, validationStates, validationTiming, validationStyles, validationClasses } from './validation';
export { chartColors, chartClasses, chartColorsByType, chartColorsByCategory, getChartColor, getSeriesColor, getStatusColor } from './chartColors';
export { interactiveStates, interactiveStatesByUsage, stateTransitions } from './interactiveStates';
export { defaultShortcuts, useKeyboardShortcuts } from './keyboardShortcuts';
export { badgeSizes, badgeShapes, badgeVariants, badgeStatus, badgeClasses, badgeColors, getBadgeClass } from './badges';
export { exportFormats, exportOptions, exportClasses, exportToCSV, exportToJSON, exportToPDF, exportData } from './exportData';
export { filterTypes, filterOperators, filterClasses, filterStates, buildFilterQuery, parseFilterQuery, validateFilter, countActiveFilters } from './filters';

// Sistema de diseño completo
export const designSystem = {
  typographySystem: typography,
  spacingSystem: spacing,
  borderRadiusSystem: borderRadius,
  iconSizesSystem: iconSizes,
  textOpacitySystem: textOpacity,
  feedbackColorsSystem: feedbackColors,
  transitionsSystem: transitions,
  validationSystem: {
    rules: validationRules,
    states: validationStates,
    timing: validationTiming,
    styles: validationStyles,
    classes: validationClasses,
  },
  chartSystem: {
    colors: chartColors,
    classes: chartClasses,
    byType: chartColorsByType,
    byCategory: chartColorsByCategory,
    helpers: {
      getChartColor,
      getSeriesColor,
      getStatusColor,
    },
  },
  interactiveSystem: {
    states: interactiveStates,
    byUsage: interactiveStatesByUsage,
    transitions: stateTransitions,
  },
  keyboardSystem: {
    defaultShortcuts,
    useKeyboardShortcuts,
  },
  badgeSystem: {
    sizes: badgeSizes,
    shapes: badgeShapes,
    variants: badgeVariants,
    status: badgeStatus,
    classes: badgeClasses,
    colors: badgeColors,
    helpers: {
      getBadgeClass,
    },
  },
  exportSystem: {
    formats: exportFormats,
    options: exportOptions,
    classes: exportClasses,
    functions: {
      exportToCSV,
      exportToJSON,
      exportToPDF,
      exportData,
    },
  },
  filterSystem: {
    types: filterTypes,
    operators: filterOperators,
    classes: filterClasses,
    states: filterStates,
    helpers: {
      buildFilterQuery,
      parseFilterQuery,
      validateFilter,
      countActiveFilters,
    },
  },
};

// Clases combinadas por uso común
export const combinedClasses = {
  // Botón estándar
  buttonStandard: 'px-4 py-3 min-h-[44px] rounded-md text-sm font-medium transition-all duration-200 ease-out',
  
  // Input estándar
  inputStandard: 'px-4 py-3 min-h-[44px] rounded-md text-sm transition-all duration-300 ease-in-out',
  
  // Input con validación
  inputWithValidation: 'px-4 py-3 min-h-[44px] rounded-md text-sm transition-all duration-300 ease-in-out focus:ring-2',
  
  // Card estándar
  cardStandard: 'p-4 rounded-lg transition-all duration-300 ease-in-out',
  
  // Tab estándar
  tabStandard: 'px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-medium transition-all duration-200 ease-out',
  
  // Badge estándar
  badgeStandard: 'px-2 py-0.5 rounded-md text-xs font-medium',
  
  // Navigation item estándar
  navItemStandard: 'px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-300 ease-in-out',
  
  // Formulario estándar
  formGroupStandard: 'space-y-4',
  
  // Modal estándar
  modalStandard: 'p-6 rounded-xl transition-all duration-300 ease-in-out',
  
  // Table cell estándar
  tableCellStandard: 'px-4 py-3 text-sm',
  
  // Table header estándar
  tableHeaderStandard: 'px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider',
  
  // Breadcrumb estándar
  breadcrumbStandard: 'flex items-center gap-2 text-sm min-h-[44px]',
  
  // Search trigger estándar
  searchTriggerStandard: 'flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white/60 hover:text-white transition-all min-h-[44px]',
};