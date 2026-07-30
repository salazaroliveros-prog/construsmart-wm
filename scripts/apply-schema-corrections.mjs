import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const corrections = [
  '-- CORREGIR CATEGORIAS EN financial_transactions --',
  `ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;`,
  `ALTER TABLE financial_transactions ADD CONSTRAINT financial_transactions_category_check CHECK (category IN ('materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'));`,

  '-- RENOMBRAR COLUMNAS EN budgets --',
  `ALTER TABLE budgets RENAME COLUMN IF EXISTS base_budget TO direct_cost;`,
  `ALTER TABLE budgets RENAME COLUMN IF EXISTS indirects TO indirect_percentage;`,
  `ALTER TABLE budgets RENAME COLUMN IF EXISTS contingencies TO contingency_percentage;`,
  `ALTER TABLE budgets RENAME COLUMN IF EXISTS utility TO profit_percentage;`,
  `ALTER TABLE budgets RENAME COLUMN IF EXISTS total_budget TO total_amount;`,

  '-- RENOMBRAR EN budget_items --',
  `ALTER TABLE budget_items RENAME COLUMN IF EXISTS unit_price TO unit_cost;`,
  `ALTER TABLE budget_items RENAME COLUMN IF EXISTS total_price TO total_cost;`,

  '-- AGREGAR sync_status y updated_at a profiles --',
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,

  '-- AGREGAR quantity, unit, unit_cost a financial_transactions --',
  `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 1;`,
  `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'unid';`,
  `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2) DEFAULT 0;`,

  '-- CORREGIR resource_type EN budget_item_breakdown --',
  `ALTER TABLE budget_item_breakdown DROP CONSTRAINT IF EXISTS budget_item_breakdown_resource_type_check;`,
  `ALTER TABLE budget_item_breakdown ADD CONSTRAINT budget_item_breakdown_resource_type_check CHECK (resource_type IN ('material', 'labor', 'equipment', 'subcontract'));`,
];

async function apply() {
  console.log('Aplicando correcciones al schema de Supabase...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const sql of corrections) {
    if (sql.startsWith('--')) {
      console.log('\n' + sql);
      continue;
    }
    try {
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) {
        console.log('  ' + error.message.substring(0, 80));
      } else {
        console.log('  OK');
      }
    } catch (e) {
      if (e.message && e.message.includes('function exec_sql')) {
        // Try via REST API with POST to /rest/v1/rpc/exec_sql
        const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
          body: JSON.stringify({ query: sql })
        });
        if (!resp.ok) {
          const text = await resp.text();
          console.log('  ' + text.substring(0, 80));
        } else {
          console.log('  OK');
        }
      } else {
        console.log('  ' + (e.message || String(e)).substring(0, 80));
      }
    }
  }

  console.log('\nCorrecciones completadas.');
}

apply();
