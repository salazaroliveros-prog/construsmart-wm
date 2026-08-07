/**
 * CONSTRUCTORA WM/M&S - SUPABASE SCHEMA VALIDATOR
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Script para validar y confirmar que la base de datos remota de Supabase
 * está alineada con las interfaces TypeScript de la suite local
 */

import { supabase } from './client';

interface TableValidation {
  tableName: string;
  exists: boolean;
  columns: string[];
  missingColumns: string[];
  alignmentStatus: 'aligned' | 'partial' | 'misaligned';
}

interface SchemaValidationReport {
  totalTables: number;
  alignedTables: number;
  partialTables: number;
  misalignedTables: number;
  tableValidations: TableValidation[];
  recommendations: string[];
}

// Expected columns based on TypeScript interfaces
const EXPECTED_COLUMNS = {
  projects: [
    'id', 'code', 'name', 'client_name', 'status', 'typology', 'quality_level',
    'area_m2', 'budget_total', 'total_budget', 'start_date', 'estimated_end_date',
    'duration_days', 'calculated_duration', 'created_at', 'updated_at', 'sync_status',
    'has_critical_roadblock', 'roadblock_type', 'roadblock_description', 'roadblock_date',
    'completion_buffer_days', 'user_id'
  ],
  clients: [
    'id', 'code', 'name', 'company_name', 'client_type', 'phone', 'email',
    'address', 'city', 'payment_terms', 'notes', 'created_at', 'updated_at',
    'sync_status', 'account_balance', 'credit_limit', 'payment_terms_days',
    'is_delinquent', 'user_id'
  ],
  warehouse_stock: [
    'id', 'project_id', 'item_code', 'description', 'unit', 'current_stock',
    'minimum_threshold', 'unit_cost', 'created_at', 'updated_at', 'sync_status',
    'preferred_supplier_id', 'auto_generate_po', 'last_po_date', 'category', 'user_id',
    'budget_item_id'
  ], // Note: preferred_supplier_id and budget_item_id are UUID type
  suppliers: [
    'id', 'code', 'name', 'contact_person', 'phone', 'email', 'address',
    'city', 'payment_terms', 'notes', 'created_at', 'updated_at', 'sync_status',
    'categories', 'is_preferred', 'user_id'
  ],
  payroll_records: [
    'id', 'project_id', 'employee_id', 'period_start', 'period_end',
    'days_worked', 'overtime_hours', 'overtime_rate', 'bonuses', 'deductions',
    'base_salary', 'overtime_pay', 'gross_salary', 'igss_deduction',
    'aguinaldo_provision', 'vacaciones_provision', 'net_salary', 'created_at',
    'updated_at', 'sync_status', 'total_hours', 'hourly_rate', 'planned_hours',
    'budget_item_id', 'cost_overrun_amount', 'is_overrun_warning_fired', 'user_id'
  ], // Note: budget_item_id is UUID type
  project_logs: [
    'id', 'project_id', 'log_date', 'activity_type', 'description',
    'progress_percentage', 'notes', 'created_at', 'updated_at', 'sync_status',
    'is_critical_roadblock', 'roadblock_category', 'severity', 'user_id'
  ],
  budgets: [
    'id', 'project_id', 'version', 'direct_cost', 'indirect_percentage',
    'indirect_cost', 'contingency_percentage', 'contingency', 'profit_percentage',
    'profit', 'total_amount', 'duration_days', 'created_at', 'updated_at', 'sync_status'
  ],
  budget_items: [
    'id', 'budget_id', 'project_id', 'parent_id', 'code', 'description',
    'unit', 'quantity', 'unit_cost', 'total_cost', 'item_order', 'created_at',
    'updated_at', 'sync_status', 'actual_consumption', 'consumption_variance'
  ],
  financial_transactions: [
    'id', 'project_id', 'type', 'category', 'description', 'quantity',
    'unit', 'unit_cost', 'total_cost', 'date', 'receipt_url', 'created_at',
    'updated_at', 'sync_status', 'reference', 'user_id'
  ],
  purchase_orders: [
    'id', 'code', 'supplier_id', 'project_id', 'order_date', 'expected_delivery_date',
    'status', 'created_at', 'updated_at', 'sync_status'
  ],
  purchase_order_items: [
    'id', 'purchase_order_id', 'item_code', 'description', 'quantity',
    'unit', 'unit_cost', 'total_cost', 'created_at', 'updated_at', 'sync_status'
  ],
  payroll_employees: [
    'id', 'name', 'position', 'daily_rate', 'category', 'department',
    'hire_date', 'active', 'created_at', 'updated_at', 'sync_status', 'user_id'
  ],
  pending_deletes: [
    '++id', 'table', 'serverId', 'created_at'
  ]
};

