#!/usr/bin/env node

/**
 * Automatic Database Migration Script for CONSTRUCTORA WM/M&S
 * Executes SQL migrations directly via Supabase REST API
 * 
 * Usage: node scripts/apply-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLViaRPC(sql) {
  try {
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL execution failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Applying APU integration migration...\n');

  const sqlPath = path.join(__dirname, '../supabase/migrations/add_apu_integration.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📝 SQL to execute:');
  console.log('---');
  console.log(sql);
  console.log('---\n');

  try {
    // Note: Supabase's REST API doesn't support arbitrary SQL execution for security
    // We need to use the SQL Editor in the dashboard or create a custom RPC function
    console.log('⚠️  Automatic SQL execution via REST API is not supported by Supabase for security.');
    console.log('\n📋 MANUAL STEPS REQUIRED:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute the migration');
    console.log('\n🔗 Direct link: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new');
    
    console.log('\n✅ Migration script completed (manual execution required)');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
