import Dexie, { Table } from 'dexie';

// Database Interfaces matching Supabase schema
export interface LocalProject {
  id?: string;
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
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
  // Fields populated from budget
  budget_total?: number;
  calculated_duration?: number;
}

export interface LocalBudget {
  id?: string;
  project_id: string;
  version: number;
  direct_cost: number;
  indirect_percentage: number;
  contingency_percentage: number;
  profit_percentage: number;
  total_amount: number;
  duration_days: number;
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
}

export interface LocalBudgetItem {
  id?: string;
  budget_id: string;
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
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
}

export interface LocalBudgetItemBreakdown {
  id?: string;
  budget_item_id: string;
  resource_type: 'material' | 'labor' | 'equipment' | 'subcontract';
  code?: string;
  description: string;
  unit: string;
  quantity_unitary: number;
  total_quantity: number;
  unit_price: number;
  waste_percentage: number;
  total_price: number;
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
}

export interface LocalFinancialTransaction {
  id?: string;
  project_id?: string;
  type: 'income' | 'expense';
  category: 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' |
           'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra';
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  date: string;
  receipt_url?: string;
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
}

export interface LocalPayrollRecord {
  id?: string;
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
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
}

export interface LocalPayrollEmployee {
  id?: string;
  name: string;
  position: string;
  daily_rate: number;
  category: 'obrero' | 'empleado';
  department: string;
  hire_date: string;
  active: boolean;
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
}

export interface LocalWarehouseStock {
  id?: string;
  project_id?: string;
  item_code: string;
  description: string;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  unit_cost: number;
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
  created_at?: string;
  updated_at?: string;
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

  constructor() {
    super('ConstructoraWM_OfflineDB');
    this.version(4).stores({
      projects: 'id, code, name, sync_status, status, typology, created_at, updated_at, budget_total, calculated_duration',
      budgets: 'id, project_id, version, sync_status, created_at, updated_at',
      budgetItems: 'id, budget_id, parent_id, code, sync_status, item_order, created_at, updated_at',
      budgetItemBreakdowns: 'id, budget_item_id, resource_type, sync_status, created_at',
      financialTransactions: 'id, project_id, type, category, date, sync_status, created_at, updated_at',
      payrollEmployees: 'id, name, position, category, department, sync_status, created_at, updated_at',
      payrollRecords: 'id, project_id, employee_id, period_start, period_end, sync_status, created_at, updated_at',
      warehouseStock: 'id, project_id, item_code, sync_status, created_at, updated_at'
    });
  }
}

export const offlineDB = new WMDatabase();