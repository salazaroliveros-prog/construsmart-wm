/**
 * SUPABASE CONNECTION TEST
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Script para probar conexión real con Supabase y verificar
 * que la comunicación bilateral funcione correctamente
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

console.log('=== SUPABASE CONNECTION TEST ===');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

async function testConnection() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Testing connection...');
    
    // Test connection by querying a simple table
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Connection failed:', projectsError);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('Projects count:', projectsData);
    
    // Test table structure
    console.log('\n2. Testing table structures...');
    
    const tables = [
      'projects',
      'budgets', 
      'budget_items',
      'financial_transactions',
      'warehouse_stock',
      'payroll_records',
      'payroll_employees',
      'clients',
      'project_logs',
      'suppliers',
      'purchase_orders',
      'purchase_order_items'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} error:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists, ${data.length} records`);
          if (data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.error(`❌ Table ${table} exception:`, err);
      }
    }
    
    // Test CRUD operations
    console.log('\n3. Testing CRUD operations...');
    
    // CREATE - Test with a simple record
    const testProject = {
      code: 'TEST_' + Date.now(),
      name: 'Test Project',
      client_name: 'Test Client',
      location: 'Test Location',
      typology: 'residential',
      area_m2: 100,
      quality_level: 'basic',
      status: 'planning',
      duration_days: 30,
      total_budget: 100000,
      sync_status: 'synced'
    };
    
    const { data: createdData, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ CREATE failed:', createError);
    } else {
      console.log('✅ CREATE successful:', createdData.id);
      
      // READ
      const { data: readData, error: readError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', createdData.id)
        .single();
      
      if (readError) {
        console.error('❌ READ failed:', readError);
      } else {
        console.log('✅ READ successful:', readData.name);
        
        // UPDATE
        const { data: updateData, error: updateError } = await supabase
          .from('projects')
          .update({ name: 'Updated Test Project' })
          .eq('id', createdData.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ UPDATE failed:', updateError);
        } else {
          console.log('✅ UPDATE successful:', updateData.name);
          
          // DELETE
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', createdData.id);
          
          if (deleteError) {
            console.error('❌ DELETE failed:', deleteError);
          } else {
            console.log('✅ DELETE successful');
          }
        }
      }
    }
    
    console.log('\n=== CONNECTION TEST COMPLETED ===');
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});