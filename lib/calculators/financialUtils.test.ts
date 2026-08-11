/**
 * Test suite para financialUtils
 * Verifica precisión de cálculos monetarios
 */

import { describe, it, expect } from 'vitest';
import {
  roundMoney,
  validateDimensions,
  validateWasteFactor,
  convertCementToBags,
  convertSteelToQuintales,
  calculateCommercialUnits,
} from './financialUtils';

describe('financialUtils', () => {
  describe('roundMoney', () => {
    it('debería redondear a 2 decimales correctamente', () => {
      expect(roundMoney(123.456)).toBe(123.46);
      expect(roundMoney(123.454)).toBe(123.45);
    });

    it('debería manejar Number.EPSILON para evitar errores de punto flotante', () => {
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(roundMoney(1.005)).toBe(1.01);
    });

    it('debería retornar 0 para valores inválidos', () => {
      expect(roundMoney(0)).toBe(0);
      expect(roundMoney(NaN)).toBe(0);
      expect(roundMoney(Infinity)).toBe(0);
      expect(roundMoney(-Infinity)).toBe(0);
    });
  });

  describe('validateDimensions', () => {
    it('debería validar dimensiones positivas', () => {
      expect(validateDimensions(10, 5)).toBe(true);
      expect(validateDimensions(10, 5, 0.15)).toBe(true);
    });

    it('debería rechazar dimensiones inválidas', () => {
      expect(validateDimensions(0, 5)).toBe(false);
      expect(validateDimensions(10, 0)).toBe(false);
      expect(validateDimensions(-1, 5)).toBe(false);
      expect(validateDimensions(10, -1)).toBe(false);
      expect(validateDimensions(10, 5, 0)).toBe(false);
    });
  });

  describe('validateWasteFactor', () => {
    it('debería validar waste factor válido', () => {
      expect(validateWasteFactor(1.05)).toBe(true);
      expect(validateWasteFactor(2.0)).toBe(true);
    });

    it('debería rechazar waste factor inválido', () => {
      expect(validateWasteFactor(0.95)).toBe(false);
      expect(validateWasteFactor(0)).toBe(false);
      expect(validateWasteFactor(-1)).toBe(false);
      expect(validateWasteFactor(Infinity)).toBe(false);
    });
  });

  describe('convertCementToBags', () => {
    it('debería convertir kilogramos a sacos de 42.5kg', () => {
      expect(convertCementToBags(42.5)).toBe(1);
      expect(convertCementToBags(85)).toBe(2);
      expect(convertCementToBags(100)).toBe(3); // ceil(100/42.5) = 3
    });

    it('debería retornar 0 para valores inválidos', () => {
      expect(convertCementToBags(0)).toBe(0);
      expect(convertCementToBags(-10)).toBe(0);
      expect(convertCementToBags(NaN)).toBe(0);
    });
  });

  describe('convertSteelToQuintales', () => {
    it('debería convertir kilogramos a quintales de 46.023kg', () => {
      expect(convertSteelToQuintales(46.023)).toBe(1);
      expect(convertSteelToQuintales(92.046)).toBe(2);
    });

    it('debería redondear a 2 decimales', () => {
      expect(convertSteelToQuintales(100)).toBeCloseTo(2.17, 2);
    });

    it('debería retornar 0 para valores inválidos', () => {
      expect(convertSteelToQuintales(0)).toBe(0);
      expect(convertSteelToQuintales(-10)).toBe(0);
    });
  });

  describe('calculateCommercialUnits', () => {
    it('debería convertir cemento en kg a sacos', () => {
      expect(calculateCommercialUnits('cement', 85, 'kg')).toBe(2);
    });

    it('debería convertir acero en kg a quintales', () => {
      expect(calculateCommercialUnits('steel', 92.046, 'kg')).toBe(2);
    });

    it('debería redondear otros materiales', () => {
      expect(calculateCommercialUnits('other', 123.456, 'unit')).toBe(123.46);
    });

    it('debería retornar 0 para valores inválidos', () => {
      expect(calculateCommercialUnits('cement', 0, 'kg')).toBe(0);
      expect(calculateCommercialUnits('steel', -10, 'kg')).toBe(0);
    });
  });
});
