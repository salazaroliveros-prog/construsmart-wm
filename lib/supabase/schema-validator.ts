/**
 * CONSTRUCTORA WM/M&S - SUPABASE SCHEMA VALIDATOR
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Script para validar y confirmar que la base de datos remota de Supabase
 * está alineada con las interfaces TypeScript de la suite local
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// Este módulo se usa por el script de validación. Si se ejecuta sin variables
// remotas, el reporte debe fallar explícitamente, no inventar tablas ausentes.
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

interface TableValidation {
  tableName: string;
  exists: boolean;
  columns: string[];
  missingColumns: string[];
  alignmentStatus: 'aligned' | 'partial' | 'misaligned' | 'unknown';
}

interface SchemaValidationReport {
  totalTables: number;
  alignedTables: number;
  partialTables: number;
  misalignedTables: number;
  unknownTables: number;
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
    'completion_buffer_days', 'user_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  clients: [
    'id', 'code', 'name', 'company_name', 'client_type', 'phone', 'email',
    'address', 'city', 'notes', 'created_at', 'updated_at',
    'sync_status', 'account_balance', 'credit_limit', 'payment_terms_days',
    'is_delinquent', 'user_id', 'contact_person', 'tax_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  warehouse_stock: [
    'id', 'project_id', 'item_code', 'description', 'unit', 'current_stock',
    'minimum_threshold', 'unit_cost', 'created_at', 'updated_at', 'sync_status',
    'preferred_supplier_id', 'auto_generate_po', 'last_po_date', 'category', 'user_id',
    'budget_item_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  suppliers: [
    'id', 'code', 'name', 'contact_person', 'phone', 'email', 'address',
    'city', 'payment_terms', 'notes', 'created_at', 'updated_at', 'sync_status',
    'categories', 'is_preferred', 'user_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  payroll_records: [
    'id', 'project_id', 'employee_id', 'period_start', 'period_end',
    'days_worked', 'overtime_hours', 'overtime_rate', 'bonuses', 'deductions',
    'base_salary', 'overtime_pay', 'gross_salary', 'igss_deduction',
    'aguinaldo_provision', 'vacaciones_provision', 'net_salary', 'created_at',
    'updated_at', 'sync_status', 'total_hours', 'hourly_rate', 'planned_hours',
    'budget_item_id', 'cost_overrun_amount', 'is_overrun_warning_fired', 'user_id',
    'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  project_logs: [
    'id', 'project_id', 'log_date', 'activity_type', 'description',
    'physical_progress', 'financial_progress', 'photos', 'created_by', 'created_at',
    'updated_at', 'sync_status', 'is_critical_roadblock', 'roadblock_category', 'severity', 'user_id',
    'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  budgets: [
    'id', 'project_id', 'version', 'direct_cost', 'indirect_percentage',
    'contingency_percentage', 'profit_percentage', 'total_amount', 'duration_days',
    'created_at', 'updated_at', 'sync_status', 'user_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  budget_items: [
    'id', 'budget_id', 'project_id', 'parent_id', 'code', 'description',
    'unit', 'quantity', 'unit_cost', 'total_cost', 'item_order', 'created_at',
    'updated_at', 'sync_status', 'actual_consumption', 'consumption_variance',
    'length_m', 'width_m', 'depth_m', 'height_m', 'slab_type', 'category',
    'unidades_comerciales_estimadas', 'is_custom', 'user_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  financial_transactions: [
    'id', 'project_id', 'type', 'category', 'description', 'quantity',
    'unit', 'unit_cost', 'total_cost', 'date', 'receipt_url', 'created_at',
    'updated_at', 'sync_status', 'user_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  purchase_orders: [
    'id', 'code', 'supplier_id', 'project_id', 'order_date', 'expected_delivery_date',
    'status', 'total_amount', 'notes', 'created_at', 'updated_at', 'sync_status', 'user_id',
    'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  purchase_order_items: [
    'id', 'purchase_order_id', 'item_code', 'description', 'quantity',
    'unit', 'unit_price', 'total_price', 'received_quantity', 'created_at',
    'updated_at', 'sync_status', 'user_id', 'last_sync_attempt', 'sync_error', 'sync_attempts'
  ],
  payroll_employees: [
    'id', 'name', 'position', 'daily_rate', 'category', 'department',
    'hire_date', 'active', 'created_at', 'updated_at', 'sync_status', 'user_id',
    'last_sync_attempt', 'sync_error', 'sync_attempts'
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

    // No rows does not mean that the table is missing. PostgREST does not
    // expose column metadata here, so leave the columns unknown instead of
    // calling an undeployed RPC and reporting a false negative.
    return [];
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

  if (!supabase) {
    return {
      tableName,
      exists: false,
      columns: [],
      missingColumns: [],
      alignmentStatus: 'unknown'
    };
  }

  const existenceProbe = await supabase.from(tableName).select('*', { count: 'exact', head: true });
  if (existenceProbe.error) {
    const missing = /does not exist|schema cache|relation .* not found/i.test(existenceProbe.error.message);
    return {
      tableName,
      exists: !missing,
      columns: [],
      missingColumns: [],
      alignmentStatus: missing ? 'misaligned' : 'unknown'
    };
  }

  const actualColumns = await getTableColumns(tableName);
  const exists = true;

  if (actualColumns.length === 0) {
    return {
      tableName,
      exists,
      columns: [],
      missingColumns: [],
      alignmentStatus: 'unknown'
    };
  }

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
  const unknownTables = tableValidations.filter(t => t.alignmentStatus === 'unknown').length;

  const recommendations: string[] = [];

  // Generate recommendations based on validation results
  tableValidations.forEach(validation => {
    if (validation.alignmentStatus === 'unknown') {
      recommendations.push(`No se pudo inspeccionar columnas de "${validation.tableName}" sin una fila visible; use una clave de servicio o information_schema.`);
    } else if (validation.alignmentStatus === 'misaligned') {
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
    unknownTables,
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
  output += `Misaligned: ${report.misalignedTables} ❌\n`;
  output += `Unknown: ${report.unknownTables} ⚠️\n\n`;

  output += `=== TABLE VALIDATIONS ===\n\n`;
  
  report.tableValidations.forEach(validation => {
    const statusIcon = validation.alignmentStatus === 'aligned' ? '✅' :
                      validation.alignmentStatus === 'partial' || validation.alignmentStatus === 'unknown' ? '⚠️' : '❌';
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
