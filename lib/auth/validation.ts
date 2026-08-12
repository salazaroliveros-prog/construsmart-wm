/**
 * Authentication Validation Utilities
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Centralized validation functions for authentication and authorization
 */

import { getAdminEmail } from '@/lib/config/app.config';

/**
 * Validates if a user email matches the admin email
 * Performs case-insensitive comparison and trims whitespace
 * 
 * @param userEmail - The email to validate
 * @param adminEmail - Optional admin email (defaults to configured admin email)
 * @returns true if the user is an admin, false otherwise
 */
export function isAdminUser(
  userEmail: string,
  adminEmail?: string
): boolean {
  const configuredAdminEmail = adminEmail || getAdminEmail();
  
  if (!userEmail || !configuredAdminEmail) {
    return false;
  }
  
  return userEmail.trim().toLowerCase() === configuredAdminEmail.trim().toLowerCase();
}

/**
 * Validates if an email address is properly formatted
 * Uses a more strict validation than basic regex
 * 
 * @param email - The email to validate
 * @returns true if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Additional validations
  const [localPart, domain] = email.split('@');
  
  // Local part length limit (RFC 5321)
  if (localPart.length > 64) {
    return false;
  }
  
  // Domain length limit (RFC 1035)
  if (domain.length > 253) {
    return false;
  }
  
  // Check for consecutive dots
  if (email.includes('..') || email.includes('.@') || email.includes('@.')) {
    return false;
  }
  
  return true;
}

/**
 * Normalizes an email address for consistent comparison
 * Trims whitespace and converts to lowercase
 * 
 * @param email - The email to normalize
 * @returns The normalized email
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates if a route path is safe for navigation
 * Prevents open-redirect vulnerabilities
 * 
 * @param path - The path to validate
 * @returns true if the path is safe, false otherwise
 */
export function isSafePath(path: string | null | undefined): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // Must start with / but not with //
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  
  // Prevent protocol-relative URLs
  if (path.startsWith('//')) {
    return false;
  }
  
  // Prevent javascript: protocol
  if (path.toLowerCase().startsWith('javascript:')) {
    return false;
  }
  
  // Prevent data: protocol
  if (path.toLowerCase().startsWith('data:')) {
    return false;
  }
  
  return true;
}

/**
 * Gets a safe redirect path, falling back to a default if unsafe
 * 
 * @param next - The candidate redirect path
 * @param defaultPath - The default path to use if next is unsafe
 * @returns A safe path for redirect
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  defaultPath: string = '/'
): string {
  return isSafePath(next) ? (next || defaultPath) : defaultPath;
}