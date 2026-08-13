/**
 * AUTHENTICATED SUPABASE CRUD TEST
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Script para probar CRUD real con autenticación
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from .env
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yibjsruoxjlgdnkgylld.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri';

console.log('=== AUTHENTICATED SUPABASE CRUD TEST ===');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

async function testAuthenticatedCRUD() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Testing authenticated signup...');
    
    // Create a test user
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError);
      return false;
    }
    
    console.log('✅ Sign up successful:', signUpData.user?.id);
    
    // Wait for email confirmation (or disable it for testing)
    if (!signUpData.session) {
      console.log('⚠️ Email confirmation required. Trying sign in with existing user...');
      
      // Try to sign in with admin user from .env
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'salazaroliveros@gmail.com',
        password: 'your_password_here' // This needs to be provided
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError);
        console.log('⚠️ You need to provide actual credentials or disable email confirmation');
        return false;
      }
      
      console.log('✅ Sign in successful:', signInData.user?.id);
    }
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No active session:', sessionError);
      return false;
    }
    
    console.log('✅ Active session:', session.user.id);
    
    // Test CRUD operations with authentication
    console.log('\n2. Testing authenticated CRUD operations...');
    
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
    console.error('❌ Authenticated CRUD test failed:', error);
    return false;
  }
}

// Run the test
testAuthenticatedCRUD().then(success => {
  process.exit(success ? 0 : 1);
});