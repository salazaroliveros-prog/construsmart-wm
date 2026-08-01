import { z } from 'zod';

// Schema para Proyectos
export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  client_name: z.string().min(1, 'El nombre del cliente es requerido').max(200),
  client_phone: z.string().max(20).optional().nullable(),
  client_email: z.string().email('Email inválido').max(100).optional().nullable(),
  location: z.string().min(1, 'La ubicación es requerida').max(200),
  typology: z.enum(['residential', 'commercial', 'industrial', 'civil', 'public']),
  area_m2: z.number().positive('El área debe ser mayor a 0'),
  quality_level: z.enum(['basic', 'moderate', 'premium']),
  status: z.enum(['planning', 'execution', 'paused', 'completed']),
  start_date: z.string().datetime().optional().nullable(),
  estimated_end_date: z.string().datetime().optional().nullable(),
  duration_days: z.number().int().positive('La duración debe ser mayor a 0'),
  total_budget: z.number().nonnegative('El presupuesto no puede ser negativo'),
  budget_total: z.number().nonnegative().optional().nullable(),
  calculated_duration: z.number().int().nonnegative().optional().nullable(),
});

// Schema para Presupuestos
export const BudgetSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid('ID de proyecto inválido'),
  version: z.number().int().positive(),
  direct_cost: z.number().nonnegative(),
  indirect_percentage: z.number().min(0).max(100),
  contingency_percentage: z.number().min(0).max(100),
  profit_percentage: z.number().min(0).max(100),
  total_amount: z.number().nonnegative(),
  duration_days: z.number().int().positive(),
});

// Schema para Items de Presupuesto
export const BudgetItemSchema = z.object({
  id: z.string().uuid().optional(),
  budget_id: z.string().uuid('ID de presupuesto inválido'),
  parent_id: z.string().uuid().optional().nullable(),
  item_order: z.number().int().nonnegative(),
  code: z.string().min(1, 'El código es requerido').max(50),
  description: z.string().min(1, 'La descripción es requerida').max(500),
  unit: z.string().min(1, 'La unidad es requerida').max(20),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unit_cost: z.number().nonnegative('El costo unitario no puede ser negativo'),
  total_cost: z.number().nonnegative(),
  is_custom: z.boolean(),
  length_m: z.number().positive().optional().nullable(),
  width_m: z.number().positive().optional().nullable(),
  depth_m: z.number().positive().optional().nullable(),
  height_m: z.number().positive().optional().nullable(),
  slab_type: z.string().max(50).optional().nullable(),
});

// Schema para Transacciones Financieras
export const FinancialTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional().nullable(),
  type: z.enum(['income', 'expense']),
  category: z.enum([
    'materiales',
    'mano_de_obra',
    'herramienta',
    'sub_contrato',
    'administrativo',
    'personal',
    'transporte',
    'fijos',
    'hogar',
    'aporte',
    'trabajos_extra'
  ]),
  description: z.string().min(1, 'La descripción es requerida').max(500),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'La unidad es requerida').max(20),
  unit_cost: z.number().nonnegative('El costo unitario no puede ser negativo'),
  total_cost: z.number().nonnegative(),
  date: z.string().datetime('Fecha inválida'),
  receipt_url: z.string().url().optional().nullable(),
});

// Schema para Empleados
export const PayrollEmployeeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  position: z.string().min(1, 'El puesto es requerido').max(100),
  daily_rate: z.number().positive('La tarifa diaria debe ser mayor a 0'),
  category: z.enum(['obrero', 'empleado']),
  department: z.string().min(1, 'El departamento es requerido').max(100),
  hire_date: z.string().datetime('Fecha de contratación inválida'),
  active: z.boolean(),
});

