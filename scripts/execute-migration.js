#!/usr/bin/env node

/**
 * Direct Migration Execution via Supabase REST API
 * Uses the connected project to execute SQL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = 'yibjsruoxjlgdnkgylld';

console.log('🚀 Executing APU integration migration...\n');

// Get the database connection string from Supabase
console.log('📋 Getting database connection string...');

try {
  // Try to get the connection string from Supabase CLI
  const connectionString = execSync('supabase status --db-url', { 
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
  
  console.log('✅ Connection string obtained from CLI\n');
  
  // Execute migration
  const sqlPath = path.join(__dirname, '../supabase/migrations/add_apu_integration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📝 Executing SQL:');
  console.log('---');
  console.log(sql);
  console.log('---\n');
  
  // Use psql with the connection string
  execSync(`psql "${connectionString}" -c "${sql.replace(/\n/g, ' ')}"`, {
    stdio: 'inherit'
  });
  
  console.log('\n✅ Migration completed successfully!');
  
  // Verify
  console.log('\n🔍 Verifying migration...');
  execSync('node scripts/sync-database.js', { stdio: 'inherit' });
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n📋 MANUAL MIGRATION REQUIRED:');
  console.log('Please run the SQL manually in Supabase SQL Editor');
  console.log('File: supabase/migrations/add_apu_integration.sql\n');
  
  const sqlPath = path.join(__dirname, '../supabase/migrations/add_apu_integration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('--- SQL START ---');
  console.log(sql);
  console.log('--- SQL END ---\n');
  
  process.exit(1);
}
