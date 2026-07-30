const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetailedSchema() {
  console.log('🔍 Análisis detallado del esquema de base de datos...\n');

  // Verificar estructura específica de financial_transactions para las categorías
  console.log('📊 Verificando tabla financial_transactions (categorías):');
  
  try {
    // Intentar insertar un registro de prueba con las categorías correctas
    const testCategories = [
      'materiales', 'mano_de_obra', 'herramienta', 'sub_contrato',
      'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'
    ];

    for (const category of testCategories) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('category')
        .eq('category', category)
        .limit(1);

      if (error && error.message.includes('check constraint')) {
        console.log(`  ❌ Categoría '${category}' no válida en la base de datos`);
      } else if (error) {
        console.log(`  ⚠️  Error verificando categoría '${category}':`, error.message);
      } else {
        console.log(`  ✅ Categoría '${category}' válida`);
      }
    }
  } catch (err) {
    console.error('  ❌ Error verificando categorías:', err.message);
  }

  // Verificar estructura de budgets para los campos renombrados
  console.log('\n📊 Verificando tabla budgets (campos renombrados):');
  
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('direct_cost, indirect_percentage, contingency_percentage, profit_percentage, total_amount')
      .limit(1);

    if (error) {
      console.log(`  ❌ Error verificando campos de budgets:`, error.message);
      console.log('  ℹ️  Esto indica que la migración de correcciones no se ha ejecutado');
    } else {
      console.log(`  ✅ Campos renombrados correctamente (direct_cost, indirect_percentage, etc.)`);
    }
  } catch (err) {
    console.error('  ❌ Error verificando budgets:', err.message);
  }

  // Verificar estructura de budget_items para unit_cost y total_cost
  console.log('\n📊 Verificando tabla budget_items (unit_cost, total_cost):');
  
  try {
    const { data, error } = await supabase
      .from('budget_items')
      .select('unit_cost, total_cost')
      .limit(1);

    if (error) {
      console.log(`  ❌ Error verificando campos de budget_items:`, error.message);
    } else {
      console.log(`  ✅ campos unit_cost y total_cost presentes`);
    }
  } catch (err) {
    console.error('  ❌ Error verificando budget_items:', err.message);
  }

  // Verificar estructura de financial_transactions para quantity, unit, unit_cost
  console.log('\n📊 Verificando tabla financial_transactions (quantity, unit, unit_cost):');
  
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('quantity, unit, unit_cost')
      .limit(1);

    if (error) {
      console.log(`  ❌ Error verificando campos adicionales de financial_transactions:`, error.message);
      console.log('  ℹ️  Estos campos son necesarios para el código actual');
    } else {
      console.log(`  ✅ Campos quantity, unit, unit_cost presentes`);
    }
  } catch (err) {
    console.error('  ❌ Error verificando financial_transactions:', err.message);
  }

  // Verificar estructura de budget_item_breakdowns para incluir 'subcontract'
  console.log('\n📊 Verificando tabla budget_item_breakdowns (resource_type con subcontract):');
  
  try {
    // Intentar insertar con resource_type = 'subcontract'
    const { data, error } = await supabase
      .from('budget_item_breakdowns')
      .select('resource_type')
      .eq('resource_type', 'subcontract')
      .limit(1);

    if (error && error.message.includes('check constraint')) {
      console.log(`  ❌ resource_type 'subcontract' no válido (solo acepta material, labor, equipment)`);
      console.log('  ℹ️  Se necesita agregar subcontract a los valores permitidos');
    } else if (error) {
      console.log(`  ⚠️  Error verificando resource_type:`, error.message);
    } else {
      console.log(`  ✅ resource_type 'subcontract' válido o tabla vacía`);
    }
  } catch (err) {
    console.error('  ❌ Error verificando budget_item_breakdowns:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Análisis completado. Revisa los resultados arriba.');
  console.log('='.repeat(60));
}

checkDetailedSchema().catch(err => {
  console.error('Error en análisis detallado:', err);
  process.exit(1);
});