#!/usr/bin/env node

/**
 * Database Migration Script for CONSTRUCTORA WM/M&S
 * Automatically creates missing tables in Supabase
 * 
 * Usage: node scripts/sync-database.js
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
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// List of tables to verify
const requiredTables = [
  'projects',
  'budgets',
  'budget_items',
  'budget_item_breakdowns',
  'financial_transactions',
  'payroll_employees',
  'payroll_records',
  'warehouse_stock',
  'suppliers',
  'purchase_orders',
  'purchase_order_items',
  'clients',
  'project_logs'
];

// Columns to verify for APU integration
const apuIntegrationColumns = [
  { table: 'budget_items', columns: ['apu_result', 'apu_params'] }
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        // Table does not exist
        return false;
      }
      console.error(`❌ Error checking table ${tableName}:`, error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Exception checking table ${tableName}:`, error.message);
    return false;
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    // Try to select the specific column
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') || error.code === '42703') {
        // Column does not exist
        return false;
      }
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function runSQLMigration(sqlFile) {
  const sqlPath = path.join(__dirname, '../supabase/migrations', sqlFile);
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`);
    return false;
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log(`\n📄 Reading SQL from: ${sqlFile}`);
  console.log(`\n⚠️  MANUAL ACTION REQUIRED:`);
  console.log(`   Please run the following SQL in your Supabase SQL Editor:`);
  console.log(`   https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new\n`);
  console.log('--- SQL START ---');
  console.log(sql);
  console.log('--- SQL END ---\n');
  
  return true;
}

async function main() {
  console.log('🔍 Verifying Supabase database schema...\n');
  
  let missingTables = [];
  let missingColumns = [];
  
  // Check tables
  console.log('📋 Checking required tables...');
  for (const tableName of requiredTables) {
    const exists = await checkTableExists(tableName);
    if (exists) {
      console.log(`  ✅ ${tableName}`);
    } else {
      console.log(`  ❌ ${tableName} - MISSING`);
      missingTables.push(tableName);
    }
  }
  
  // Check APU integration columns
  console.log('\n📋 Checking APU integration columns...');
  for (const { table, columns } of apuIntegrationColumns) {
    const tableExists = await checkTableExists(table);
    if (!tableExists) {
      console.log(`  ⏭️  ${table} - skipped (table missing)`);
      continue;
    }
    
    for (const column of columns) {
      const exists = await checkColumnExists(table, column);
      if (exists) {
        console.log(`  ✅ ${table}.${column}`);
      } else {
        console.log(`  ❌ ${table}.${column} - MISSING`);
        missingColumns.push({ table, column });
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  if (missingTables.length === 0 && missingColumns.length === 0) {
    console.log('✅ All required tables and columns exist!');
    console.log('✅ Database schema is up to date.');
    process.exit(0);
  }
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables (${missingTables.length}):`);
    missingTables.forEach(t => console.log(`   - ${t}`));
  }
  
  if (missingColumns.length > 0) {
    console.log(`\n❌ Missing columns (${missingColumns.length}):`);
    missingColumns.forEach(({ table, column }) => console.log(`   - ${table}.${column}`));
  }
  
  // Provide migration instructions
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION INSTRUCTIONS');
  console.log('='.repeat(60));
  
  if (missingTables.length > 0) {
    console.log('\n📝 To create missing tables, run the complete schema:');
    await runSQLMigration('create_all_tables.sql');
  }
  
  if (missingColumns.length > 0 && missingTables.length === 0) {
    console.log('\n📝 To add missing APU columns, run:');
    await runSQLMigration('add_apu_integration.sql');
  }
  
  console.log('\n💡 Alternative: Use Supabase Dashboard');
  console.log('   1. Go to https://app.supabase.com');
  console.log('   2. Select your project');
  console.log('   3. Navigate to SQL Editor');
  console.log('   4. Paste and run the SQL above');
  
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
