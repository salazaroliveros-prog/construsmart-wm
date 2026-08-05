import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan variables de entorno.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

const REPORT: string[] = [];
function log(msg: string) { REPORT.push(msg); console.log(msg); }

async function main() {
  log('=== INSPECCIÓN PROFUNDA - BD REMOTA ===\n');

  // 1. Probar constraint de categoría (migración 20260901000000)
  log('--- 1. Constraint de categoría en financial_transactions ---');
  const testTx = {
    project_id: null,
    type: 'expense',
    category: 'Gastos Operativos / Nómina de Mano de Obra',
    description: 'Inspección técnica - prueba de constraint',
    quantity: 1,
    unit: 'Q',
    unit_cost: 100,
    total_cost: 100,
    date: new Date().toISOString().split('T')[0],
    sync_status: 'synced',
  };
  const { data: txCreated, error: txErr } = await admin.from('financial_transactions').insert(testTx).select('*').single();
  if (txErr) {
    log(`  INSERT categoría nómina: FALLÓ - ${txErr.message}`);
    log('  => La migración 20260901000000 NO ha sido aplicada o la constraint no incluye la categoría.');
  } else {
    log(`  INSERT categoría nómina: OK (id=${txCreated.id})`);
    await admin.from('financial_transactions').delete().eq('id', txCreated.id);
    log(`  Limpieza: OK`);
  }

  // 2. Verificar si RLS migration 20260804000000 fue aplicada
  log('\n--- 2. Verificación de políticas RLS ---');
  // Si anon ve 0 filas en projects pero la tabla tiene 3, RLS está activo.
  // Si anon viera 3 filas, RLS no estaría activo o habría política anon abierta.
  const anonProjects = await anon.from('projects').select('*').limit(10);
  const anonCount = anonProjects.data?.length ?? 0;
  log(`  Anon ve ${anonCount} proyectos de 3 existentes (esperado: 0 si RLS activo)`);
  if (anonCount === 0) {
    log('  => RLS está ACTIVO y filtrando correctamente para anon.');
  } else if (anonCount === 3) {
    log('  => RLS NO está activo o hay política anon abierta. ¡CRÍTICO!');
  }

  // 3. Verificar registros huérfanos
  log('\n--- 3. Integridad referencial ---');
  // Presupuestos sin proyecto
  const budgets = await admin.from('budgets').select('id, project_id').limit(100);
  const orphanBudgets = (budgets.data ?? []).filter(b => !b.project_id);
  log(`  Presupuestos sin project_id: ${orphanBudgets.length} de ${budgets.data?.length ?? 0}`);

  // Items de presupuesto sin presupuesto ni proyecto
  const items = await admin.from('budget_items').select('id, budget_id, project_id').limit(100);
  const orphanItems = (items.data ?? []).filter(i => !i.budget_id && !i.project_id);
  log(`  Items sin budget_id ni project_id: ${orphanItems.length} de ${items.data?.length ?? 0}`);

  // Proyectos sin user_id
  const projects = await admin.from('projects').select('id, code, user_id').limit(100);
  const projectsWithoutUser = (projects.data ?? []).filter(p => !p.user_id);
  log(`  Proyectos sin user_id: ${projectsWithoutUser.length} de ${projects.data?.length ?? 0}`);
  for (const p of projectsWithoutUser) {
    log(`    - ${p.code} (${p.id})`);
  }

  // Transacciones sin proyecto
  const txs = await admin.from('financial_transactions').select('id, project_id').limit(100);
  const orphanTxs = (txs.data ?? []).filter(t => !t.project_id);
  log(`  Transacciones sin project_id: ${orphanTxs.length} de ${txs.data?.length ?? 0}`);

  // Registros de nómina sin proyecto
  const payroll = await admin.from('payroll_records').select('id, project_id').limit(100);
  const orphanPayroll = (payroll.data ?? []).filter(p => !p.project_id);
  log(`  Registros de nómina sin project_id: ${orphanPayroll.length} de ${payroll.data?.length ?? 0}`);

  // 4. Verificar stock del almacén vs presupuestos
  log('\n--- 4. Consistencia almacén-presupuesto ---');
  const warehouse = await admin.from('warehouse_stock').select('item_code, current_stock, minimum_threshold, project_id').limit(50);
  log(`  Items en almacén: ${warehouse.data?.length ?? 0}`);
  for (const w of warehouse.data ?? []) {
    const shortage = (w.current_stock ?? 0) - (w.minimum_threshold ?? 0);
    log(`    ${w.item_code} | stock=${w.current_stock} | min=${w.minimum_threshold} | déficit=${shortage} | project=${w.project_id ?? 'NULL'}`);
  }

  // 5. Verificar bitácora
  log('\n--- 5. Bitácora de proyectos ---');
  const logs = await admin.from('project_logs').select('id, project_id, activity_type, log_date').limit(20);
  log(`  Entradas de bitácora: ${logs.data?.length ?? 0}`);
  for (const l of logs.data ?? []) {
    log(`    ${l.project_id} | ${l.activity_type} | ${l.log_date}`);
  }

  // 6. Proveedores y clientes
  log('\n--- 6. Catálogos (proveedores/clientes) ---');
  const suppliers = await admin.from('suppliers').select('id, name, is_preferred').limit(10);
  log(`  Proveedores: ${suppliers.data?.length ?? 0}`);
  const clients = await admin.from('clients').select('id, name, client_type').limit(10);
  log(`  Clientes: ${clients.data?.length ?? 0}`);

  // Guardar informe
  const reportPath = 'C:\\Users\\wilso\\AppData\\Local\\Temp\\kilo\\db-inspection-deep.txt';
  fs.mkdirSync('C:\\Users\\wilso\\AppData\\Local\\Temp\\kilo', { recursive: true });
  fs.writeFileSync(reportPath, REPORT.join('\n'));
  log(`\n[INFORME GUARDADO EN: ${reportPath}]`);
}

main().catch(e => { console.error(e); process.exit(1); });
