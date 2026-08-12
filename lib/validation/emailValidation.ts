/**
 * Enhanced Email Validation
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Comprehensive email validation with format, domain, and disposable email checks
 */

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  isDisposable?: boolean;
  isFreeProvider?: boolean;
}

/**
 * Enhanced email validation with multiple checks
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'El email es requerido' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'El email es requerido' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'El email es demasiado largo' };
  }

  // Basic format validation (RFC 5322 compliant simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
    'yopmail.com', 'trashmail.com', 'getairmail.com', 'throwawaymail.com',
    'sharklasers.com', ' guerrillamail.net', 'guerrillamail.org'
  ];

  const domain = trimmed.split('@')[1]?.toLowerCase();
  const isDisposable = disposableDomains.some(d => domain?.includes(d));

  if (isDisposable) {
    return { 
      isValid: false, 
      error: 'No se permiten emails temporales/descartables',
      isDisposable: true 
    };
  }

  // Check for free email providers (optional - can be enabled/disabled)
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
  const isFreeProvider = freeProviders.includes(domain || '');

  return { 
    isValid: true, 
    isDisposable: false,
    isFreeProvider
  };
}

/**
 * Validate email with strict mode (no free providers)
 */
export function validateEmailStrict(email: string): EmailValidationResult {
  const result = validateEmail(email);
  
  if (!result.isValid) return result;
  
  if (result.isFreeProvider) {
    return { 
      isValid: false, 
      error: 'Se requiere un email corporativo (no proveedores gratuitos)' 
    };
  }
  
  return result;
}

/**
 * Normalize email for comparison
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if two emails are the same (normalized)
 */
export function emailsMatch(email1: string, email2: string): boolean {
  return normalizeEmail(email1) === normalizeEmail(email2);
}