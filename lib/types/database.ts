/**
 * CONSTRUCTORA WM/M&S - TIPOS ESTRICTOS DE SUPABASE (Database Types)
 * Slogan: "CONSTRUYENDO EL FUTURO"
 *
 * Tipos manuales alineados con el esquema real de Supabase.
 * Respaldan payloads de mutación y respuestas de consultas.
 */

export type ProjectStatus = 'planning' | 'execution' | 'paused' | 'completed';
export type ProjectTypology = 'residential' | 'commercial' | 'industrial' | 'civil' | 'public';
export type QualityLevel = 'basic' | 'moderate' | 'premium';
export type SyncStatus = 'synced' | 'created_offline' | 'updated_offline' | 'syncing' | 'pending' | 'sync_failed';
export type ExpenseCategory = 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' | 'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra' | 'Gastos Operativos / Nómina de Mano de Obra';
export type OrderStatus = 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
export type ClientType = 'individual' | 'corporate';

export interface ProjectRow {
  id: string;
  user_id: string;
  code: string;
  name: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  location: string;
  typology: ProjectTypology;
  area_m2: number;
  quality_level: QualityLevel;
  status: ProjectStatus;
  start_date: string | null;
  estimated_end_date: string | null;
  duration_days: number;
  total_budget: number;
  budget_total: number | null;
  calculated_duration: number | null;
  has_critical_roadblock: boolean;
  roadblock_type: string | null;
  roadblock_description: string | null;
  roadblock_date: string | null;
  completion_buffer_days: number | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<ProjectRow, 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>>;

export interface BudgetRow {
  id: string;
  user_id: string;
  project_id: string;
  version: number;
  direct_cost: number;
  indirect_percentage: number;
  contingency_percentage: number;
  profit_percentage: number;
  total_amount: number;
  duration_days: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type BudgetInsert = Omit<BudgetRow, 'created_at' | 'updated_at'>;
export type BudgetUpdate = Partial<Omit<BudgetRow, 'id' | 'created_at' | 'updated_at'>>;

export interface FinancialTransactionRow {
  id: string;
  user_id: string;
  project_id: string | null;
  type: 'income' | 'expense';
  category: ExpenseCategory;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  date: string;
  receipt_url: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type FinancialTransactionInsert = Omit<FinancialTransactionRow, 'created_at' | 'updated_at'>;
export type FinancialTransactionUpdate = Partial<Omit<FinancialTransactionRow, 'id' | 'created_at' | 'updated_at'>>;

export interface BudgetItemRow {
  id: string;
  user_id: string;
  budget_id: string;
  project_id: string | null;
  parent_id: string | null;
  item_order: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  is_custom: boolean;
  length_m: number | null;
  width_m: number | null;
  depth_m: number | null;
  height_m: number | null;
  slab_type: string | null;
  category: string | null;
  unidades_comerciales_estimadas: number | null;
  actual_consumption: number | null;
  consumption_variance: number | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type BudgetItemInsert = Omit<BudgetItemRow, 'created_at' | 'updated_at'>;
export type BudgetItemUpdate = Partial<Omit<BudgetItemRow, 'id' | 'created_at' | 'updated_at'>>;

export interface WarehouseStockRow {
  id: string;
  user_id: string;
  project_id: string | null;
  item_code: string;
  description: string;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  unit_cost: number;
  preferred_supplier_id: string | null;
  auto_generate_po: boolean;
  last_po_date: string | null;
  category: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type WarehouseStockInsert = Omit<WarehouseStockRow, 'created_at' | 'updated_at'>;
export type WarehouseStockUpdate = Partial<Omit<WarehouseStockRow, 'id' | 'created_at' | 'updated_at'>>;

export interface PayrollRecordRow {
  id: string;
  user_id: string;
  project_id: string | null;
  employee_id: string;
  period_start: string;
  period_end: string;
  days_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  base_salary: number | null;
  overtime_pay: number | null;
  gross_salary: number | null;
  igss_deduction: number | null;
  aguinaldo_provision: number | null;
  vacaciones_provision: number | null;
  net_salary: number | null;
  total_hours: number | null;
  hourly_rate: number | null;
  task_allocation_id: string | null;
  planned_hours: number | null;
  budget_item_id: string | null;
  cost_overrun_amount: number | null;
  is_overrun_warning_fired: boolean;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type PayrollRecordInsert = Omit<PayrollRecordRow, 'created_at' | 'updated_at'>;
export type PayrollRecordUpdate = Partial<Omit<PayrollRecordRow, 'id' | 'created_at' | 'updated_at'>>;

export interface ClientRow {
  id: string;
  user_id: string;
  code: string;
  name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  client_type: ClientType;
  notes: string | null;
  account_balance: number;
  credit_limit: number;
  payment_terms_days: number;
  is_delinquent: boolean;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<ClientRow, 'created_at' | 'updated_at'>;
export type ClientUpdate = Partial<Omit<ClientRow, 'id' | 'created_at' | 'updated_at'>>;

export interface SupplierRow {
  id: string;
  user_id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  payment_terms: string | null;
  notes: string | null;
  categories: string[] | null;
  is_preferred: boolean;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type SupplierInsert = Omit<SupplierRow, 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<Omit<SupplierRow, 'id' | 'created_at' | 'updated_at'>>;

export interface PurchaseOrderRow {
  id: string;
  user_id: string;
  code: string;
  supplier_id: string;
  project_id: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type PurchaseOrderInsert = Omit<PurchaseOrderRow, 'created_at' | 'updated_at'>;
export type PurchaseOrderUpdate = Partial<Omit<PurchaseOrderRow, 'id' | 'created_at' | 'updated_at'>>;

// Esquema de referencia agrupado (compatible con createClient<Database> de Supabase)
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      budgets: {
        Row: BudgetRow;
        Insert: BudgetInsert;
        Update: BudgetUpdate;
      };
      budget_items: {
        Row: BudgetItemRow;
        Insert: BudgetItemInsert;
        Update: BudgetItemUpdate;
      };
      financial_transactions: {
        Row: FinancialTransactionRow;
        Insert: FinancialTransactionInsert;
        Update: FinancialTransactionUpdate;
      };
      warehouse_stock: {
        Row: WarehouseStockRow;
        Insert: WarehouseStockInsert;
        Update: WarehouseStockUpdate;
      };
      payroll_records: {
        Row: PayrollRecordRow;
        Insert: PayrollRecordInsert;
        Update: PayrollRecordUpdate;
      };
      clients: {
        Row: ClientRow;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      suppliers: {
        Row: SupplierRow;
        Insert: SupplierInsert;
        Update: SupplierUpdate;
      };
      purchase_orders: {
        Row: PurchaseOrderRow;
        Insert: PurchaseOrderInsert;
        Update: PurchaseOrderUpdate;
      };
    };
  };
}
