#!/usr/bin/env node
/**
 * Remote Supabase Database Schema Verification Script
 *
 * Verifies that the remote Supabase database has all required tables, columns,
 * indexes, and RLS policies for the Constructora WM/M&S application.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres:password@host:6543/postgres" node scripts/verify-remote-db.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const REQUIRED_TABLES = [
  'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
  'financial_transactions', 'payroll_employees', 'payroll_records',
  'warehouse_stock', 'clients', 'project_logs', 'suppliers',
  'purchase_orders', 'purchase_order_items'
];

const REQUIRED_COLUMNS = {
  projects: ['id','code','name','client_name','client_phone','client_email','location','typology','area_m2','quality_level','status','start_date','estimated_end_date','duration_days','total_budget','budget_total','calculated_duration','sync_status','created_at','updated_at'],
  budgets: ['id','project_id','version','direct_cost','indirect_percentage','contingency_percentage','profit_percentage','total_amount','duration_days','sync_status','created_at','updated_at'],
  budget_items: ['id','budget_id','parent_id','code','description','unit','quantity','unit_cost','total_cost','item_order','is_custom','length_m','width_m','depth_m','height_m','slab_type','apu_result','apu_params','sync_status','created_at','updated_at'],
  budget_item_breakdowns: ['id','budget_item_id','resource_type','code','description','unit','quantity_unitary','total_quantity','unit_price','waste_percentage','unit_cost','total_cost','sync_status','created_at','updated_at'],
  financial_transactions: ['id','project_id','type','category','description','quantity','unit','unit_cost','total_cost','date','receipt_url','sync_status','created_at','updated_at'],
  payroll_employees: ['id','name','position','daily_rate','category','department','hire_date','active','sync_status','created_at','updated_at'],
  payroll_records: ['id','employee_id','project_id','period_start','period_end','days_worked','overtime_hours','overtime_rate','bonuses','deductions','base_salary','overtime_pay','gross_salary','igss_deduction','aguinaldo_provision','vacaciones_provision','net_salary','sync_status','created_at','updated_at'],
  warehouse_stock: ['id','project_id','item_code','description','unit','current_stock','minimum_threshold','unit_cost','sync_status','created_at','updated_at'],
  clients: ['id','code','name','company_name','phone','email','address','city','client_type','tax_id','notes','sync_status','created_at','updated_at'],
  project_logs: ['id','project_id','activity_type','description','physical_progress','financial_progress','log_date','created_by','notes','photos','sync_status','created_at','updated_at'],
  suppliers: ['id','code','name','contact_person','phone','email','address','city','payment_terms','notes','sync_status','created_at','updated_at'],
  purchase_orders: ['id','code','supplier_id','project_id','order_date','expected_delivery_date','status','total_amount','notes','sync_status','created_at','updated_at'],
  purchase_order_items: ['id','purchase_order_id','item_code','description','quantity','unit','unit_price','total_price','received_quantity','notes','sync_status','created_at','updated_at']
};

const RECOMMENDED_INDEXES = {
  projects: ['idx_projects_status', 'idx_projects_typology'],
  budgets: ['idx_budgets_project_id'],
  budget_items: ['idx_budget_items_budget_id', 'idx_budget_items_parent_id'],
  budget_item_breakdowns: ['idx_budget_item_breakdowns_item_id'],
  financial_transactions: ['idx_financial_transactions_project_id', 'idx_financial_transactions_date', 'idx_financial_transactions_type'],
  payroll_records: ['idx_payroll_records_employee_id', 'idx_payroll_records_period', 'idx_payroll_records_project_id'],
  warehouse_stock: ['idx_warehouse_stock_project'],
  clients: ['idx_clients_code', 'idx_clients_name'],
  project_logs: ['idx_project_logs_project_id', 'idx_project_logs_activity_type', 'idx_project_logs_log_date'],
  suppliers: ['idx_suppliers_code', 'idx_suppliers_name'],
  purchase_orders: ['idx_purchase_orders_code', 'idx_purchase_orders_supplier_id', 'idx_purchase_orders_project_id', 'idx_purchase_orders_status', 'idx_purchase_orders_order_date'],
  purchase_order_items: ['idx_purchase_order_items_purchase_order_id', 'idx_purchase_order_items_item_code']
};

function getConnectionString() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) return envUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!password) {
    throw new Error(
      'DATABASE_URL or SUPABASE_DB_PASSWORD must be set.\n' +
      'Example: DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:6543/postgres"'
    );
  }

  const urlMatch = supabaseUrl.match(/https:\/\/([^/]+)/);
  const host = urlMatch ? `db.${urlMatch[1]}` : '';
  return `postgresql://postgres:${encodeURIComponent(password)}@${host}:6543/postgres`;
}

async function connect() {
  const client = new Client({ connectionString: getConnectionString() });
  await client.connect();
  return client;
}

async function verifyTables(client) {
  const results = [];

  for (const table of REQUIRED_TABLES) {
    const exists = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
      [table]
    );

    if (!exists.rows[0].exists) {
      results.push({ passed: false, message: `❌ Table "${table}" does not exist` });
      continue;
    }

    results.push({ passed: true, message: `✅ Table "${table}" exists` });

    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY column_name`,
      [table]
    );
    const colNames = new Set(cols.rows.map(r => r.column_name));
    const requiredCols = REQUIRED_COLUMNS[table] || [];
    const missing = requiredCols.filter(c => !colNames.has(c));

    if (missing.length > 0) {
      results.push({ passed: false, message: `  ❌ Missing columns: ${missing.join(', ')}` });
    } else {
      results.push({ passed: true, message: `  ✅ All ${requiredCols.length} required columns present` });
    }

    if (RECOMMENDED_INDEXES[table]) {
      const idx = await client.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1`,
        [table]
      );
      const idxNames = new Set(idx.rows.map(r => r.indexname));
      const missingIdx = RECOMMENDED_INDEXES[table].filter(i => !idxNames.has(i));

      if (missingIdx.length > 0) {
        results.push({ passed: false, message: `  ⚠️  Missing indexes: ${missingIdx.join(', ')}` });
      } else {
        results.push({ passed: true, message: `  ✅ All recommended indexes present` });
      }
    }

    const rls = await client.query(`SELECT relrowsecurity FROM pg_class WHERE relname = $1`, [table]);
    if (!rls.rows[0]?.relrowsecurity) {
      results.push({ passed: false, message: `  ❌ RLS not enabled on "${table}"` });
    } else {
      results.push({ passed: true, message: `  ✅ RLS enabled` });
    }
  }

  return results;
}

async function verifyRealtime(client) {
  const results = [];
  const tables = REQUIRED_TABLES;

  const pub = await client.query(`SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`);
  const pubTables = new Set(pub.rows.map(r => r.tablename));
  const missing = tables.filter(t => !pubTables.has(t));

  if (missing.length > 0) {
    results.push({ passed: false, message: `❌ Realtime missing for: ${missing.join(', ')}` });
  } else {
    results.push({ passed: true, message: `✅ Realtime enabled for all ${tables.length} tables` });
  }

  return results;
}

async function verifyTriggers(client) {
  const results = [];
  const tables = REQUIRED_TABLES;

  const triggers = await client.query(
    `SELECT tgname, tgrelid::regclass AS table_name FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relname = ANY($1))`,
    [tables]
  );
  const tablesWithTriggers = new Set(triggers.rows.map(r => r.table_name));

  for (const table of tables) {
    if (!tablesWithTriggers.has(table)) {
      results.push({ passed: false, message: `⚠️  No updated_at trigger on "${table}"` });
    } else {
      results.push({ passed: true, message: `✅ updated_at trigger on "${table}"` });
    }
  }

  return results;
}

async function verifyRlsPolicies(client) {
  const results = [];
  const tables = REQUIRED_TABLES;

  for (const table of tables) {
    const policies = await client.query(
      `SELECT policyname, roles FROM pg_policies WHERE tablename = $1`,
      [table]
    );

    const hasAllAccessForAnon = policies.rows.some(
      p => /FOR ALL/.test(p.policyname) && p.roles.includes('anon')
    );

    if (!hasAllAccessForAnon) {
      results.push({ passed: false, message: `⚠️  No all-access policy for anon on "${table}"` });
    } else {
      results.push({ passed: true, message: `✅ Anon all-access policy on "${table}"` });
    }
  }

  return results;
}

async function main() {
  console.log('\n🔍 Verifying Remote Supabase Database Schema\n');
  console.log('='.repeat(60));

  let client = null;

  try {
    client = await connect();
    console.log('✅ Connected to remote database\n');

    const tableResults = await verifyTables(client);
    console.log('📋 Checking Tables and Columns...');
    tableResults.forEach(r => console.log(r.message));

    const realtimeResults = await verifyRealtime(client);
    console.log('\n📡 Checking Realtime Configuration...');
    realtimeResults.forEach(r => console.log(r.message));

    const triggerResults = await verifyTriggers(client);
    console.log('\n⚡ Checking Triggers...');
    triggerResults.forEach(r => console.log(r.message));

    const rlsResults = await verifyRlsPolicies(client);
    console.log('\n🔒 Checking RLS Policies...');
    rlsResults.forEach(r => console.log(r.message));

    console.log('\n' + '='.repeat(60));
    const all = [...tableResults, ...realtimeResults, ...triggerResults, ...rlsResults];
    const passed = all.filter(r => r.passed).length;
    const failed = all.filter(r => !r.passed).length;

    console.log(`\n📊 Summary: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      console.log('\n⚠️  Some checks failed. Review issues above.');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed! Remote database is properly configured.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('password') || error.message.includes('ECONNREFUSED') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Tip: Set the database connection via environment variable:');
      console.error('   export DATABASE_URL="postgresql://postgres:password@host:port/postgres"');
    }
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

main();
