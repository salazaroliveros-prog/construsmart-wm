/**
 * Business Rules Validation
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Centralized business logic validation for data integrity
 */

import { z } from 'zod';

// Project business rules
export const projectRules = {
  area_m2: {
    min: 1,
    max: 1000000,
    message: 'El área debe estar entre 1 y 1,000,000 m²'
  },
  duration_days: {
    min: 1,
    max: 3650, // 10 años
    message: 'La duración debe estar entre 1 y 3,650 días'
  },
  total_budget: {
    min: 0,
    message: 'El presupuesto total no puede ser negativo'
  }
};

// Budget business rules
export const budgetRules = {
  total_amount: {
    min: 0,
    message: 'El monto total no puede ser negativo'
  },
  duration_days: {
    min: 1,
    max: 3650,
    message: 'La duración debe estar entre 1 y 3,650 días'
  }
};

// Financial transaction rules
export const transactionRules = {
  amount: {
    min: 0,
    message: 'El monto no puede ser negativo'
  },
  date: {
    message: 'La fecha es requerida'
  }
};

// Warehouse stock rules
export const warehouseRules = {
  current_stock: {
    min: 0,
    message: 'El stock actual no puede ser negativo'
  },
  minimum_threshold: {
    min: 0,
    message: 'El umbral mínimo no puede ser negativo'
  },
  unit_cost: {
    min: 0,
    message: 'El costo unitario no puede ser negativo'
  }
};

// Payroll rules
export const payrollRules = {
  base_salary: {
    min: 0,
    message: 'El salario base no puede ser negativo'
  },
  hours_worked: {
    min: 0,
    max: 168, // 24*7 horas semanales
    message: 'Las horas trabajadas deben estar entre 0 y 168'
  }
};

/**
 * Validate project data against business rules
 */
export function validateProject(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.area_m2 < projectRules.area_m2.min || data.area_m2 > projectRules.area_m2.max) {
    errors.push(projectRules.area_m2.message);
  }

  if (data.duration_days < projectRules.duration_days.min || data.duration_days > projectRules.duration_days.max) {
    errors.push(projectRules.duration_days.message);
  }

  if (data.total_budget < projectRules.total_budget.min) {
    errors.push(projectRules.total_budget.message);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate budget data against business rules
 */
export function validateBudget(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.total_amount < budgetRules.total_amount.min) {
    errors.push(budgetRules.total_amount.message);
  }

  if (data.duration_days < budgetRules.duration_days.min || data.duration_days > budgetRules.duration_days.max) {
    errors.push(budgetRules.duration_days.message);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate financial transaction data
 */
export function validateTransaction(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.amount < transactionRules.amount.min) {
    errors.push(transactionRules.amount.message);
  }

  if (!data.date) {
    errors.push(transactionRules.date.message);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate warehouse stock data
 */
export function validateWarehouseStock(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.current_stock < warehouseRules.current_stock.min) {
    errors.push(warehouseRules.current_stock.message);
  }

  if (data.minimum_threshold < warehouseRules.minimum_threshold.min) {
    errors.push(warehouseRules.minimum_threshold.message);
  }

  if (data.unit_cost < warehouseRules.unit_cost.min) {
    errors.push(warehouseRules.unit_cost.message);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate payroll data
 */
export function validatePayroll(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.base_salary < payrollRules.base_salary.min) {
    errors.push(payrollRules.base_salary.message);
  }

  if (data.hours_worked < payrollRules.hours_worked.min || data.hours_worked > payrollRules.hours_worked.max) {
    errors.push(payrollRules.hours_worked.message);
  }

  return { valid: errors.length === 0, errors };
}