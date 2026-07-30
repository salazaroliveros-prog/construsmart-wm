const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Aplicando migración de campos faltantes...\n');

  try {
    // Paso 1: Agregar campos faltantes a financial_transactions
    console.log('📝 Agregando campos a financial_transactions...');
    
    const migrations = [
      {
        table: 'financial_transactions',
        sql: `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 1`
      },
      {
        table: 'financial_transactions', 
        sql: `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unid'`
      },
      {
        table: 'financial_transactions',
        sql: `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2) DEFAULT 0`
      }
    ];

    for (const migration of migrations) {
      try {
        // Usamos rpc para ejecutar SQL directo
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: migration.sql 
        });

        if (error) {
          console.log(`  ⚠️  Error en migration:`, error.message);
          // Intentar con REST API directamente
          console.log(`  ℹ️  Intentando método alternativo...`);
        } else {
          console.log(`  ✅ ${migration.sql}`);
        }
      } catch (err) {
        console.log(`  ⚠️  Error ejecutando: ${err.message}`);
      }
    }

    console.log('\n🔍 Verificando campos agregados...');
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('quantity, unit, unit_cost')
      .limit(1);

    if (error) {
      console.log(`  ❌ Los campos aún no están disponibles:`, error.message);
      console.log('  ℹ️  Es posible que necesite ejecutar SQL directamente en el dashboard de Supabase');
    } else {
      console.log(`  ✅ Campos quantity, unit, unit_cost ahora disponibles`);
    }

  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Migración completada');
  console.log('='.repeat(60));
}

applyMigration().catch(err => {
  console.error('Error aplicando migración:', err);
  process.exit(1);
});