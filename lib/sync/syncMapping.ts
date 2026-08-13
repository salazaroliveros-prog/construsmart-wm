/**
 * Sync Mapping System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Mapeo bidireccional entre tipos locales (Dexie) y tipos remotos (Supabase)
 * Garantiza consistencia en la comunicación bilateral
 */

import type { 
  ProjectRow, BudgetRow, BudgetItemRow, FinancialTransactionRow,
  WarehouseStockRow, PayrollRecordRow, ClientRow, SupplierRow,
  PurchaseOrderRow, PurchaseOrderItemRow, PayrollEmployeeRow, ProjectLogRow,
  SubcontractorRow
} from '@/lib/types/database';
import type {
  LocalProject, LocalBudget, LocalBudgetItem, LocalFinancialTransaction,
  LocalWarehouseStock, LocalPayrollRecord, LocalClient, LocalSupplier,
  LocalPurchaseOrder, LocalPurchaseOrderItem, LocalPayrollEmployee, LocalProjectLog,
  LocalSubcontractor
} from '@/lib/db/offlineStore';

// ==================== SYNC MAPPING TYPES ====================

export interface SyncMapping<Local, Remote> {
  localToRemote: (local: Local) => Remote;
  remoteToLocal: (remote: Remote) => Local;
  excludeFields: string[];
  calculatedFields: string[];
}

// ==================== FIELD MAPPINGS ====================

/**
 * Campos calculados locales que no se sincronizan con el servidor
 */
export const CALCULATED_FIELDS: Record<string, string[]> = {
  projects: [
    'budget_total',
    'calculated_duration', 
    'has_critical_roadblock',
    'roadblock_type',
    'roadblock_description',
    'roadblock_date',
    'completion_buffer_days'
  ],
  financialTransactions: [
    'budget_item_id',
    'payment_method',
    'tax_amount',
    'related_supplier_id',
    'related_client_id',
    'related_purchase_order_id',
    'document_number',
    'is_reconciled'
  ],
  clients: [
    'account_balance',
    'credit_limit',
    'payment_terms_days',
    'is_delinquent'
  ],
  budgets: [],
  budgetItems: [],
  warehouseStock: [],
  payrollRecords: [],
  payrollEmployees: [],
  projectLogs: [],
  suppliers: [],
  purchaseOrders: [],
  purchaseOrderItems: []
};

/**
 * Campos que deben excluirse de la sincronización (solo local)
 */
export const EXCLUDE_FIELDS: Record<string, string[]> = {
  budgetItems: [
    'apu_result',
    'apu_params'
  ],
  financialTransactions: [
    'budget_item_id',
    'payment_method',
    'tax_amount',
    'related_supplier_id',
    'related_client_id',
    'related_purchase_order_id',
    'document_number',
    'is_reconciled'
  ],
  budgetItemBreakdowns: [
    'unit_cost',
    'total_cost'
  ],
  projects: [],
  budgets: [],
  warehouseStock: [],
  payrollRecords: [],
  payrollEmployees: [],
  clients: [],
  projectLogs: [],
  suppliers: [],
  purchaseOrders: [],
  purchaseOrderItems: []
};

// ==================== SYNC MAPPINGS ====================

/**
 * Projects Sync Mapping
 */
