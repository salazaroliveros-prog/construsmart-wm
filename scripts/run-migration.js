#!/usr/bin/env node

/**
 * Migration Runner for CONSTRUCTORA WM/M&S
 * Attempts to run migration via Supabase CLI, provides manual instructions if not available
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 Running database migration for APU integration...\n');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI found\n');
  
  // Try to execute migration
  try {
    console.log('📝 Executing migration via Supabase CLI...');
    const sqlPath = path.join(__dirname, '../supabase/migrations/add_apu_integration.sql');
    
    // Use psql directly if available, or provide instructions
    execSync(`psql "${supabaseUrl}" -f "${sqlPath}"`, { stdio: 'inherit' });
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.log('\n⚠️  Could not execute via psql');
    console.log('Please run the SQL manually in Supabase SQL Editor\n');
    showManualInstructions();
  }
} catch (error) {
  console.log('❌ Supabase CLI not found');
  console.log('Please install it: npm install -g supabase\n');
  showManualInstructions();
}

function showManualInstructions() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/add_apu_integration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📋 MANUAL MIGRATION STEPS:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Copy and paste the SQL below:');
  console.log('\n--- SQL START ---');
  console.log(sql);
  console.log('--- SQL END ---\n');
  console.log('5. Click "Run" to execute');
  console.log('6. Verify with: node scripts/sync-database.js\n');
}
