/**
 * SUPABASE CRUD TEST WITH SERVICE ROLE KEY
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Script simplificado para probar CRUD real usando service role key
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env');
  process.exit(1);
}

console.log('=== SUPABASE CRUD TEST WITH SERVICE ROLE KEY ===');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
console.log('⚠️ Using service role key - admin permissions (for testing only)');

async function testCRUDWithServiceKey() {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('\n1. Testing connection with service role key...');
    
    // Test connection
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Connection failed:', projectsError);
      return false;
    }
    
    console.log('✅ Connection successful with service role key!');
    console.log('Projects count:', projectsData);
    
    // Test CRUD operations with suppliers table (simpler constraints)
    console.log('\n2. Testing CRUD operations with suppliers table...');
    
    // CREATE
    const testSupplier = {
      code: 'TEST_SUP_' + Date.now(),
      name: 'Test Supplier',
      contact_person: 'Test Contact',
      phone: '1234567890',
      email: 'test@example.com',
      address: 'Test Address',
      city: 'Test City',
      payment_terms: '30 days',
      notes: 'Test supplier',
      sync_status: 'synced',
      last_sync_attempt: null,
      sync_error: null,
      sync_attempts: null
    };
    
    const { data: createdData, error: createError } = await supabase
      .from('suppliers')
      .insert([testSupplier])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ CREATE failed:', createError);
      return false;
    }
    
    console.log('✅ CREATE successful:', createdData.id);
    console.log('   Created supplier:', createdData.name);
    
    // READ
    const { data: readData, error: readError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', createdData.id)
      .single();
    
    if (readError) {
      console.error('❌ READ failed:', readError);
      return false;
    }
    
    console.log('✅ READ successful:', readData.name);
    console.log('   All fields present:', Object.keys(readData).join(', '));
    
    // Test that all sync fields are present
    const requiredSyncFields = ['sync_status', 'last_sync_attempt', 'sync_error', 'sync_attempts'];
    const missingFields = requiredSyncFields.filter(field => !(field in readData));
    
    if (missingFields.length > 0) {
      console.error('❌ Missing sync fields:', missingFields);
      return false;
    }
    
    console.log('✅ All sync fields present in remote data');
    
    // UPDATE
    const { data: updateData, error: updateError } = await supabase
      .from('suppliers')
      .update({ name: 'Updated Test Supplier' })
      .eq('id', createdData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ UPDATE failed:', updateError);
      return false;
    }
    
    console.log('✅ UPDATE successful:', updateData.name);
    
    // DELETE
    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', createdData.id);
    
    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError);
      return false;
    }
    
    console.log('✅ DELETE successful');
    
    console.log('\n=== CRUD TEST WITH SERVICE ROLE KEY COMPLETED ===');
    return true;
    
  } catch (error) {
    console.error('❌ CRUD test failed:', error);
    return false;
  }
}

// Run the test
testCRUDWithServiceKey().then(success => {
  process.exit(success ? 0 : 1);
});