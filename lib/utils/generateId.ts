/**
 * Genera un UUID v4 con fallback para entornos sin crypto.randomUUID().
 * Compatible con Node.js 18+, navegadores modernos y entornos de test.
 */
export function generateId(): string {
  // crypto.randomUUID() está disponible en Node.js 19+ y navegadores modernos
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback manual (RFC 4122 v4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Valida si un string es un UUID v4 válido (RFC 4122).
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
