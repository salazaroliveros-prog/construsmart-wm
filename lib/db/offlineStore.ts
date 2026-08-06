import Dexie, { Table } from 'dexie';

// ============ STRICT SYNC STATUS TYPES ============
// Alineado con Supabase schema: 'synced' | 'created_offline' | 'updated_offline' | 'syncing' | 'pending' | 'sync_failed'
export type SyncStatus = 'synced' | 'created_offline' | 'updated_offline' | 'syncing' | 'pending' | 'sync_failed';

// Re-exportar desde syncState para consistencia
export type { SyncStatusValue } from '@/lib/utils/syncState';

export interface SyncStatusTransition {
  from: SyncStatus;
  to: SyncStatus;
  allowed: boolean;
  timestamp: Date;
}

export interface SyncableEntity {
  id?: string;
  sync_status: SyncStatus; // Default: 'synced'
  last_sync_attempt?: string;
  sync_error?: string;
  validateTransition?: (newStatus: SyncStatus) => boolean;
}

// Validador de transiciones de estado
export const validateSyncTransition = (
  currentStatus: SyncStatus,
  newStatus: SyncStatus
): boolean => {
  const allowedTransitions: Record<SyncStatus, SyncStatus[]> = {
    synced: ['updated_offline', 'syncing'],
    created_offline: ['syncing', 'sync_failed'],
    updated_offline: ['syncing', 'sync_failed'],
    syncing: ['synced', 'sync_failed', 'pending'],
    pending: ['syncing', 'sync_failed'],
    sync_failed: ['syncing', 'pending']
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
};

// Database Interfaces matching Supabase schema
export interface LocalProject extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  code: string;
  name: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  location: string;
  typology: 'residential' | 'commercial' | 'industrial' | 'civil' | 'public';
  area_m2: number;
  quality_level: 'basic' | 'moderate' | 'premium';
  status: 'planning' | 'execution' | 'paused' | 'completed';
  start_date?: string;
  estimated_end_date?: string;
  duration_days: number;
  total_budget: number;
  created_at?: string;
  updated_at?: string;
  // Fields populated from budget
  budget_total?: number;
  calculated_duration?: number;
  // Roadblock and warning flags from bitácoras
  has_critical_roadblock?: boolean;
  roadblock_type?: 'clima' | 'material' | 'personal' | 'técnico' | 'permiso' | 'financiero' | 'otro';
  roadblock_description?: string;
  roadblock_date?: string;
  completion_buffer_days?: number; // Calculated buffer days remaining
}

export interface LocalBudget extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  project_id: string;
  version: number;
  direct_cost: number;
  indirect_percentage: number;
  contingency_percentage: number;
  profit_percentage: number;
  total_amount: number;
  duration_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface LocalBudgetItem extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  budget_id: string;
  project_id?: string; // For warehouse integration
  parent_id?: string;
  item_order: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  is_custom: boolean;
  length_m?: number;
  width_m?: number;
  depth_m?: number;
  height_m?: number;
  slab_type?: string;
  category?: string; // For warehouse integration
  // Commercial conversion field for warehouse integration
  unidades_comerciales_estimadas?: number; // Stores commercial units (bags, quintales, etc.)
  // Warehouse consumption tracking
  actual_consumption?: number; // Actual material consumed from warehouse
  consumption_variance?: number; // Difference between estimated and actual
  // APU Integration Fields
  apu_result?: {
    totalMaterialQuantity: number;
    unitLaborCost: number;
    directCost: number;
    indirectCost: number;
    total_cost: number;
    breakdown: {
      materials: number;
      labor: number;
      machinery: number;
    };
  };
  apu_params?: {
    theoreticalQuantity: number;
    wastePercentage: number;
    volumetricFactor: number;
    crewDailySalary: number;
    dailyPerformance: number;
    indirectPercentage: number;
    materialUnitCost?: number;
    machineryCost?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LocalBudgetItemBreakdown extends SyncableEntity {
  id?: string;
  user_id?: string;
  budget_item_id: string;
  resource_type?: string;
  code?: string;
  description?: string;
  unit?: string;
  quantity_unitary?: number;
  total_quantity?: number;
  unit_price?: number;
  waste_percentage?: number;
  total_price?: number;
  unit_cost?: number;
  total_cost?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LocalFinancialTransaction extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  project_id?: string;
  type: 'income' | 'expense';
  category: 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' |
           'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra' |
           'Gastos Operativos / Nómina de Mano de Obra';
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  date: string;
  receipt_url?: string;
  // Payment / treasury tracking
  payment_method?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'anticipo';
  tax_amount?: number; // IVA / impuestos incluidos en la transacción
  related_supplier_id?: string;
  related_client_id?: string;
  related_purchase_order_id?: string;
  document_number?: string; // Factura / recibo / comprobante
  is_reconciled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocalPayrollRecord extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  project_id?: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  days_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  base_salary: number;
  overtime_pay: number;
  gross_salary: number;
  igss_deduction: number;
  aguinaldo_provision: number;
  vacaciones_provision: number;
  net_salary: number;
  total_hours?: number; // Total hours worked (regular + overtime)
  hourly_rate?: number; // Hourly rate calculated from daily rate
  created_at?: string;
  updated_at?: string;
  // Labor cost overrun detection fields
  task_allocation_id?: string; // Reference to budget item being worked on
  planned_hours?: number; // Planned hours for the task
  budget_item_id?: string; // UUID reference to budget_items table
  cost_overrun_amount?: number; // Calculated overrun amount
  is_overrun_warning_fired?: boolean; // Flag to prevent duplicate warnings
}

export interface LocalPayrollEmployee extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  name: string;
  position: string;
  daily_rate: number;
  category: 'obrero' | 'empleado';
  department: string;
  hire_date: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocalWarehouseStock extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  project_id?: string;
  item_code: string;
  description: string;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  unit_cost: number;
  created_at?: string;
  updated_at?: string;
  // Auto-PO integration fields
  preferred_supplier_id?: string; // UUID reference to suppliers table
  auto_generate_po?: boolean;
  last_po_date?: string;
  category?: string; // For supplier routing
}

