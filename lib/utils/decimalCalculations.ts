/**
 * Decimal Calculations Utility
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Precise decimal calculations using decimal.js
 * Prevents floating-point precision errors in financial calculations
 */

import Decimal from 'decimal.js';

// Configure Decimal for precision
Decimal.set({
  precision: 28,
  rounding: 4, // ROUND_HALF_UP
  toExpNeg: -28,
  toExpPos: 28,
  maxE: 9e28,
  minE: -9e28,
  modulo: 1,
  crypto: false,
});

/**
 * Safe addition with Decimal.js
 */
export function add(a: number | string, b: number | string): number {
  return new Decimal(a).plus(b).toNumber();
}

/**
 * Safe subtraction with Decimal.js
 */
export function subtract(a: number | string, b: number | string): number {
  return new Decimal(a).minus(b).toNumber();
}

/**
 * Safe multiplication with Decimal.js
 */
export function multiply(a: number | string, b: number | string): number {
  return new Decimal(a).times(b).toNumber();
}

/**
 * Safe division with Decimal.js
 */
export function divide(a: number | string, b: number | string): number {
  return new Decimal(a).div(b).toNumber();
}

/**
 * Safe percentage calculation
 */
export function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return new Decimal(part).div(total).times(100).toNumber();
}

/**
 * Round to specific decimal places
 */
export function round(value: number, decimalPlaces: number = 2): number {
  return new Decimal(value).toDecimalPlaces(decimalPlaces).toNumber();
}

/**
 * Format as currency with precise calculation
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  const rounded = round(value, decimals);
  return rounded.toLocaleString('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculate sum of array with precise calculation
 */
export function sum(values: number[]): number {
  return values.reduce((acc, val) => add(acc, val), 0);
}

/**
 * Calculate average with precise calculation
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return divide(sum(values), values.length);
}

/**
 * Calculate GTQ amount from multiple units
 */
export function calculateTotalGTQ(quantity: number, unitPrice: number): number {
  return multiply(quantity, unitPrice);
}

/**
 * Calculate variance percentage
 */
export function variancePercentage(actual: number, expected: number): number {
  if (expected === 0) return 0;
  return percentage(subtract(actual, expected), expected);
}