/**
 * Date Validation Utility
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Logical date validation for project timelines and business logic
 */

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate that end date is after start date
 */
export function validateDateRange(startDate: string, endDate: string): DateValidationResult {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Las fechas son requeridas' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Formato de fecha inválido' };
  }

  if (end <= start) {
    return { isValid: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
  }

  return { isValid: true };
}

/**
 * Validate that date is not in the past
 */
export function validateFutureDate(date: string): DateValidationResult {
  if (!date) {
    return { isValid: false, error: 'La fecha es requerida' };
  }

  const targetDate = new Date(date);
  const now = new Date();

  if (isNaN(targetDate.getTime())) {
    return { isValid: false, error: 'Formato de fecha inválido' };
  }

  if (targetDate < now) {
    return { isValid: false, error: 'La fecha no puede estar en el pasado' };
  }

  return { isValid: true };
}

/**
 * Validate that date is within reasonable range
 */
export function validateDateRangeLimits(date: string, minDays: number = 0, maxDays: number = 3650): DateValidationResult {
  if (!date) {
    return { isValid: false, error: 'La fecha es requerida' };
  }

  const targetDate = new Date(date);
  const now = new Date();

  if (isNaN(targetDate.getTime())) {
    return { isValid: false, error: 'Formato de fecha inválido' };
  }

  const diffDays = Math.abs((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < minDays) {
    return { isValid: false, error: `La fecha debe ser al menos ${minDays} días en el futuro/pasado` };
  }

  if (diffDays > maxDays) {
    return { isValid: false, error: `La fecha no puede estar más de ${maxDays} días en el futuro/pasado` };
  }

  return { isValid: true };
}

/**
 * Validate project duration is reasonable
 */
export function validateProjectDuration(durationDays: number): DateValidationResult {
  if (durationDays < 1) {
    return { isValid: false, error: 'La duración debe ser al menos 1 día' };
  }

  if (durationDays > 3650) {
    return { isValid: false, error: 'La duración no puede exceder 10 años' };
  }

  return { isValid: true };
}

/**
 * Validate that date is a business day (Mon-Fri)
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1=Monday, 5=Friday
}

/**
 * Calculate business days between two dates
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = new Date(startDate);

  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}