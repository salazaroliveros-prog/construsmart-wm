import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const REPORT: string[] = [];
function log(msg: string) { REPORT.push(msg); console.log(msg); }

async function tableExists(name: string): Promise<boolean> {
  const { error } = await supabase.from(name).select('*').limit(1);
  return !error;
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function sample(table: string, columns: string, limit = 3) {
  const { data, error } = await supabase.from(table).select(columns).limit(limit);
  if (error) throw error;
  return data;
}

async function main() {
  log('=== INSPECCIÓN TÉCNICA DE BASE DE DATOS REMOTA ===\n');

  const EXPECTED_TABLES = [
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'purchase_orders', 'purchase_order_items',
    'project_logs', 'clients', 'suppliers'
  ];

  // 1. Verificar existencia de tablas
  log('--- 1. Verificación de tablas ---');
  const foundTables: string[] = [];
  for (const t of EXPECTED_TABLES) {
    try {
      const exists = await tableExists(t);
      if (exists) {
        foundTables.push(t);
        log(`  [OK] ${t}`);
      } else {
        log(`  [FALTA] ${t}`);
      }
    } catch (e: any) {
      log(`  [ERROR] ${t}: ${e.message}`);
    }
  }

  // 2. Conteos
  log('\n--- 2. Conteos de filas ---');
  const counts: Record<string, number> = {};
  for (const t of foundTables) {
    try {
      const n = await countRows(t);
      counts[t] = n;
      log(`  ${t}: ${n} filas`);
    } catch (e: any) {
      log(`  ${t}: ERROR - ${e.message}`);
    }
  }

  // 3. CRUD en projects
  log('\n--- 3. Prueba CRUD en projects ---');
  const testProjectId = '00000000-0000-0000-0000-000000000001';
  const testCode = `INSP-${Date.now()}`;
  const insertPayload: any = {
    id: testProjectId,
    code: testCode,
    name: 'Proyecto Inspección Técnica',
    client_name: 'Cliente Prueba',
    location: 'Ciudad de Guatemala',
    typology: 'residential',
    area_m2: 100,
    quality_level: 'basic',
    status: 'planning',
    start_date: '2026-01-01',
    estimated_end_date: '2026-06-01',
    duration_days: 150,
    total_budget: 500000,
    budget_total: 500000,
    calculated_duration: 150,
    has_critical_roadblock: false,
    roadblock_type: null,
    roadblock_description: null,
    roadblock_date: null,
    completion_buffer_days: null,
    sync_status: 'synced',
  };
  let crudOk = true;
  const { data: created, error: createErr } = await supabase.from('projects').insert(insertPayload).select('*').single();
  if (createErr) { log(`  CREATE: FALLÓ - ${createErr.message}`); crudOk = false; }
  else { log(`  CREATE: OK (id=${created.id}, code=${created.code})`); }

  if (crudOk) {
    const { data: readData, error: readErr } = await supabase.from('projects').select('*').eq('id', testProjectId).single();
    if (readErr) { log(`  READ: FALLÓ - ${readErr.message}`); crudOk = false; }
    else { log(`  READ: OK (code=${readData.code})`); }

    const { data: updated, error: updateErr } = await supabase.from('projects').update({ name: 'Proyecto Actualizado' }).eq('id', testProjectId).select('*').single();
    if (updateErr) { log(`  UPDATE: FALLÓ - ${updateErr.message}`); crudOk = false; }
    else { log(`  UPDATE: OK (name=${updated.name})`); }

    const { error: deleteErr } = await supabase.from('projects').delete().eq('id', testProjectId);
    if (deleteErr) { log(`  DELETE: FALLÓ - ${deleteErr.message}`); }
    else { log(`  DELETE: OK`); }
  }

  // 4. RLS: anon vs service_role
  log('\n--- 4. RLS: comportamiento anon vs service_role ---');
  const anonUrl = SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const anonClient = createClient(anonUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonProjects = await anonClient.from('projects').select('*').limit(3);
  log(`  Anon puede leer projects: ${anonProjects.error ? 'NO (' + anonProjects.error.message + ')' : 'SÍ (' + (anonProjects.data?.length ?? 0) + ' filas)'}`);
  const anonInsert = await anonClient.from('projects').insert({ code: 'ANON-TEST', name: 'Test', client_name: 'X', location: 'X', typology: 'residential' as any, area_m2: 1, quality_level: 'basic' as any, status: 'planning' as any, duration_days: 1, total_budget: 1, budget_total: 1 }).select('*').single();
  log(`  Anon puede insertar projects: ${anonInsert.error ? 'NO' : 'SÍ'}`);

  // 5. Muestra de datos
  log('\n--- 5. Muestra de datos (projects) ---');
  try {
    const sampleData = await sample('projects', 'id, code, name, status, typology, total_budget, user_id', 3);
    for (const p of (sampleData ?? []) as any[]) {
      log(`  ${p.code} | ${p.name} | ${p.status} | Q${p.total_budget} | user=${p.user_id ?? 'NULL'}`);
    }
    if ((sampleData?.length ?? 0) === 0) log('  (sin datos)');
  } catch (e: any) {
    log(`  ERROR: ${e.message}`);
  }

  // 6. user_id coverage
  log('\n--- 6. Cobertura de user_id en projects ---');
  try {
    const withUser = await supabase.from('projects').select('id, code, user_id').not('user_id', 'is', null).limit(10);
    log(`  Proyectos con user_id: ${withUser.data?.length ?? 0}`);
    const withoutUser = await supabase.from('projects').select('id, code, user_id').is('user_id', null).limit(10);
    log(`  Proyectos sin user_id: ${withoutUser.data?.length ?? 0}`);
  } catch (e: any) {
    log(`  ERROR: ${e.message}`);
  }

  // 7. Categorías en financial_transactions
  log('\n--- 7. Categorías en financial_transactions ---');
  try {
    const { data: txs } = await supabase.from('financial_transactions').select('category, type').limit(200);
    const cats = new Set((txs ?? []).map((t: any) => t.category));
    log(`  Categorías únicas: ${[...cats].join(', ') || '(ninguna)'}`);
    const types = new Set((txs ?? []).map((t: any) => t.type));
    log(`  Tipos únicos: ${[...types].join(', ')}`);
  } catch (e: any) {
    log(`  ERROR: ${e.message}`);
  }

  // 8. Warehouse stock project_id
  log('\n--- 8. Warehouse stock project_id ---');
  try {
    const withProj = await supabase.from('warehouse_stock').select('id, item_code, project_id').not('project_id', 'is', null).limit(5);
    log(`  Items con project_id: ${withProj.data?.length ?? 0}`);
    const withoutProj = await supabase.from('warehouse_stock').select('id, item_code, project_id').is('project_id', null).limit(5);
    log(`  Items sin project_id (globales): ${withoutProj.data?.length ?? 0}`);
  } catch (e: any) {
    log(`  ERROR: ${e.message}`);
  }

  // 9. Presupuestos y items
  log('\n--- 9. Presupuestos y items ---');
  try {
    const budgets = await supabase.from('budgets').select('id, project_id, version, total_amount').limit(5);
    log(`  Presupuestos: ${budgets.data?.length ?? 0} (muestra)`);
    for (const b of budgets.data ?? []) {
      log(`    id=${b.id} project=${b.project_id} v=${b.version} total=${b.total_amount}`);
    }
    const items = await supabase.from('budget_items').select('id, budget_id, project_id, code, quantity').limit(5);
    log(`  Items de presupuesto: ${items.data?.length ?? 0} (muestra)`);
    for (const i of items.data ?? []) {
      log(`    id=${i.id} budget=${i.budget_id} project=${i.project_id} code=${i.code} qty=${i.quantity}`);
    }
  } catch (e: any) {
    log(`  ERROR: ${e.message}`);
  }

  // 10. Nómina y empleados
  log('\n--- 10. Nómina y empleados ---');
  try {
    const employees = await countRows('payroll_employees');
    log(`  payroll_employees: ${employees}`);
    const payroll = await countRows('payroll_records');
    log(`  payroll_records: ${payroll}`);
  } catch (e: any) {
    log(`  ERROR: ${e.message}`);
  }

  // Guardar informe
  const reportPath = 'C:\\Users\\wilso\\AppData\\Local\\Temp\\kilo\\db-inspection-report.txt';
  fs.mkdirSync('C:\\Users\\wilso\\AppData\\Local\\Temp\\kilo', { recursive: true });
  fs.writeFileSync(reportPath, REPORT.join('\n'));
  log(`\n[INFORME GUARDADO EN: ${reportPath}]`);
}

main().catch(e => { console.error(e); process.exit(1); });
