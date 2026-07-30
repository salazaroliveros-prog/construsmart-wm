const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateSchema() {
  console.log('🔍 Validando esquema de base de datos remota...\n');

  const expectedSchema = {
    projects: {
      columns: ['id', 'code', 'name', 'client_name', 'client_phone', 'client_email', 'location', 'typology', 'area_m2', 'quality_level', 'status', 'start_date', 'estimated_end_date', 'duration_days', 'total_budget', 'sync_status', 'created_at', 'updated_at']
    },
    budgets: {
      columns: ['id', 'project_id', 'version', 'direct_cost', 'indirect_percentage', 'contingency_percentage', 'profit_percentage', 'total_amount', 'sync_status', 'created_at', 'updated_at']
    },
    budget_items: {
      columns: ['id', 'budget_id', 'parent_id', 'code', 'description', 'unit', 'quantity', 'unit_cost', 'total_cost', 'item_order', 'sync_status', 'created_at', 'updated_at']
    },
    budget_item_breakdowns: {
      columns: ['id', 'budget_item_id', 'resource_type', 'description', 'unit', 'quantity', 'unit_cost', 'total_cost', 'sync_status', 'created_at', 'updated_at']
    },
    financial_transactions: {
      columns: ['id', 'project_id', 'type', 'category', 'description', 'quantity', 'unit', 'unit_cost', 'total_cost', 'date', 'receipt_url', 'sync_status', 'created_at', 'updated_at']
    },
    payroll_employees: {
      columns: ['id', 'name', 'position', 'daily_rate', 'category', 'department', 'hire_date', 'active', 'sync_status', 'created_at', 'updated_at']
    },
    payroll_records: {
      columns: ['id', 'employee_id', 'period_start', 'period_end', 'days_worked', 'overtime_hours', 'overtime_rate', 'bonuses', 'deductions', 'base_salary', 'overtime_pay', 'gross_salary', 'igss_deduction', 'aguinaldo_provision', 'vacaciones_provision', 'net_salary', 'sync_status', 'created_at', 'updated_at']
    },
    warehouse_stock: {
      columns: ['id', 'item_code', 'description', 'unit', 'current_stock', 'minimum_threshold', 'unit_cost', 'sync_status', 'created_at', 'updated_at']
    }
  };

  let hasDifferences = false;

  for (const [tableName, expected] of Object.entries(expectedSchema)) {
    console.log(`📋 Verificando tabla: ${tableName}`);
    
    try {
      // Intentar consultar la tabla para verificar si existe y tiene la estructura correcta
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`  ❌ Error en tabla ${tableName}:`, error.message);
        hasDifferences = true;
      } else {
        // Si hay datos, verificar las columnas
        if (data && data.length > 0) {
          const actualColumns = Object.keys(data[0]);
          const missingColumns = expected.columns.filter(col => !actualColumns.includes(col));
          const extraColumns = actualColumns.filter(col => !expected.columns.includes(col));

          if (missingColumns.length > 0) {
            console.log(`  ⚠️  Columnas faltantes: ${missingColumns.join(', ')}`);
            hasDifferences = true;
          }

          if (extraColumns.length > 0) {
            console.log(`  ℹ️  Columnas adicionales: ${extraColumns.join(', ')}`);
          }

          if (missingColumns.length === 0 && extraColumns.length === 0) {
            console.log(`  ✅ Estructura correcta`);
          }
        } else {
          console.log(`  ✅ Tabla existe (sin datos)`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Error crítico en ${tableName}:`, err.message);
      hasDifferences = true;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (hasDifferences) {
    console.log('⚠️  Se detectaron diferencias en el esquema');
    console.log('📝 Se recomienda ejecutar las migraciones de corrección');
  } else {
    console.log('✅ El esquema coincide con las migraciones esperadas');
  }
  console.log('='.repeat(50));

  process.exit(hasDifferences ? 1 : 0);
}

validateSchema().catch(err => {
  console.error('Error en validación:', err);
  process.exit(1);
});