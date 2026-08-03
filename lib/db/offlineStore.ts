import Dexie, { Table } from 'dexie';

// ============ STRICT SYNC STATUS TYPES ============
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface SyncStatusTransition {
  from: SyncStatus;
  to: SyncStatus;
  allowed: boolean;
  timestamp: Date;
}

export interface SyncableEntity {
  id?: string;
  sync_status: SyncStatus;
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
    pending: ['syncing', 'error'],
    syncing: ['synced', 'error', 'pending'],
    synced: ['pending'],
    error: ['pending', 'syncing']
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
    totalCost: number;
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

export interface LocalFinancialTransaction extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  project_id?: string;
  type: 'income' | 'expense';
  category: 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' |
           'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra' |
           'Gastos Operativos / Nómina de Mano de Obra'; // Agregado para integración Payroll
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  date: string;
  receipt_url?: string;
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
  created_at?: string;
  updated_at?: string;
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
}

export interface LocalPurchaseOrder extends SyncableEntity {
  id?: string;
  user_id?: string; // For tenant isolation
  code: string;
  supplier_id: string;
  project_id?: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
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
  financialTransactions!: Table<LocalFinancialTransaction>;
  payrollEmployees!: Table<LocalPayrollEmployee>;
  payrollRecords!: Table<LocalPayrollRecord>;
  warehouseStock!: Table<LocalWarehouseStock>;
  clients!: Table<LocalClient>;
  projectLogs!: Table<LocalProjectLog>;
  suppliers!: Table<LocalSupplier>;
  purchaseOrders!: Table<LocalPurchaseOrder>;
  purchaseOrderItems!: Table<LocalPurchaseOrderItem>;
  pendingDeletes!: Table<LocalPendingDelete>;

  constructor() {
    super('ConstructoraWM_OfflineDB');
    this.version(7).stores({
      projects: 'id, code, name, sync_status, status, typology, created_at, updated_at, budget_total, calculated_duration',
      budgets: 'id, project_id, version, sync_status, created_at, updated_at',
      budgetItems: 'id, budget_id, project_id, parent_id, code, sync_status, item_order, created_at, updated_at, actual_consumption, consumption_variance',
      financialTransactions: 'id, project_id, type, category, date, sync_status, created_at, updated_at',
      payrollEmployees: 'id, name, position, category, department, sync_status, created_at, updated_at',
      payrollRecords: 'id, project_id, employee_id, period_start, period_end, sync_status, created_at, updated_at',
      warehouseStock: 'id, project_id, item_code, sync_status, created_at, updated_at',
      clients: 'id, code, name, client_type, sync_status, created_at, updated_at',
      projectLogs: 'id, project_id, log_date, activity_type, sync_status, created_at, updated_at',
      suppliers: 'id, code, name, sync_status, created_at, updated_at',
      purchaseOrders: 'id, code, supplier_id, project_id, status, order_date, sync_status, created_at, updated_at',
      purchaseOrderItems: 'id, purchase_order_id, item_code, sync_status, created_at, updated_at',
      pendingDeletes: '++id, table, serverId, created_at'
    });
  }
}

export const offlineDB = new WMDatabase();