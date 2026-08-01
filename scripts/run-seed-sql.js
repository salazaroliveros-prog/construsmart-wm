#!/usr/bin/env node
/**
 * Execute seed SQL on remote Supabase database via REST API
 * 
 * Reads scripts/seed-test-data.sql and executes it in chunks
 */

require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const fs = require('fs');

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Read SQL file
const sql = fs.readFileSync('scripts/seed-test-data.sql', 'utf8');

// Split by semicolons to get individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

console.log(`\n🚀 Executing ${statements.length} SQL statements...\n`);

async function executeSQL() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql: stmt + ';' })
      });

      if (response.ok) {
        console.log(`✅ [${i + 1}/${statements.length}] ${stmt.substring(0, 50)}...`);
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ [${i + 1}/${statements.length}] ${error.message}`);
    }
  }

  console.log('\n✅ SQL execution completed!');
  console.log('\n📊 Verifying data...');
  
  // Verify counts
  const tables = ['clients', 'projects', 'budgets', 'budget_items', 'financial_transactions', 
                  'payroll_employees', 'payroll_records', 'warehouse_stock', 
                  'suppliers', 'purchase_orders', 'project_logs'];
  
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        },
      });
      const text = await res.text();
      console.log(`  ${table}: ${text}`);
    } catch (error) {
      console.log(`  ${table}: error reading`);
    }
  }
}

executeSQL().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});