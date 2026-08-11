/**
 * Utilidades para generación de códigos secuenciales
 * Extraídas para evitar duplicación en múltiples componentes
 */

/**
 * Genera un código secuencial basado en el prefijo y códigos existentes
 * @param items - Lista de items con propiedad 'code'
 * @param prefix - Prefijo del código (ej: "CLI", "SUP")
 * @returns Nuevo código en formato "PREFIX-XXXX" donde XXXX es un número de 4 dígitos
 */
export function generateSequentialCode(
  items: { code: string }[],
  prefix: string
): string {
  const maxNum = items.reduce((max, item) => {
    const m = item.code.match(new RegExp(`^${prefix}-(\\d+)$`));
    const n = m ? parseInt(m[1], 10) : 0;
    return n > max ? n : max;
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
}
