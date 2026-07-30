const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  console.log('🔄 Intentando ejecutar migración automáticamente...\n');

  try {
    // Método 1: Intentar usar REST API para ALTER TABLE
    console.log('📝 Método 1: Intentando ALTER TABLE vía REST API...');
    
    // Primero verificamos si podemos hacer una operación simple
    const { data: testData, error: testError } = await supabase
      .from('financial_transactions')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('  ❌ Error de conexión:', testError.message);
      return false;
    }

    console.log('  ✅ Conexión exitosa');

    // Método 2: Intentar insertar un registro con los nuevos campos
    // Si los campos no existen, esto fallará y sabremos que necesitamos la migración
    console.log('\n📝 Método 2: Verificando si los campos ya existen...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('financial_transactions')
      .insert({
        type: 'expense',
        category: 'materiales',
        description: 'Test migration',
        quantity: 1,
        unit: 'unid',
        unit_cost: 0,
        total_cost: 0,
        date: new Date().toISOString().split('T')[0]
      })
      .select();

    if (insertError) {
      if (insertError.message.includes('column') || insertError.message.includes('does not exist')) {
        console.log('  ⚠️  Campos no existen, se requiere migración');
        console.log('  ℹ️  La API REST no permite ALTER TABLE directamente');
        console.log('  📝 Se requiere ejecución manual en SQL Editor de Supabase');
        return false;
      } else {
        console.log('  ❌ Error inesperado:', insertError.message);
        return false;
      }
    } else {
      console.log('  ✅ Campos ya existen o se agregaron automáticamente');
      
      // Limpiar el registro de prueba
      if (insertData && insertData.length > 0) {
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', insertData[0].id);
        console.log('  🧹 Registro de prueba eliminado');
      }
      return true;
    }

  } catch (err) {
    console.error('❌ Error en migración automática:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Validando si se requiere migración...\n');
  
  // Primero verificar el estado actual
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('quantity, unit, unit_cost')
    .limit(1);

  if (error) {
    if (error.message.includes('column') || error.message.includes('does not exist')) {
      console.log('⚠️  Campos faltantes detectados');
      console.log('🔄 Intentando migración automática...\n');
      
      const success = await executeMigration();
      
      if (!success) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ Migración automática no disponible');
        console.log('📝 Se requiere ejecución manual en SQL Editor de Supabase');
        console.log('='.repeat(60));
        console.log('\nSQL a ejecutar:');
        console.log(`
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unid',
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2) DEFAULT 0;
        `);
        process.exit(1);
      }
    } else {
      console.log('❌ Error verificando esquema:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Campos ya existen en la base de datos');
    console.log('🎉 No se requiere migración');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});