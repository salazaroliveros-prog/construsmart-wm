/**
 * CONSTRUCTORA WM/M&S - SUPABASE SCHEMA VALIDATION
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Script para validar el esquema actual de Supabase y ejecutar migraciones si es necesario
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface SchemaValidationResult {
  valid: boolean;
  missingEnums: string[];
  missingTables: string[];
  missingTriggers: string[];
  missingRLS: string[];
  errors: string[];
}

async function validateSchema(): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    valid: true,
    missingEnums: [],
    missingTables: [],
    missingTriggers: [],
    missingRLS: [],
    errors: [],
  };

  try {
    console.log('🔍 Validando esquema de Supabase...');

    // Validar ENUMs requeridos
    const requiredEnums = [
      'user_role',
      'project_status', 
      'project_typology',
      'expense_category'
    ];

    for (const enumName of requiredEnums) {
      const { data, error } = await supabase
        .rpc('check_enum_exists', { enum_name: enumName });
      
      if (error || !data) {
        result.missingEnums.push(enumName);
        result.valid = false;
      }
    }

    // Validar tablas requeridas
    const requiredTables = [
      'profiles',
      'projects',
      'apu_library',
      'budgets',
      'budget_items',
      'budget_item_breakdown',
      'financial_transactions',
      'payroll_records',
      'warehouse_stock'
    ];

    for (const tableName of requiredTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        result.missingTables.push(tableName);
        result.valid = false;
      }
    }

    // Validar triggers
    const requiredTriggers = [
      'budget_items_total_trigger',
      'on_auth_user_created'
    ];

    for (const triggerName of requiredTriggers) {
      const { data, error } = await supabase
        .rpc('check_trigger_exists', { trigger_name: triggerName });
      
      if (error || !data) {
        result.missingTriggers.push(triggerName);
        result.valid = false;
      }
    }

    // Validar RLS policies
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('check_rls_enabled');

    if (rlsError || !rlsEnabled) {
      result.missingRLS.push('RLS not enabled on tables');
      result.valid = false;
    }

    return result;
  } catch (error) {
    result.errors.push(`Validation error: ${error}`);
    result.valid = false;
    return result;
  }
}

async function executeMigration(): Promise<boolean> {
  try {
    console.log('🚀 Ejecutando migración del esquema...');
    
    // Leer el archivo de migración
    const migrationSQL = await fetch('/supabase/migrations/001_initial_schema.sql')
      .then(res => res.text());

    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      return false;
    }

    console.log('✅ Migración ejecutada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en proceso de migración:', error);
    return false;
  }
}

async function main() {
  console.log('🏗️ CONSTRUCTORA WM/M&S - Supabase Schema Validator');
  console.log('================================================');

  const validation = await validateSchema();

  if (validation.valid) {
    console.log('✅ El esquema de Supabase está completo y válido');
    console.log('   - Todos los ENUMs están presentes');
    console.log('   - Todas las tablas están creadas');
    console.log('   - Triggers están activos');
    console.log('   - RLS policies están configuradas');
  } else {
    console.log('❌ El esquema de Supabase necesita correcciones:');
    
    if (validation.missingEnums.length > 0) {
      console.log(`   - ENUMs faltantes: ${validation.missingEnums.join(', ')}`);
    }
    if (validation.missingTables.length > 0) {
      console.log(`   - Tablas faltantes: ${validation.missingTables.join(', ')}`);
    }
    if (validation.missingTriggers.length > 0) {
      console.log(`   - Triggers faltantes: ${validation.missingTriggers.join(', ')}`);
    }
    if (validation.missingRLS.length > 0) {
      console.log(`   - RLS issues: ${validation.missingRLS.join(', ')}`);
    }
    if (validation.errors.length > 0) {
      console.log(`   - Errores: ${validation.errors.join(', ')}`);
    }

    console.log('\n🔄 Ejecutando migración para corregir el esquema...');
    const migrationSuccess = await executeMigration();
    
    if (migrationSuccess) {
      console.log('✅ Migración completada. Validando nuevamente...');
      const revalidation = await validateSchema();
      
      if (revalidation.valid) {
        console.log('✅ Esquema corregido exitosamente');
      } else {
        console.log('⚠️ Esquema aún necesita atención manual');
      }
    }
  }

  console.log('\n📊 Estado final de validación:');
  console.log(`   - Válido: ${validation.valid ? 'Sí' : 'No'}`);
  console.log(`   - ENUMs faltantes: ${validation.missingEnums.length}`);
  console.log(`   - Tablas faltantes: ${validation.missingTables.length}`);
  console.log(`   - Triggers faltantes: ${validation.missingTriggers.length}`);
  console.log(`   - RLS issues: ${validation.missingRLS.length}`);
}

main().catch(console.error);