/**
 * Get columns for a specific table from Supabase
 */
async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return [];
    }

    // Query a single row to get column structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error getting columns for ${tableName}:`, error);
      return [];
    }

    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }

    // If no data, try to get column information from information schema
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: tableName });

    if (columnsError) {
      console.error(`Error getting columns via RPC for ${tableName}:`, columnsError);
      return [];
    }

    return columnsData || [];
  } catch (error) {
    console.error(`Exception getting columns for ${tableName}:`, error);
    return [];
  }
}

/**
 * Validate a single table
 */
async function validateTable(tableName: string): Promise<TableValidation> {
  const expectedColumns = EXPECTED_COLUMNS[tableName as keyof typeof EXPECTED_COLUMNS];
  
  if (!expectedColumns) {
    return {
      tableName,
      exists: false,
      columns: [],
      missingColumns: [],
      alignmentStatus: 'misaligned'
    };
  }

  const actualColumns = await getTableColumns(tableName);
  const exists = actualColumns.length > 0;

  if (!exists) {
    return {
      tableName,
      exists: false,
      columns: [],
      missingColumns: expectedColumns,
      alignmentStatus: 'misaligned'
    };
  }

  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  
  let alignmentStatus: 'aligned' | 'partial' | 'misaligned' = 'aligned';
  if (missingColumns.length > 0) {
    alignmentStatus = missingColumns.length > expectedColumns.length / 2 ? 'misaligned' : 'partial';
  }

  return {
    tableName,
    exists: true,
    columns: actualColumns,
    missingColumns,
    alignmentStatus
  };
}

/**
 * Generate complete schema validation report
 */
export async function validateSupabaseSchema(): Promise<SchemaValidationReport> {
  const tableNames = Object.keys(EXPECTED_COLUMNS);
  const tableValidations: TableValidation[] = [];

  for (const tableName of tableNames) {
    const validation = await validateTable(tableName);
    tableValidations.push(validation);
  }

  const alignedTables = tableValidations.filter(t => t.alignmentStatus === 'aligned').length;
  const partialTables = tableValidations.filter(t => t.alignmentStatus === 'partial').length;
  const misalignedTables = tableValidations.filter(t => t.alignmentStatus === 'misaligned').length;

  const recommendations: string[] = [];

  // Generate recommendations based on validation results
  tableValidations.forEach(validation => {
    if (validation.alignmentStatus === 'misaligned') {
      if (!validation.exists) {
        recommendations.push(`Crear tabla "${validation.tableName}" con columnas: ${validation.missingColumns.join(', ')}`);
      } else {
        recommendations.push(`Alinear tabla "${validation.tableName}" - columnas faltantes: ${validation.missingColumns.join(', ')}`);
      }
    } else if (validation.alignmentStatus === 'partial') {
      recommendations.push(`Agregar columnas faltantes a "${validation.tableName}": ${validation.missingColumns.join(', ')}`);
    }
  });

  if (alignedTables === tableNames.length) {
    recommendations.push('✅ Esquema completamente alineado con la suite local');
  }

  return {
    totalTables: tableNames.length,
    alignedTables,
    partialTables,
    misalignedTables,
    tableValidations,
    recommendations
  };
}

/**
 * Format validation report for display
 */
export function formatValidationReport(report: SchemaValidationReport): string {
  let output = `=== SUPABASE SCHEMA VALIDATION REPORT ===\n\n`;
  output += `Total Tables: ${report.totalTables}\n`;
  output += `Aligned: ${report.alignedTables} ✅\n`;
  output += `Partial: ${report.partialTables} ⚠️\n`;
  output += `Misaligned: ${report.misalignedTables} ❌\n\n`;

  output += `=== TABLE VALIDATIONS ===\n\n`;
  
  report.tableValidations.forEach(validation => {
    const statusIcon = validation.alignmentStatus === 'aligned' ? '✅' : 
                      validation.alignmentStatus === 'partial' ? '⚠️' : '❌';
    output += `${statusIcon} ${validation.tableName}\n`;
    output += `   Exists: ${validation.exists ? 'Yes' : 'No'}\n`;
    output += `   Columns: ${validation.columns.length}\n`;
    if (validation.missingColumns.length > 0) {
      output += `   Missing: ${validation.missingColumns.join(', ')}\n`;
    }
    output += `\n`;
  });

  output += `=== RECOMMENDATIONS ===\n\n`;
  report.recommendations.forEach(rec => {
    output += `• ${rec}\n`;
  });

  return output;
}
