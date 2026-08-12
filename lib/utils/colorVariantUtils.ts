import { hexToRgba, hexToLightRgb } from '@/lib/utils/colorUtils';
import { FINANCIAL_CATEGORY_COLORS, getFinancialCategoryColor } from '@/lib/config/colorPalettes';
import { WAREHOUSE_UNIT_COLORS, getWarehouseUnitColor } from '@/lib/config/colorPalettes';

/**
 * Obtiene las variantes de color (bg, text, border) para una categoría
 * @param category - Nombre de la categoría (ej: 'materiales', 'mano_de_obra', 'kg', 'm2')
 * @param opacity - Opacidad para el fondo (default: 0.2)
 * @returns Objeto con variantes de color { bg, text, border }
 */
export function getVariantColor(category: string, opacity: number = 0.2) {
  // Intentar obtener color de categorías financieras
  const financialColor = getFinancialCategoryColor(category);
  if (financialColor) {
    return {
      bg: hexToRgba(financialColor, opacity),
      text: hexToLightRgb(financialColor),
      border: hexToRgba(financialColor, opacity + 0.1),
    };
  }

  // Intentar obtener color de unidades de almacén
  const warehouseColor = getWarehouseUnitColor(category);
  if (warehouseColor) {
    return {
      bg: hexToRgba(warehouseColor, opacity),
      text: hexToLightRgb(warehouseColor),
      border: hexToRgba(warehouseColor, opacity + 0.1),
    };
  }

  // Color por defecto (cyan)
  const defaultColor = '#06b6d4';
  return {
    bg: hexToRgba(defaultColor, opacity),
    text: hexToLightRgb(defaultColor),
    border: hexToRgba(defaultColor, opacity + 0.1),
  };
}

/**
 * Obtiene las variantes de color para una categoría con opacidad personalizada
 * @param category - Nombre de la categoría
 * @param bgOpacity - Opacidad para el fondo (default: 0.2)
 * @param borderOpacity - Opacidad para el borde (default: 0.3)
 * @returns Objeto con variantes de color { bg, text, border }
 */
export function getVariantColorWithOpacity(
  category: string,
  bgOpacity: number = 0.2,
  borderOpacity: number = 0.3
) {
  // Intentar obtener color de categorías financieras
  const financialColor = getFinancialCategoryColor(category);
  if (financialColor) {
    return {
      bg: hexToRgba(financialColor, bgOpacity),
      text: hexToLightRgb(financialColor),
      border: hexToRgba(financialColor, borderOpacity),
    };
  }

  // Intentar obtener color de unidades de almacén
  const warehouseColor = getWarehouseUnitColor(category);
  if (warehouseColor) {
    return {
      bg: hexToRgba(warehouseColor, bgOpacity),
      text: hexToLightRgb(warehouseColor),
      border: hexToRgba(warehouseColor, borderOpacity),
    };
  }

  // Color por defecto (cyan)
  const defaultColor = '#06b6d4';
  return {
    bg: hexToRgba(defaultColor, bgOpacity),
    text: hexToLightRgb(defaultColor),
    border: hexToRgba(defaultColor, borderOpacity),
  };
}