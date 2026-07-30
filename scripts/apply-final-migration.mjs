import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sql = readFileSync('supabase/migrations/20240730000003_final_schema_align.sql', 'utf8');

// Split into individual statements
const statements = sql
  .replace(/--.*$/gm, '')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => s + ';');

async function applyMigration() {
  console.log(`Applying migration (${statements.length} statements)...\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try direct SQL execution via mgmt API
  const mgmtToken = process.env.SUPABASE_MGMT_TOKEN;
  
  if (mgmtToken) {
    // Use Management API
    const url = `https://api.supabase.com/v1/projects/yibjsruoxjlgdnkgylld/database/query`;
    for (const stmt of statements) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${mgmtToken}`,
            'X-Supabase-Client': 'cli'
          },
          body: JSON.stringify({ query: stmt })
        });
        const text = await resp.text();
        if (resp.ok) {
          console.log(`✅ ${stmt.substring(0, 70)}...`);
        } else {
          // Many ALTER TABLE IF EXISTS will error - that's ok
          if (text.includes('already exists') || text.includes('does not exist')) {
            console.log(`⚠️  ${stmt.substring(0, 70)}... (skipped - ${text.substring(0, 50)})`);
          } else {
            console.log(`❌ ${stmt.substring(0, 70)}... ${text.substring(0, 80)}`);
          }
        }
      } catch (e) {
        console.log(`❌ ${stmt.substring(0, 70)}... ${e.message.substring(0, 80)}`);
      }
    }
  } else {
    console.log('No SUPABASE_MGMT_TOKEN found. Migration SQL file created at:');
    console.log('  supabase/migrations/20240730000003_final_schema_align.sql');
    console.log('\nTo apply, execute in Supabase SQL Editor:');
    console.log('  1. Go to https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/sql');
    console.log('  2. Open the file contents and execute');
    console.log('  3. Or use: supabase db push (requires SUPABASE_DB_PASSWORD)');
  }
}

applyMigration();
