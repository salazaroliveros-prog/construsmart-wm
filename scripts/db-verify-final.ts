import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan variables de entorno.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('=== VERIFICACIÓN FINAL POST-CORRECCIÓN ===\n');

  // 1. Estado del usuario admin
  console.log('--- 1. Usuario administrador ---');
  const { data: users } = await admin.from('auth.users').select('id, email, email_confirmed_at, confirmed_at, last_sign_in_at, created_at').eq('email', ADMIN_EMAIL).limit(1);
  const user = users?.[0];
  if (!user) {
    console.log('  Usuario NO encontrado en auth.users.');
  } else {
    console.log(`  Email: ${user.email}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email confirmado: ${user.email_confirmed_at ?? 'NO'}`);
    console.log(`  Cuenta confirmada: ${user.confirmed_at ?? 'NO'}`);
    console.log(`  Último login: ${user.last_sign_in_at ?? 'NUNCA'}`);
    console.log(`  Creado: ${user.created_at}`);
    if (!user.email_confirmed_at && !user.confirmed_at) {
      console.log('  ADVERTENCIA: el email no está confirmado. El login podría fallar.');
    }
  }

  // 2. Proyectos y user_id
  console.log('\n--- 2. Proyectos ---');
  const { data: projects } = await admin.from('projects').select('id, code, name, user_id, status, total_budget');
  const total = projects?.length ?? 0;
  const withUser = (projects ?? []).filter(p => p.user_id);
  console.log(`  Total: ${total}`);
  console.log(`  Con user_id: ${withUser.length}`);
  for (const p of projects ?? []) {
    console.log(`    ${p.code} | ${p.name} | user=${p.user_id ?? 'NULL'} | ${p.status} | Q${p.total_budget}`);
  }

  // 3. Budget items
  console.log('\n--- 3. Budget items ---');
  const { data: items } = await admin.from('budget_items').select('id, budget_id, project_id, code, quantity').limit(20);
  const itemsWithoutProj = (items ?? []).filter(i => !i.project_id);
  console.log(`  Total (muestra): ${items?.length ?? 0}`);
  console.log(`  Sin project_id: ${itemsWithoutProj.length}`);
  for (const i of items ?? []) {
    console.log(`    ${i.code} | budget=${i.budget_id} | project=${i.project_id ?? 'NULL'} | qty=${i.quantity}`);
  }

  // 4. RLS check
  console.log('\n--- 4. RLS check (anon) ---');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const anon = createClient(SUPABASE_URL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonProjects = await anon.from('projects').select('*').limit(10);
  const anonCount = anonProjects.data?.length ?? 0;
  console.log(`  Anon ve ${anonCount} proyectos (esperado: 0)`);
  const anonInsert = await anon.from('projects').insert({ code: 'RLS-TEST', name: 'X', client_name: 'X', location: 'X', typology: 'residential', area_m2: 1, quality_level: 'basic', status: 'planning', duration_days: 1, total_budget: 1, budget_total: 1 }).select('*').single();
  console.log(`  Anon inserta: ${anonInsert.error ? 'NO (correcto)' : 'SÍ (¡CRÍTICO!)'}`);

  // 5. CRUD end-to-end (service role)
  console.log('\n--- 5. CRUD end-to-end (service role) ---');
  const testId = '00000000-0000-0000-0000-000000000002';
  const testCode = `VERIFY-${Date.now()}`;
  const { data: created, error: cErr } = await admin.from('projects').insert({
    id: testId, code: testCode, name: 'Verificación', client_name: 'X', location: 'X',
    typology: 'residential', area_m2: 1, quality_level: 'basic', status: 'planning',
    duration_days: 1, total_budget: 1, budget_total: 1, user_id: user?.id,
  }).select('*').single();
  console.log(`  CREATE: ${cErr ? 'FALLÓ - ' + cErr.message : 'OK'}`);
  if (!cErr) {
    const { data: read } = await admin.from('projects').select('*').eq('id', testId).single();
    console.log(`  READ: ${read ? 'OK' : 'FALLÓ'}`);
    const { data: updated, error: uErr } = await admin.from('projects').update({ name: 'Verificación 2' }).eq('id', testId).select('*').single();
    console.log(`  UPDATE: ${uErr ? 'FALLÓ - ' + uErr.message : 'OK'}`);
    const { error: dErr } = await admin.from('projects').delete().eq('id', testId);
    console.log(`  DELETE: ${dErr ? 'FALLÓ - ' + dErr.message : 'OK'}`);
  }

  // 6. Warehouse stock
  console.log('\n--- 6. Warehouse stock ---');
  const { data: wh } = await admin.from('warehouse_stock').select('id, item_code, current_stock, minimum_threshold, project_id').limit(10);
  console.log(`  Items: ${wh?.length ?? 0}`);
  for (const w of wh ?? []) {
    console.log(`    ${w.item_code} | stock=${w.current_stock} | min=${w.minimum_threshold} | deficit=${(w.current_stock ?? 0) - (w.minimum_threshold ?? 0)} | project=${w.project_id ?? 'NULL'}`);
  }

  console.log('\n=== FIN DE VERIFICACIÓN ===');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
