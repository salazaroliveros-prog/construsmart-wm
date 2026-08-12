/**
 * Currency Validation for GTQ (Guatemalan Quetzal)
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Validation and formatting for GTQ currency
 */

export interface CurrencyValidationResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
}

/**
 * Validate GTQ currency format
 * Accepts formats: 1,000.00, 1000.00, 1000, .00, etc.
 */
export function validateGTQ(value: string | number): CurrencyValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: 'El valor es requerido' };
  }

  const stringValue = String(value).trim();

  // Remove all non-numeric characters except decimal point and comma
  const cleaned = stringValue.replace(/[^\d.,]/g, '');

  // Check if it's a valid number format
  const numericValue = parseFloat(cleaned.replace(/,/g, ''));

  if (isNaN(numericValue)) {
    return { isValid: false, error: 'Formato de moneda inválido' };
  }

  if (numericValue < 0) {
    return { isValid: false, error: 'El monto no puede ser negativo' };
  }

  // Format to GTQ
  const formatted = formatGTQ(numericValue);

  return { isValid: true, formatted };
}

/**
 * Format number as GTQ currency
 */
export function formatGTQ(value: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse GTQ formatted string to number
 */
export function parseGTQ(formatted: string): number {
  // Remove currency symbol and spaces
  const cleaned = formatted.replace(/[Q\s]/g, '');
  // Replace comma with period for decimal parsing
  const numeric = cleaned.replace(/,/g, '');
  return parseFloat(numeric) || 0;
}

/**
 * Validate and format GTQ in one step
 */
export function validateAndFormatGTQ(value: string | number): CurrencyValidationResult {
  const validation = validateGTQ(value);
  
  if (!validation.isValid) {
    return validation;
  }

  const numericValue = typeof value === 'number' ? value : parseGTQ(String(value));
  const formatted = formatGTQ(numericValue);

  return { isValid: true, formatted };
}