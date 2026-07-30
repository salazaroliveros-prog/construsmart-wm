/**
 * CONSTRUCTORA WM/M&S - SUPABASE SCHEMA CHECK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Script simple para verificar el estado actual del esquema en Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yibjsruoxjlgdnkgylld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Verificando esquema actual de Supabase...');
  console.log('=========================================\n');

  // Tablas requeridas según el schema
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

  console.log('📊 Verificando tablas requeridas:\n');

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: NO EXISTE - ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTE`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ERROR - ${error}`);
    }
  }

  console.log('\n🔍 Verificando APU Library data:\n');
  
  try {
    const { data, error } = await supabase
      .from('apu_library')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ No se pudo consultar APU Library');
    } else {
      console.log(`✅ APU Library tiene ${data.length} items (mostrando primeros 5)`);
      if (data.length > 0) {
        data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.code} - ${item.description}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error consultando APU Library');
  }

  console.log('\n🔍 Verificando Projects:\n');
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ No se pudo consultar Projects');
    } else {
      console.log(`✅ Projects tiene ${data.length} registros`);
    }
  } catch (error) {
    console.log('❌ Error consultando Projects');
  }

  console.log('\n=========================================');
  console.log('✅ Verificación completada');
}

checkSchema().catch(console.error);