export const projectsMapping: SyncMapping<LocalProject, ProjectRow> = {
  localToRemote: (local: LocalProject): ProjectRow => {
    const exclude = [...CALCULATED_FIELDS.projects];
    const mapped = { ...local };
    
    // Remove calculated fields
    exclude.forEach(field => delete (mapped as any)[field]);
    
    return mapped as ProjectRow;
  },
  
  remoteToLocal: (remote: ProjectRow): LocalProject => {
    return {
      ...remote,
      // Initialize calculated fields with proper types
      budget_total: remote.budget_total || undefined,
      calculated_duration: remote.calculated_duration || undefined,
      has_critical_roadblock: remote.has_critical_roadblock || false,
      roadblock_type: (remote.roadblock_type || undefined) as any,
      roadblock_description: remote.roadblock_description || undefined,
      roadblock_date: remote.roadblock_date || undefined,
      completion_buffer_days: remote.completion_buffer_days || undefined,
      // Convert null to undefined for optional fields
      client_phone: remote.client_phone || undefined,
      client_email: remote.client_email || undefined,
      start_date: remote.start_date || undefined,
      estimated_end_date: remote.estimated_end_date || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: CALCULATED_FIELDS.projects,
  calculatedFields: CALCULATED_FIELDS.projects
};

/**
 * Budgets Sync Mapping
 */
export const budgetsMapping: SyncMapping<LocalBudget, BudgetRow> = {
  localToRemote: (local: LocalBudget): BudgetRow => {
    return local as BudgetRow;
  },
  
  remoteToLocal: (remote: BudgetRow): LocalBudget => {
    return remote as LocalBudget;
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Budget Items Sync Mapping
 */
export const budgetItemsMapping: SyncMapping<LocalBudgetItem, BudgetItemRow> = {
  localToRemote: (local: LocalBudgetItem): BudgetItemRow => {
    const exclude = EXCLUDE_FIELDS.budgetItems || [];
    const mapped = { ...local };
    
    // Remove APU-specific fields
    exclude.forEach(field => delete (mapped as any)[field]);
    
    return mapped as BudgetItemRow;
  },
  
  remoteToLocal: (remote: BudgetItemRow): LocalBudgetItem => {
    return {
      ...remote,
      // Initialize APU fields
      apu_result: undefined,
      apu_params: undefined,
      // Convert null to undefined for optional fields
      project_id: remote.project_id || undefined,
      parent_id: remote.parent_id || undefined,
      length_m: remote.length_m || undefined,
      width_m: remote.width_m || undefined,
      depth_m: remote.depth_m || undefined,
      height_m: remote.height_m || undefined,
      slab_type: remote.slab_type || undefined,
      category: remote.category || undefined,
      unidades_comerciales_estimadas: remote.unidades_comerciales_estimadas || undefined,
      actual_consumption: remote.actual_consumption || undefined,
      consumption_variance: remote.consumption_variance || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: EXCLUDE_FIELDS.budgetItems || [],
  calculatedFields: ['apu_result', 'apu_params']
};

/**
 * Financial Transactions Sync Mapping
 */
export const financialTransactionsMapping: SyncMapping<LocalFinancialTransaction, FinancialTransactionRow> = {
  localToRemote: (local: LocalFinancialTransaction): FinancialTransactionRow => {
    const exclude = EXCLUDE_FIELDS.financialTransactions || [];
    const mapped = { ...local };
    
    // Remove local-only fields
    exclude.forEach(field => delete (mapped as any)[field]);
    
    return mapped as FinancialTransactionRow;
  },
  
  remoteToLocal: (remote: FinancialTransactionRow): LocalFinancialTransaction => {
    return {
      ...remote,
      // Initialize local-only fields
      budget_item_id: undefined,
      payment_method: undefined,
      tax_amount: undefined,
      related_supplier_id: undefined,
      related_client_id: undefined,
      related_purchase_order_id: undefined,
      document_number: undefined,
      is_reconciled: undefined,
      // Convert null to undefined for optional fields
      project_id: remote.project_id || undefined,
      receipt_url: remote.receipt_url || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: EXCLUDE_FIELDS.financialTransactions || [],
  calculatedFields: EXCLUDE_FIELDS.financialTransactions || []
};

/**
 * Warehouse Stock Sync Mapping
 */
export const warehouseStockMapping: SyncMapping<LocalWarehouseStock, WarehouseStockRow> = {
  localToRemote: (local: LocalWarehouseStock): WarehouseStockRow => {
    return local as WarehouseStockRow;
  },
  
  remoteToLocal: (remote: WarehouseStockRow): LocalWarehouseStock => {
    return {
      ...remote,
      // Convert null to undefined for optional fields
      project_id: remote.project_id || undefined,
      preferred_supplier_id: remote.preferred_supplier_id || undefined,
      last_po_date: remote.last_po_date || undefined,
      category: remote.category || undefined,
      budget_item_id: remote.budget_item_id || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Payroll Records Sync Mapping
 */
export const payrollRecordsMapping: SyncMapping<LocalPayrollRecord, PayrollRecordRow> = {
  localToRemote: (local: LocalPayrollRecord): PayrollRecordRow => {
    return local as PayrollRecordRow;
  },
  
  remoteToLocal: (remote: PayrollRecordRow): LocalPayrollRecord => {
    return {
      ...remote,
      // Convert null to undefined for optional fields
      project_id: remote.project_id || undefined,
      base_salary: remote.base_salary || 0,
      overtime_pay: remote.overtime_pay || 0,
      gross_salary: remote.gross_salary || 0,
      igss_deduction: remote.igss_deduction || 0,
      aguinaldo_provision: remote.aguinaldo_provision || 0,
      vacaciones_provision: remote.vacaciones_provision || 0,
      net_salary: remote.net_salary || 0,
      total_hours: remote.total_hours || 0,
      hourly_rate: remote.hourly_rate || 0,
      task_allocation_id: remote.task_allocation_id || undefined,
      planned_hours: remote.planned_hours || undefined,
      budget_item_id: remote.budget_item_id || undefined,
      cost_overrun_amount: remote.cost_overrun_amount || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Payroll Employees Sync Mapping
 */
export const payrollEmployeesMapping: SyncMapping<LocalPayrollEmployee, PayrollEmployeeRow> = {
  localToRemote: (local: LocalPayrollEmployee): PayrollEmployeeRow => {
    return local as PayrollEmployeeRow;
  },
  
  remoteToLocal: (remote: PayrollEmployeeRow): LocalPayrollEmployee => {
    return {
      ...remote,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Clients Sync Mapping
 */
export const clientsMapping: SyncMapping<LocalClient, ClientRow> = {
  localToRemote: (local: LocalClient): ClientRow => {
    const exclude = CALCULATED_FIELDS.clients || [];
    const mapped = { ...local };
    
    // Remove credit management fields
    exclude.forEach(field => delete (mapped as any)[field]);
    
    return mapped as ClientRow;
  },
  
  remoteToLocal: (remote: ClientRow): LocalClient => {
    return {
      ...remote,
      // Initialize credit management fields
      account_balance: remote.account_balance || 0,
      credit_limit: remote.credit_limit || 0,
      payment_terms_days: remote.payment_terms_days || 30,
      is_delinquent: remote.is_delinquent || false,
      // Convert null to undefined for optional fields
      company_name: remote.company_name || undefined,
      email: remote.email || undefined,
      notes: remote.notes || undefined,
      contact_person: remote.contact_person || undefined,
      tax_id: remote.tax_id || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: CALCULATED_FIELDS.clients || [],
  calculatedFields: CALCULATED_FIELDS.clients || []
};

/**
 * Project Logs Sync Mapping
 */
export const projectLogsMapping: SyncMapping<LocalProjectLog, ProjectLogRow> = {
  localToRemote: (local: LocalProjectLog): ProjectLogRow => {
    return local as ProjectLogRow;
  },
  
  remoteToLocal: (remote: ProjectLogRow): LocalProjectLog => {
    return {
      ...remote,
      // Convert null to undefined for optional fields
      physical_progress: remote.physical_progress || undefined,
      financial_progress: remote.financial_progress || undefined,
      photos: remote.photos || undefined,
      is_critical_roadblock: remote.is_critical_roadblock || undefined,
      roadblock_category: (remote.roadblock_category || undefined) as any,
      severity: (remote.severity || undefined) as any,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Suppliers Sync Mapping
 */
export const suppliersMapping: SyncMapping<LocalSupplier, SupplierRow> = {
  localToRemote: (local: LocalSupplier): SupplierRow => {
    return local as SupplierRow;
  },
  
  remoteToLocal: (remote: SupplierRow): LocalSupplier => {
    return {
      ...remote,
      // Convert null to undefined for optional fields
      email: remote.email || undefined,
      payment_terms: remote.payment_terms || '',
      notes: remote.notes || undefined,
      categories: remote.categories || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Purchase Orders Sync Mapping
 */
export const purchaseOrdersMapping: SyncMapping<LocalPurchaseOrder, PurchaseOrderRow> = {
  localToRemote: (local: LocalPurchaseOrder): PurchaseOrderRow => {
    return local as PurchaseOrderRow;
  },
  
  remoteToLocal: (remote: PurchaseOrderRow): LocalPurchaseOrder => {
    return {
      ...remote,
      // Convert null to undefined for optional fields
      project_id: remote.project_id || undefined,
      expected_delivery_date: remote.expected_delivery_date || undefined,
      notes: remote.notes || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/**
 * Purchase Order Items Sync Mapping
 */
export const purchaseOrderItemsMapping: SyncMapping<LocalPurchaseOrderItem, PurchaseOrderItemRow> = {
  localToRemote: (local: LocalPurchaseOrderItem): PurchaseOrderItemRow => {
    return local as PurchaseOrderItemRow;
  },
  
  remoteToLocal: (remote: PurchaseOrderItemRow): LocalPurchaseOrderItem => {
    return {
      ...remote,
      // Convert null to undefined for optional fields
      received_quantity: remote.received_quantity || undefined,
      last_sync_attempt: remote.last_sync_attempt || undefined,
      sync_error: remote.sync_error || undefined,
      sync_attempts: remote.sync_attempts || undefined,
    };
  },
  
  excludeFields: [],
  calculatedFields: []
};

/** Subcontractors Sync Mapping */
export const subcontractorsMapping: SyncMapping<LocalSubcontractor, SubcontractorRow> = {
  localToRemote: (local: LocalSubcontractor): SubcontractorRow => local as SubcontractorRow,
  remoteToLocal: (remote: SubcontractorRow): LocalSubcontractor => ({
    ...remote,
    supplier_id: remote.supplier_id || undefined,
    company_name: remote.company_name || undefined,
    contact_person: remote.contact_person || undefined,
    phone: remote.phone || undefined,
    email: remote.email || undefined,
    address: remote.address || undefined,
    city: remote.city || undefined,
    specialties: remote.specialties || undefined,
    contract_start_date: remote.contract_start_date || undefined,
    contract_end_date: remote.contract_end_date || undefined,
    notes: remote.notes || undefined,
  }),
  excludeFields: [],
  calculatedFields: [],
};

// ==================== SYNC MAPPING REGISTRY ====================

export const syncMappings: Record<string, SyncMapping<any, any>> = {
  projects: projectsMapping,
  budgets: budgetsMapping,
  budgetItems: budgetItemsMapping,
  financialTransactions: financialTransactionsMapping,
  warehouseStock: warehouseStockMapping,
  payrollRecords: payrollRecordsMapping,
  payrollEmployees: payrollEmployeesMapping,
  clients: clientsMapping,
  projectLogs: projectLogsMapping,
  suppliers: suppliersMapping,
  purchaseOrders: purchaseOrdersMapping,
  purchaseOrderItems: purchaseOrderItemsMapping,
  subcontractors: subcontractorsMapping,
};

// ==================== SYNC MAPPING UTILITIES ====================

/**
 * Convierte un registro local a formato remoto
 */
export function mapLocalToRemote<T>(
  table: string,
  local: T
): any {
  const mapping = syncMappings[table];
  if (!mapping) {
    console.warn(`[SyncMapping] No mapping found for table: ${table}`);
    return local;
  }
  
  return mapping.localToRemote(local);
}

/**
 * Convierte un registro remoto a formato local
 */
export function mapRemoteToLocal<T>(
  table: string,
  remote: T
): any {
  const mapping = syncMappings[table];
  if (!mapping) {
    console.warn(`[SyncMapping] No mapping found for table: ${table}`);
    return remote;
  }
  
  return mapping.remoteToLocal(remote);
}

/**
 * Valida si un campo debe ser excluido de la sincronización
 */
export function shouldExcludeField(table: string, field: string): boolean {
  const mapping = syncMappings[table];
  if (!mapping) return false;
  
  return mapping.excludeFields.includes(field);
}

/**
 * Valida si un campo es calculado (local only)
 */
export function isCalculatedField(table: string, field: string): boolean {
  const mapping = syncMappings[table];
  if (!mapping) return false;
  
  return mapping.calculatedFields.includes(field);
}
