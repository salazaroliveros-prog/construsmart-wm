/**
 * Tests de Validación de Datos con Zod
 * Verifica que los schemas de Zod validen correctamente los datos
 */

import { describe, it, expect } from 'vitest';
import {
  projectSchema,
  financialTransactionSchema,
  validateSchema,
  formatValidationErrors,
} from './schemas';

describe('Zod Validation Schemas', () => {
  describe('projectSchema', () => {
    it('debería validar un proyecto válido correctamente', () => {
      const validProject = {
        code: 'PROJ-001',
        name: 'Test Project',
        client_name: 'Test Client',
        client_phone: '+502 1234-5678',
        client_email: 'client@example.com',
        location: 'Guatemala City',
        typology: 'residential' as const,
        area_m2: 500,
        quality_level: 'moderate' as const,
        status: 'planning' as const,
        start_date: '2024-01-01',
        estimated_end_date: '2024-12-31',
        duration_days: 365,
        total_budget: 1000000,
      };

      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('debería rechazar código inválido (menos de 3 caracteres)', () => {
      const invalidProject = {
        code: 'AB',
        name: 'Test Project',
        client_name: 'Test Client',
        location: 'Guatemala City',
        typology: 'residential' as const,
        area_m2: 500,
        quality_level: 'moderate' as const,
        status: 'planning' as const,
        duration_days: 365,
        total_budget: 1000000,
      };

      const result = projectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('debería aceptar campos opcionales vacíos', () => {
      const validProject = {
        code: 'PROJ-001',
        name: 'Test Project',
        client_name: 'Test Client',
        location: 'Guatemala City',
        typology: 'residential' as const,
        area_m2: 500,
        quality_level: 'moderate' as const,
        status: 'planning' as const,
        duration_days: 365,
        total_budget: 1000000,
        client_phone: '',
        client_email: '',
        start_date: '',
        estimated_end_date: '',
      };

      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });
  });

  describe('financialTransactionSchema', () => {
    it('debería validar una transacción válida', () => {
      const validTransaction = {
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'expense' as const,
        category: 'materiales' as const,
        description: 'Compra de materiales',
        quantity: 10,
        unit: 'unidad',
        unit_cost: 50,
        total_cost: 500,
      };

      const result = financialTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('debería rechazar project_id inválido (no UUID)', () => {
      const invalidTransaction = {
        project_id: 'invalid-uuid',
        type: 'expense' as const,
        category: 'materiales' as const,
        description: 'Compra de materiales',
        quantity: 10,
        unit: 'unidad',
        unit_cost: 50,
        total_cost: 500,
      };

      const result = financialTransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });

    it('debería rechazar cantidad negativa', () => {
      const invalidTransaction = {
        type: 'expense' as const,
        category: 'materiales' as const,
        description: 'Compra de materiales',
        quantity: -10,
        unit: 'unidad',
        unit_cost: 50,
        total_cost: 500,
      };

      const result = financialTransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSchema helper', () => {
    it('debería validar datos usando schema específico', () => {
      const validData = {
        code: 'PROJ-001',
        name: 'Test Project',
        client_name: 'Test Client',
        location: 'Guatemala City',
        typology: 'residential' as const,
        area_m2: 500,
        quality_level: 'moderate' as const,
        status: 'planning' as const,
        duration_days: 365,
        total_budget: 1000000,
      };

      const result = validateSchema(validData, projectSchema);
      expect(result.success).toBe(true);
    });

    it('debería retornar error cuando la validación falla', () => {
      const invalidData = {
        code: 'AB',
        name: 'Test Project',
        client_name: 'Test Client',
        location: 'Guatemala City',
        typology: 'residential' as const,
        area_m2: 500,
        quality_level: 'moderate' as const,
        status: 'planning' as const,
        duration_days: 365,
        total_budget: 1000000,
      };

      const result = validateSchema(invalidData, projectSchema);
      expect(result.success).toBe(false);
    });
  });

  describe('formatValidationErrors helper', () => {
    it('debería formatear errores de validación correctamente', () => {
      const zodError = {
        errors: [
          { path: ['code'], message: 'Código debe tener al menos 3 caracteres' },
          { path: ['name'], message: 'Nombre es requerido' },
        ],
      };

      const formatted = formatValidationErrors(zodError as any);
      expect(formatted).toBeInstanceOf(Array);
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toContain('Código');
      expect(formatted[1]).toContain('Nombre');
    });

    it('debería manejar array de errores vacío', () => {
      const zodError = { errors: [] };
      const formatted = formatValidationErrors(zodError as any);
      expect(formatted).toEqual([]);
    });
  });
});