export interface LocalClient extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  code: string;
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  client_type: 'individual' | 'corporate';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Account balance and credit fields for budget integration
  account_balance?: number; // Current account balance in GTQ
  credit_limit?: number; // Credit limit for the client
  payment_terms_days?: number; // Payment terms in days
  is_delinquent?: boolean; // Flag for overdue payments
}

export interface LocalProjectLog extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  project_id: string;
  log_date: string;
  activity_type: 'progress' | 'issue' | 'milestone' | 'note';
  description: string;
  physical_progress?: number;
  financial_progress?: number;
  photos?: string[];
  created_by: string;
  created_at: string;
  updated_at?: string;
  // Roadblock detection fields
  is_critical_roadblock?: boolean;
  roadblock_category?: 'clima' | 'material' | 'personal' | 'técnico' | 'permiso' | 'financiero' | 'otro';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface LocalSupplier extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  payment_terms: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Auto-PO routing fields
  categories?: string[]; // Material categories this supplier handles
  is_preferred?: boolean; // Mark as preferred for auto-PO
}

export interface LocalSubcontractor extends SyncableEntity {
  id?: string;
  user_id?: string;
  supplier_id?: string; // Link to LocalSupplier when applicable
  code: string;
  name: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  specialties?: unknown[];
  contract_start_date?: string;
  contract_end_date?: string;
  contract_value: number;
  retention_rate: number; // Ej: 0.10 = 10% retención de garantía
  advance_amount: number; // Anticipo entregado
  advance_balance: number; // Saldo restante por amortizar
  retention_balance: number; // Saldo retenido pendiente de liberación
  is_active?: boolean;
  status: 'active' | 'suspended' | 'completed';
  notes?: string;
  created_at: string;
  updated_at?: string;
  [key: number]: string | number | boolean | undefined | string[];
}

export interface LocalPurchaseOrder extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  code: string;
  supplier_id: string;
  project_id?: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'pending' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface LocalPurchaseOrderItem extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  purchase_order_id: string;
  item_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  received_quantity?: number;
  created_at: string;
  updated_at?: string;
}

// Tombstone de borrado: registra que una fila ya sincronizada debe eliminarse
// en Supabase. Se crea al borrar un registro sin conexión y el motor de sync
// la procesa (DELETE en servidor + limpieza local) al volver online.
export interface LocalPendingDelete {
  id?: number;
  table: string;
  serverId: string;
  created_at: number;
}

export class WMDatabase extends Dexie {
  projects!: Table<LocalProject>;
  budgets!: Table<LocalBudget>;
  budgetItems!: Table<LocalBudgetItem>;
  budgetItemBreakdowns!: Table<LocalBudgetItemBreakdown>;
  financialTransactions!: Table<LocalFinancialTransaction>;
  payrollEmployees!: Table<LocalPayrollEmployee>;
  payrollRecords!: Table<LocalPayrollRecord>;
  warehouseStock!: Table<LocalWarehouseStock>;
  clients!: Table<LocalClient>;
  projectLogs!: Table<LocalProjectLog>;
  suppliers!: Table<LocalSupplier>;
  purchaseOrders!: Table<LocalPurchaseOrder>;
  purchaseOrderItems!: Table<LocalPurchaseOrderItem>;
  subcontractors!: Table<LocalSubcontractor>;
  pendingDeletes!: Table<LocalPendingDelete>;

  constructor() {
    super('ConstructoraWM_OfflineDB');
    this.version(10).stores({
      projects: 'id, user_id, code, name, sync_status, status, typology, created_at, updated_at, budget_total, calculated_duration, has_critical_roadblock, roadblock_type, roadblock_date',
      budgets: 'id, user_id, project_id, version, sync_status, created_at, updated_at',
      budgetItems: 'id, user_id, budget_id, project_id, parent_id, code, sync_status, item_order, created_at, updated_at, actual_consumption, consumption_variance, category',
      budgetItemBreakdowns: 'id, user_id, budget_item_id, resource_type, code, sync_status, created_at, updated_at',
      financialTransactions: 'id, user_id, project_id, type, category, date, sync_status, created_at, updated_at',
      payrollEmployees: 'id, user_id, name, position, category, department, sync_status, created_at, updated_at',
      payrollRecords: 'id, user_id, project_id, employee_id, period_start, period_end, sync_status, created_at, updated_at, budget_item_id, is_overrun_warning_fired',
      warehouseStock: 'id, user_id, project_id, item_code, sync_status, created_at, updated_at, preferred_supplier_id, auto_generate_po, category',
      clients: 'id, user_id, code, name, client_type, sync_status, created_at, updated_at, account_balance, credit_limit, is_delinquent',
      projectLogs: 'id, user_id, project_id, log_date, activity_type, sync_status, created_at, updated_at, is_critical_roadblock, roadblock_category, severity',
      suppliers: 'id, user_id, code, name, sync_status, created_at, updated_at, categories, is_preferred',
      purchaseOrders: 'id, user_id, code, supplier_id, project_id, status, order_date, sync_status, created_at, updated_at',
      purchaseOrderItems: 'id, user_id, purchase_order_id, item_code, sync_status, created_at, updated_at',
      subcontractors: 'id, user_id, supplier_id, code, status, sync_status, created_at, updated_at',
      pendingDeletes: '++id, table, serverId, created_at'
    });
  }
}

export const offlineDB = new WMDatabase();