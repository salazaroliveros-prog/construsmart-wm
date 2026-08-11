/**
 * Utilidades de conversión de colores
 * Extraídas para evitar duplicación en múltiples componentes
 */

/**
 * Convierte un color hexadecimal a formato RGBA
 * @param hex - Color en formato hexadecimal (ej: "#00ff00")
 * @param alpha - Valor de transparencia (0-1)
 * @returns Color en formato RGBA
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Convierte un color hexadecimal a RGB aclarado
 * Aumenta cada componente RGB en 80 unidades (hasta máximo 255)
 * @param hex - Color en formato hexadecimal (ej: "#00ff00")
 * @returns Color en formato RGB aclarado
 */
export const hexToLightRgb = (hex: string): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 80);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 80);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 80);
  return `rgb(${r}, ${g}, ${b})`;
};
