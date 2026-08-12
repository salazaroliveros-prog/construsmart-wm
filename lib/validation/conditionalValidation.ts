/**
 * Conditional Validation System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Conditional validation based on context and business rules
 */

export interface ValidationRule {
  condition: (data: any) => boolean;
  validator: (data: any) => { valid: boolean; error?: string };
  errorMessage?: string;
}

export interface ConditionalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate data with conditional rules
 */
export function validateWithRules(
  data: any,
  rules: ValidationRule[]
): ConditionalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    if (rule.condition(data)) {
      const result = rule.validator(data);
      if (!result.valid) {
        errors.push(rule.errorMessage || result.error || 'Validación falló');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Common conditional validation rules for projects
 */
export const projectConditionalRules: ValidationRule[] = [
  {
    condition: (data) => data.status === 'completed' && !data.completion_date,
    validator: () => ({ valid: false, error: 'Proyectos completados requieren fecha de finalización' }),
    errorMessage: 'Proyectos completados requieren fecha de finalización',
  },
  {
    condition: (data) => data.total_budget > 0 && !data.client_id,
    validator: () => ({ valid: false, error: 'Proyectos con presupuesto requieren cliente asignado' }),
    errorMessage: 'Proyectos con presupuesto requieren cliente asignado',
  },
  {
    condition: (data) => data.has_payroll && !data.department,
    validator: () => ({ valid: false, error: 'Proyectos con nómina requieren departamento asignado' }),
    errorMessage: 'Proyectos con nómina requieren departamento asignado',
  },
];

/**
 * Common conditional validation rules for budgets
 */
export const budgetConditionalRules: ValidationRule[] = [
  {
    condition: (data) => data.total_amount > 0 && !data.project_id,
    validator: () => ({ valid: false, error: 'Presupuestos con monto requieren proyecto asignado' }),
    errorMessage: 'Presupuestos con monto requieren proyecto asignado',
  },
  {
    condition: (data) => data.items_count > 0 && !data.approved_by,
    validator: () => ({ valid: false, error: 'Presupuestos con items requieren aprobación' }),
    errorMessage: 'Presupuestos con items requieren aprobación',
  },
];

/**
 * Common conditional validation rules for transactions
 */
export const transactionConditionalRules: ValidationRule[] = [
  {
    condition: (data) => data.amount > 10000 && !data.approval_code,
    validator: () => ({ valid: false, error: 'Transacciones mayores a Q10,000 requieren código de aprobación' }),
    errorMessage: 'Transacciones mayores a Q10,000 requieren código de aprobación',
  },
  {
    condition: (data) => data.type === 'expense' && !data.category,
    validator: () => ({ valid: false, error: 'Gastos requieren categoría asignada' }),
    errorMessage: 'Gastos requieren categoría asignada',
  },
];

/**
 * Validate project with conditional rules
 */
export function validateProjectConditionally(projectData: any): ConditionalValidationResult {
  return validateWithRules(projectData, projectConditionalRules);
}

/**
 * Validate budget with conditional rules
 */
export function validateBudgetConditionally(budgetData: any): ConditionalValidationResult {
  return validateWithRules(budgetData, budgetConditionalRules);
}

/**
 * Validate transaction with conditional rules
 */
export function validateTransactionConditionally(transactionData: any): ConditionalValidationResult {
  return validateWithRules(transactionData, transactionConditionalRules);
}