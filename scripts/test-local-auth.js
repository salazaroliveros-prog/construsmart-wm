/**
 * TEST AUTENTICACIÓN USANDO API LOCAL
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Script para probar autenticación usando la API local existente
 */

async function testLocalAuth() {
  console.log('=== LOCAL AUTHENTICATION TEST ===');
  
  try {
    // Intentar login con el usuario administrador
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'salazaroliveros@gmail.com',
        password: 'YOUR_PASSWORD_HERE' // Necesita la contraseña real
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return false;
    }
    
    console.log('✅ Login successful:', loginData.user.id);
    console.log('✅ Access token obtained:', loginData.session.access_token.substring(0, 20) + '...');
    
    // Usar el token para probar CRUD
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yibjsruoxjlgdnkgylld.supabase.co';
    
    const supabase = createClient(
      SUPABASE_URL,
      loginData.session.access_token,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    console.log('\n2. Testing CRUD with authenticated session...');
    
    // CREATE
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
      sync_status: 'synced',
      last_sync_attempt: null,
      sync_error: null,
      sync_attempts: null
    };
    
    const { data: createdData, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ CREATE failed:', createError);
      return false;
    }
    
    console.log('✅ CREATE successful:', createdData.id);
    
    // READ
    const { data: readData, error: readError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', createdData.id)
      .single();
    
    if (readError) {
      console.error('❌ READ failed:', readError);
      return false;
    }
    
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
      return false;
    }
    
    console.log('✅ UPDATE successful:', updateData.name);
    
    // DELETE
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', createdData.id);
    
    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError);
      return false;
    }
    
    console.log('✅ DELETE successful');
    
    console.log('\n=== AUTHENTICATED CRUD TEST COMPLETED ===');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Check if server is running
console.log('Checking if Next.js server is running...');
fetch('http://localhost:3000')
  .then(response => {
    if (response.ok) {
      console.log('✅ Server is running');
      testLocalAuth().then(success => {
        process.exit(success ? 0 : 1);
      });
    } else {
      console.error('❌ Server is not running or not accessible');
      console.log('Please start the server with: npm run dev');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Cannot connect to server:', error);
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  });