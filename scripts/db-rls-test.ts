import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('--- Presupuestos visibles para anon ---');
  const anonBudgets = await anon.from('budgets').select('id, project_id').limit(10);
  console.log(`Anon ve ${anonBudgets.data?.length ?? 0} presupuestos de 3`);

  console.log('\n--- Items de presupuesto visibles para anon ---');
  const anonItems = await anon.from('budget_items').select('id, budget_id, project_id, code').limit(10);
  console.log(`Anon ve ${anonItems.data?.length ?? 0} items de 18`);
  for (const i of anonItems.data ?? []) {
    console.log(`  ${i.code} | budget=${i.budget_id} | project=${i.project_id ?? 'NULL'}`);
  }

  console.log('\n--- Warehouse stock visible para anon ---');
  const anonWh = await anon.from('warehouse_stock').select('item_code, project_id').limit(10);
  console.log(`Anon ve ${anonWh.data?.length ?? 0} items de almacén de 5`);

  console.log('\n--- auth.users disponible via PostgREST? ---');
  try {
    const { data: users } = await admin.from('auth.users').select('id, email').limit(5);
    console.log('auth.users accesible:', users?.length ?? 0);
    for (const u of users ?? []) {
      console.log(`  ${u.email}`);
    }
  } catch (e: any) {
    console.log('auth.users NO accesible via PostgREST:', e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
