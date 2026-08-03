import { z } from 'zod';

/**
 * Zod Validation Schemas
 * CONSTRUCTORA WM/M&S - Sistema ERP de Construcción
 * 
 * Schemas de validación para todas las entidades del sistema
 * Garantiza integridad de datos antes de guardar en DB
 */

// ============================================================================
// PROJECT SCHEMA
// ============================================================================
export const projectSchema = z.object({
  code: z.string()
    .min(1, 'Código es requerido')
    .min(3, 'Código debe tener al menos 3 caracteres')
    .max(20, 'Código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Código solo puede contener letras mayúsculas, números y guiones'),
  name: z.string()
    .min(1, 'Nombre es requerido')
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(200, 'Nombre no puede exceder 200 caracteres'),
  client_name: z.string()
    .min(1, 'Nombre del cliente es requerido')
    .min(2, 'Nombre del cliente debe tener al menos 2 caracteres')
    .max(100, 'Nombre del cliente no puede exceder 100 caracteres'),
  client_phone: z.string()
    .regex(/^\+?[0-9\s-()]{8,20}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  client_email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  location: z.string()
    .min(1, 'Ubicación es requerida')
    .min(3, 'Ubicación debe tener al menos 3 caracteres')
    .max(200, 'Ubicación no puede exceder 200 caracteres'),
  typology: z.enum(['residential', 'commercial', 'industrial', 'civil', 'public']),
  area_m2: z.number()
    .min(1, 'Área debe ser mayor a 0')
    .max(100000, 'Área no puede exceder 100,000 m²'),
  quality_level: z.enum(['basic', 'moderate', 'premium']),
  status: z.enum(['planning', 'execution', 'paused', 'completed']),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  estimated_end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  duration_days: z.number()
    .int('Duración debe ser un número entero')
    .min(1, 'Duración debe ser al menos 1 día')
    .max(3650, 'Duración no puede exceder 10 años'),
  total_budget: z.number()
    .min(0, 'Presupuesto no puede ser negativo')
    .max(999999999.99, 'Presupuesto excede el máximo permitido'),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ============================================================================
// FINANCIAL TRANSACTION SCHEMA
// ============================================================================
export const financialTransactionSchema = z.object({
  project_id: z.string().uuid('ID de proyecto inválido').optional().or(z.literal('')),
  type: z.enum(['income', 'expense']),
  category: z.enum([
    'materiales', 'mano_de_obra', 'herramienta', 'sub_contrato',
    'administrativo', 'personal', 'transporte', 'fijos', 'hogar',
    'aporte', 'trabajos_extra'
  ]),
  description: z.string()
    .min(1, 'Descripción es requerida')
    .min(3, 'Descripción debe tener al menos 3 caracteres')
    .max(500, 'Descripción no puede exceder 500 caracteres'),
  quantity: z.number()
    .min(0.01, 'Cantidad debe ser mayor a 0')
    .max(9999999.99, 'Cantidad excede el máximo permitido'),
  unit: z.string()
    .min(1, 'Unidad es requerida')
    .max(20, 'Unidad no puede exceder 20 caracteres'),
  unit_cost: z.number()
    .min(0, 'Costo unitario no puede ser negativo')
    .max(999999999.99, 'Costo unitario excede el máximo permitido'),
  total_cost: z.number()
    .min(0, 'Costo total no puede ser negativo')
    .max(9999999999.99, 'Costo total excede el máximo permitido'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD')
    .refine(date => {
      const parsed = new Date(date);
      const today = new Date();
      return parsed <= today;
    }, 'Fecha no puede ser futura'),
  receipt_url: z.string().url('URL de recibo inválida').optional().or(z.literal('')),
});

export type FinancialTransactionFormData = z.infer<typeof financialTransactionSchema>;

// ============================================================================
// PAYROLL EMPLOYEE SCHEMA
// ============================================================================
export const payrollEmployeeSchema = z.object({
  name: z.string()
    .min(1, 'Nombre es requerido')
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres'),
  position: z.string()
    .min(1, 'Puesto es requerido')
    .min(2, 'Puesto debe tener al menos 2 caracteres')
    .max(100, 'Puesto no puede exceder 100 caracteres'),
  daily_rate: z.number()
    .min(0, 'Tarifa diaria no puede ser negativa')
    .max(99999.99, 'Tarifa diaria excede el máximo permitido'),
  category: z.enum(['obrero', 'empleado']),
  department: z.string()
    .min(1, 'Departamento es requerido')
    .min(2, 'Departamento debe tener al menos 2 caracteres')
    .max(50, 'Departamento no puede exceder 50 caracteres'),
  hire_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD')
    .refine(date => {
      const parsed = new Date(date);
      const today = new Date();
      return parsed <= today;
    }, 'Fecha de contratación no puede ser futura'),
  active: z.boolean(),
});

export type PayrollEmployeeFormData = z.infer<typeof payrollEmployeeSchema>;

// ============================================================================
// PAYROLL RECORD SCHEMA
// ============================================================================
export const payrollRecordSchema = z.object({
  project_id: z.string().uuid('ID de proyecto inválido').optional().or(z.literal('')),
  employee_id: z.string()
    .uuid('ID de empleado inválido')
    .min(1, 'ID de empleado es requerido'),
  period_start: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  period_end: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  days_worked: z.number()
    .int('Días trabajados debe ser entero')
    .min(0, 'Días trabajados no puede ser negativo')
    .max(31, 'Días trabajados no puede exceder 31'),
  overtime_hours: z.number()
    .min(0, 'Horas extra no pueden ser negativas')
    .max(168, 'Horas extra no pueden exceder 168 horas/semana'),
  overtime_rate: z.number()
    .min(0, 'Tarifa horas extra no puede ser negativa')
    .max(9999.99, 'Tarifa horas extra excede el máximo permitido'),
  bonuses: z.number()
    .min(0, 'Bonos no pueden ser negativos')
    .max(999999.99, 'Bonos exceden el máximo permitido'),
  deductions: z.number()
    .min(0, 'Deducciones no pueden ser negativas')
    .max(999999.99, 'Deducciones exceden el máximo permitido'),
});

export type PayrollRecordFormData = z.infer<typeof payrollRecordSchema>;

// ============================================================================
// WAREHOUSE STOCK SCHEMA
// ============================================================================
export const warehouseStockSchema = z.object({
  project_id: z.string().uuid('ID de proyecto inválido').optional().or(z.literal('')),
  item_code: z.string()
    .min(1, 'Código de item es requerido')
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(50, 'Código no puede exceder 50 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Código solo puede contener letras mayúsculas, números y guiones'),
  description: z.string()
    .min(1, 'Descripción es requerida')
    .min(3, 'Descripción debe tener al menos 3 caracteres')
    .max(200, 'Descripción no puede exceder 200 caracteres'),
  unit: z.string()
    .min(1, 'Unidad es requerida')
    .max(20, 'Unidad no puede exceder 20 caracteres'),
  current_stock: z.number()
    .min(0, 'Stock actual no puede ser negativo')
    .max(9999999.99, 'Stock actual excede el máximo permitido'),
  minimum_threshold: z.number()
    .min(0, 'Umbral mínimo no puede ser negativo')
    .max(9999999.99, 'Umbral mínimo excede el máximo permitido'),
  unit_cost: z.number()
    .min(0, 'Costo unitario no puede ser negativo')
    .max(999999999.99, 'Costo unitario excede el máximo permitido'),
});

export type WarehouseStockFormData = z.infer<typeof warehouseStockSchema>;

// ============================================================================
// CLIENT SCHEMA
// ============================================================================
export const clientSchema = z.object({
  code: z.string()
    .min(1, 'Código es requerido')
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(20, 'Código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Código solo puede contener letras mayúsculas, números y guiones'),
  name: z.string()
    .min(1, 'Nombre es requerido')
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres'),
  company_name: z.string()
    .max(100, 'Nombre de empresa no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .min(1, 'Teléfono es requerido')
    .regex(/^\+?[0-9\s-()]{8,20}$/, 'Teléfono inválido'),
  email: z.string()
    .email('Email inválido')
    .or(z.literal(''))
    .optional(),
  address: z.string()
    .min(1, 'Dirección es requerida')
    .min(5, 'Dirección debe tener al menos 5 caracteres')
    .max(200, 'Dirección no puede exceder 200 caracteres'),
  city: z.string()
    .min(1, 'Ciudad es requerida')
    .min(2, 'Ciudad debe tener al menos 2 caracteres')
    .max(100, 'Ciudad no puede exceder 100 caracteres'),
  client_type: z.enum(['individual', 'corporate']),
  notes: z.string()
    .max(1000, 'Notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ============================================================================
// SUPPLIER SCHEMA
// ============================================================================
export const supplierSchema = z.object({
  code: z.string()
    .min(1, 'Código es requerido')
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(20, 'Código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Código solo puede contener letras mayúsculas, números y guiones'),
  name: z.string()
    .min(1, 'Nombre es requerido')
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres'),
  contact_person: z.string()
    .min(1, 'Persona de contacto es requerida')
    .min(2, 'Persona de contacto debe tener al menos 2 caracteres')
    .max(100, 'Persona de contacto no puede exceder 100 caracteres'),
  phone: z.string()
    .min(1, 'Teléfono es requerido')
    .regex(/^\+?[0-9\s-()]{8,20}$/, 'Teléfono inválido'),
  email: z.string()
    .email('Email inválido')
    .or(z.literal(''))
    .optional(),
  address: z.string()
    .min(1, 'Dirección es requerida')
    .min(5, 'Dirección debe tener al menos 5 caracteres')
    .max(200, 'Dirección no puede exceder 200 caracteres'),
  city: z.string()
    .min(1, 'Ciudad es requerida')
    .min(2, 'Ciudad debe tener al menos 2 caracteres')
    .max(100, 'Ciudad no puede exceder 100 caracteres'),
  payment_terms: z.string()
    .min(1, 'Condiciones de pago son requeridas')
    .max(100, 'Condiciones de pago no pueden exceder 100 caracteres'),
  notes: z.string()
    .max(1000, 'Notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// ============================================================================
// BUDGET SCHEMA
// ============================================================================
export const budgetSchema = z.object({
  project_id: z.string()
    .uuid('ID de proyecto inválido')
    .min(1, 'ID de proyecto es requerido'),
  version: z.number()
    .int('Versión debe ser entero')
    .min(1, 'Versión debe ser al menos 1'),
  direct_cost: z.number()
    .min(0, 'Costo directo no puede ser negativo')
    .max(999999999.99, 'Costo directo excede el máximo permitido'),
  indirect_percentage: z.number()
    .min(0, 'Porcentaje de indirectos no puede ser negativo')
    .max(100, 'Porcentaje de indirectos no puede exceder 100%'),
  contingency_percentage: z.number()
    .min(0, 'Porcentaje de contingencia no puede ser negativo')
    .max(100, 'Porcentaje de contingencia no puede exceder 100%'),
  profit_percentage: z.number()
    .min(0, 'Porcentaje de utilidad no puede ser negativo')
    .max(100, 'Porcentaje de utilidad no puede exceder 100%'),
  total_amount: z.number()
    .min(0, 'Monto total no puede ser negativo')
    .max(9999999999.99, 'Monto total excede el máximo permitido'),
  duration_days: z.number()
    .int('Duración debe ser entero')
    .min(1, 'Duración debe ser al menos 1 día')
    .max(3650, 'Duración no puede exceder 10 años'),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

// ============================================================================
// BUDGET ITEM SCHEMA
// ============================================================================
export const budgetItemSchema = z.object({
  budget_id: z.string()
    .uuid('ID de presupuesto inválido')
    .min(1, 'ID de presupuesto es requerido'),
  code: z.string()
    .min(1, 'Código es requerido')
    .max(50, 'Código no puede exceder 50 caracteres'),
  description: z.string()
    .min(1, 'Descripción es requerida')
    .min(3, 'Descripción debe tener al menos 3 caracteres')
    .max(500, 'Descripción no puede exceder 500 caracteres'),
  unit: z.string()
    .min(1, 'Unidad es requerida')
    .max(20, 'Unidad no puede exceder 20 caracteres'),
  quantity: z.number()
    .min(0, 'Cantidad no puede ser negativa')
    .max(9999999.99, 'Cantidad excede el máximo permitido'),
  unit_cost: z.number()
    .min(0, 'Costo unitario no puede ser negativo')
    .max(999999999.99, 'Costo unitario excede el máximo permitido'),
  total_cost: z.number()
    .min(0, 'Costo total no puede ser negativo')
    .max(9999999999.99, 'Costo total excede el máximo permitido'),
  item_order: z.number()
    .int('Orden debe ser entero')
    .min(0, 'Orden no puede ser negativo')
    .optional(),
  is_custom: z.boolean().optional(),
});

export type BudgetItemFormData = z.infer<typeof budgetItemSchema>;

// ============================================================================
// PROJECT LOG SCHEMA
// ============================================================================
export const projectLogSchema = z.object({
  project_id: z.string()
    .uuid('ID de proyecto inválido')
    .min(1, 'ID de proyecto es requerido'),
  log_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD')
    .refine(date => {
      const parsed = new Date(date);
      const today = new Date();
      return parsed <= today;
    }, 'Fecha del log no puede ser futura'),
  activity_type: z.enum(['progress', 'issue', 'milestone', 'note']),
  description: z.string()
    .min(1, 'Descripción es requerida')
    .min(3, 'Descripción debe tener al menos 3 caracteres')
    .max(2000, 'Descripción no puede exceder 2000 caracteres'),
  physical_progress: z.number()
    .min(0, 'Avance físico no puede ser negativo')
    .max(100, 'Avance físico no puede exceder 100%')
    .optional(),
  financial_progress: z.number()
    .min(0, 'Avance financiero no puede ser negativo')
    .max(100, 'Avance financiero no puede exceder 100%')
    .optional(),
  created_by: z.string()
    .min(1, 'Creado por es requerido')
    .min(2, 'Creado por debe tener al menos 2 caracteres')
    .max(100, 'Creado por no puede exceder 100 caracteres'),
});

export type ProjectLogFormData = z.infer<typeof projectLogSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida un schema y retorna los errores formateados
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}

/**
 * Formatea errores de validación para mostrar en UI
 */
export function formatValidationErrors(errors: Record<string, string>): string[] {
  return Object.entries(errors).map(([field, message]) => {
    const fieldLabel = field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    return `${fieldLabel}: ${message}`;
  });
}
