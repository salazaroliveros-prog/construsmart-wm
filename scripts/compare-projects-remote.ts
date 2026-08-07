/**
 * CONSTRUCTORA WM/M&S - COMPARACIÓN PARALELA PROYECTOS
 * "CONSTRUYENDO EL FUTURO"
 *
 * Compara en paralelo lo que ve la BD remota (service-role / verdad) vs lo que
 * leería la suite del frontend (cliente anon/RLS, exactamente el path de
 * fetchProjectsForOffline: select('*') order by created_at desc + scope por
 * auth.uid()).
 *
 * 1) Verdad (DB):  todos los proyectos con service-role.
 * 2) Suite (front): misma consulta pero filtrada por user_id = auth.uid() del
 *    admin (equivale al RLS "user_id = auth.uid()" que aplica el cliente anon
 *    del navegador, ya que la app opera como ese administrador).
 * 3) Unión de columnas: verifica que cada campo que la suite renderiza en
 *    ProjectManager exista en la fila remota (select('*') las trae todas).
 * 4) Routing: para cada proyecto visible en la suite, verifica en paralelo que
 *    sus hijos referenciados (budgets, items, transacciones, logs, payroll,
 *    warehouse, order de compra) estén enrutados al proyecto correcto y que no
 *    haya huérfanos en la BD (project_id inexistente).
 *
 * Uso:
 *   npx tsx scripts/compare-projects-remote.ts
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const U = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const K = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

if (!U || !K) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env');
  process.exit(1);
}

const role = createClient(U, K, { auth: { persistSession: false } });
const headers = { Authorization: `Bearer ${K}`, apikey: K };

// Columnas que la suite (ProjectManager) se propone leer/rendrar del proyecto.
const EXPECTED_FIELDS = [
  'id', 'code', 'name', 'client_name', 'client_phone', 'client_email',
  'location', 'typology', 'area_m2', 'quality_level', 'status',
  'start_date', 'estimated_end_date', 'duration_days', 'total_budget',
  'budget_total', 'calculated_duration', 'has_critical_roadblock',
  'roadblock_type', 'roadblock_description', 'roadblock_date',
  'completion_buffer_days', 'sync_status', 'user_id', 'created_at',
];

// Tablas enrutadas por project_id (los "hijos" que la suite ataja por proyecto).
const CHILD_TABLES = [
  'budgets',
  'budget_items',
  'financial_transactions',
  'project_logs',
  'payroll_records',
  'warehouse_stock',
  'purchase_orders',
  'purchase_order_items',
  'payroll_employees',
];

async function resolveAdminId(): Promise<string | null> {
  const resp = await fetch(
    `${U}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`,
    { headers: headers as Record<string, string> }
  );
  const json = await resp.json();
  const users = json?.users ?? json ?? [];
  return users[0]?.id ?? null;
}

async function getProjectsAsUser(uid: string) {
  // Query idéntica a fetchProjectsForOffline (select * order by created_at desc),
  // limitada al user_id del admin, replicando el RLS "user_id = auth.uid()".
  const { data, error } = await role
    .from('projects')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) return { projects: null, error: error.message };
  return { projects: data ?? [], error: null };
}

async function getProjectsRaw(uid: string) {
  // Los que el service-role ve, incluidos los ajenos/null (para detectar fugas)
  // que la suite NO mostraría.
  const { data, error } = await role
    .from('projects')
    .select('id, code, name, user_id, created_at')
    .order('created_at', { ascending: false });
  return { projects: data ?? [], error: error?.message ?? null };
}

async function assertRouteIntegrity(uid: string, suiteIds: Set<string>) {
  const orphans: string[] = [];
  const childCount: Record<string, number> = {};
  for (const table of CHILD_TABLES) {
    // select project_id distinct para saber a qué proyecto apunta cada hijo.
    const { data, error } = await role
      .from(table)
      .select('project_id');
    if (error) {
      // Tabla opcional sin columna / no existe → solo se audita si existe.
      continue;
    }
    const rows = (data ?? []) as { project_id: string | null }[];
    const referenced = new Set<string>();
    rows.forEach((r) => { if (r.project_id) referenced.add(r.project_id); });

    // Huérfanos del proyecto en BD => apunta a un id inexistente en projects.
    const valid = await role.from('projects').select('id');

    const validIds = new Set((valid.data ?? []).map((p) => p.id));
    for (const pid of referenced) {
      if (!validIds.has(pid)) orphans.push(`${table}->${pid} (project_id inexistente)`);
    }
    childCount[table] = rows.length;
  }

  return { orphans, childCount };
}

async function main() {
  console.log('Proyecto:', U.replace(/^https:\/\//, ''));

  // 0. Resolver el admin (la suite opera como este usuario).
  const uid = await resolveAdminId();
  if (!uid) {
    console.error('❌ No se pudo resolver el administrador de la suite.');
    return;
  }
  console.log(`Usuario suite: ${uid}`);

  // 1. Verdad (service-role): todos los proyectos remotos.
  const { projects: allProjects, error: errAll } = await getProjectsRaw(uid);
  if (errAll) {
    console.error('❌ Error leyendo proyectos (DB):', errAll);
    return;
  }

  // 2. Suite (frontend): solo lo que vería el usuario autenticado.
  const { projects: suiteProjects, error: errSuite } = await getProjectsAsUser(uid);
  if (errSuite) {
    console.error('❌ Error leyendo proyectos (suite):', errSuite);
    return;
  }
  if (!suiteProjects) {
    console.error('❌ La suite no devolvió proyectos.');
    return;
  }

  const allById = new Map(allProjects.map((p) => [p.id, p]));
  const suiteById = new Map(suiteProjects.map((p) => [p.id, p]));

  console.log('\n=== 1. ALINEACIÓN DE PROYECTOS (DB vs SUITE) ===');
  console.log(`DB (service-role):   ${allProjects.length} proyecto(s)`);
  console.log(`Suite (view RLS)  :   ${suiteProjects.length} proyecto(s)`);

  // proyecto en BD ajeno al suite (no user_id del admin) → "fugado"/oculto.
  const inDbNotSuite = allProjects.filter((p) => !suiteById.has(p.id));
  const inSuiteNotDb = suiteProjects.filter((p) => !allById.has(p.id));

  if (inDbNotSuite.length === 0 && inSuiteNotDb.length === 0 && suiteProjects.length === allProjects.length) {
    console.log('✅ Perfectamente alineados: misma cantidad e ids (todos pertenecen al admin).');
  } else {
    if (inSuiteNotDb.length) {
      console.log(`❌ Proyectos en SUITE que no existen en DB: ${inSuiteNotDb.map((p) => p.code ?? p.id).join(', ')}`);
    }
    if (inDbNotSuite.length) {
      console.log(`⚠️ Proyectos en DB que la suite NO muestra (ajenos/legacy):`);
      for (const p of inDbNotSuite) {
        console.log(`   - code=${p.code} name=${p.name} user_id=${p.user_id ?? '(null/legacy)'}`);
      }
    }
  }

  // 2. Verificar que los campos que la suite usa estén en la fila remota.
  console.log('\n=== 2. CAMPOS LEÍDOS POR LA SUITE (ProjectManager) ===');
  const suiteA = suiteProjects[0];
  if (!suiteA) {
    console.log('⚠️ Sin proyectos en la suite para auditar campos.');
  } else {
    const missing = EXPECTED_FIELDS.filter((f) => !(f in suiteA));
    if (missing.length === 0) {
      console.log(`✅ Los ${EXPECTED_FIELDS.length} campos que renderiza la suite están presentes en la fila remota.`);
    } else {
      console.log(`❌ Campos ausentes en la fila remota: ${missing.join(', ')}`);
    }
  }

  // 3. Enrutamiento/consistencia de hijos en paralelo por proyecto.
  console.log('\n=== 3. ENRUTAMIENTO DE DATOS POR PROYECTO ===');
  const suiteIds = new Set(suiteById.keys());
  const { orphans, childCount } = await assertRouteIntegrity(uid, suiteIds);

  if (orphans.length === 0) {
    console.log('✅ Sin huérfanos: todo project_id de las tablas hijas apunta a un proyecto existente.');
  } else {
    console.log(`❌ Huérfanos encontrados:`);
    orphans.forEach((o) => console.log(`   - ${o}`));
  }

  // Mapeo por proyecto de los hijos enrutados.
  const byProj: Record<string, { code: string; name: string; children: string[] }> = {};
  for (const p of suiteProjects) {
    byProj[p.id] = { code: p.code, name: p.name, children: [] };
  }
  for (const table of CHILD_TABLES) {
    const { data } = await role.from(table).select('project_id');
    if (data) {
      for (const p of suiteProjects) {
        const n = data.filter((r) => r.project_id === p.id).length;
        if (n > 0) byProj[p.id].children.push(`${table}(${n})`);
      }
    }
  }
  for (const id of Object.keys(byProj)) {
    const { code, name, children } = byProj[id];
    const line = children.length ? children.join(', ') : '(sin hijos)';
    console.log(`   ${code ?? id}: ${name ?? ''} → ${line}`);
  }

  console.log('\n=== RESUMEN ===');
  console.log(`Proyectos visibles para la suite: ${suiteProjects.length}`);
  console.log(`Proyectos ocultos para la suite (ajenos/legacy): ${inDbNotSuite.length}`);
  console.log('Listo.');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});