// Schema para Registros de Nómina
export const PayrollRecordSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().uuid('ID de empleado inválido'),
  period_start: z.string().datetime('Fecha de inicio inválida'),
  period_end: z.string().datetime('Fecha de fin inválida'),
  days_worked: z.number().int().min(0).max(31),
  overtime_hours: z.number().min(0),
  overtime_rate: z.number().nonnegative(),
  bonuses: z.number().nonnegative(),
  deductions: z.number().nonnegative(),
  base_salary: z.number().nonnegative(),
  overtime_pay: z.number().nonnegative(),
  gross_salary: z.number().nonnegative(),
  igss_deduction: z.number().nonnegative(),
  aguinaldo_provision: z.number().nonnegative(),
  vacaciones_provision: z.number().nonnegative(),
  net_salary: z.number().nonnegative(),
});

// Schema para Inventario
export const WarehouseStockSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional().nullable(),
  item_code: z.string().min(1, 'El código es requerido').max(50),
  description: z.string().min(1, 'La descripción es requerida').max(200),
  unit: z.string().min(1, 'La unidad es requerida').max(20),
  current_stock: z.number().nonnegative('El stock no puede ser negativo'),
  minimum_threshold: z.number().nonnegative('El umbral mínimo no puede ser negativo'),
  unit_cost: z.number().nonnegative('El costo unitario no puede ser negativo'),
});

// Schema para Clientes
export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  company_name: z.string().max(200).optional().nullable(),
  phone: z.string().min(1, 'El teléfono es requerido').max(20),
  email: z.string().email('Email inválido').max(100).optional().nullable(),
  address: z.string().min(1, 'La dirección es requerida').max(300),
  city: z.string().min(1, 'La ciudad es requerida').max(100),
  client_type: z.enum(['individual', 'corporate']),
  notes: z.string().max(1000).optional().nullable(),
});

// Schema para Bitácora
export const ProjectLogSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid('ID de proyecto inválido'),
  log_date: z.string().datetime('Fecha inválida'),
  activity_type: z.enum(['progress', 'issue', 'milestone', 'note']),
  description: z.string().min(1, 'La descripción es requerida').max(1000),
  physical_progress: z.number().min(0).max(100).optional().nullable(),
  financial_progress: z.number().min(0).max(100).optional().nullable(),
  created_by: z.string().min(1, 'El creador es requerido').max(200),
});

// Schema para Proveedores
export const SupplierSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  contact_person: z.string().min(1, 'La persona de contacto es requerida').max(200),
  phone: z.string().min(1, 'El teléfono es requerido').max(20),
  email: z.string().email('Email inválido').max(100).optional().nullable(),
  address: z.string().min(1, 'La dirección es requerida').max(300),
  city: z.string().min(1, 'La ciudad es requerida').max(100),
  payment_terms: z.string().min(1, 'Los términos de pago son requeridos').max(200),
  notes: z.string().max(1000).optional().nullable(),
});

// Schema para Órdenes de Compra
export const PurchaseOrderSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'El código es requerido').max(50),
  supplier_id: z.string().uuid('ID de proveedor inválido'),
  project_id: z.string().uuid().optional().nullable(),
  order_date: z.string().datetime('Fecha inválida'),
  expected_delivery_date: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'approved', 'ordered', 'received', 'cancelled']),
  total_amount: z.number().nonnegative('El monto no puede ser negativo'),
  notes: z.string().max(1000).optional().nullable(),
});

// Schema para Items de Orden de Compra
export const PurchaseOrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  purchase_order_id: z.string().uuid('ID de orden de compra inválido'),
  item_code: z.string().min(1, 'El código es requerido').max(50),
  description: z.string().min(1, 'La descripción es requerida').max(500),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'La unidad es requerida').max(20),
  unit_price: z.number().nonnegative('El precio unitario no puede ser negativo'),
  total_price: z.number().nonnegative(),
  received_quantity: z.number().min(0).optional().nullable(),
});

// Helper para validar datos
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string = 'Datos inválidos'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`${firstError.path.join('.')}: ${firstError.message}`);
    }
    throw new Error(errorMessage);
  }
}

// Helper para validar datos de forma segura (sin lanzar error)
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: `${firstError.path.join('.')}: ${firstError.message}`
    };
  }
}