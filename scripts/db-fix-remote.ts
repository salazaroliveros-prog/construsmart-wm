import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAdminUser(): Promise<{ id: string; email: string } | null> {
  // 1. Buscar por PostgREST (eq suele funcionar mejor que ilike en auth.users)
  try {
    const { data } = await admin.from('auth.users').select('id, email').eq('email', ADMIN_EMAIL).limit(1);
    if (data?.[0]?.id) return data[0];
  } catch { /* sigue intentando */ }

  const secret = SUPABASE_SECRET_KEY || '';
  const headers = {
    'Authorization': `Bearer ${secret}`,
    'apikey': secret,
  } as Record<string, string>;

  // 2. Buscar por Admin API GET
  const resp = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`,
    { headers }
  );
  if (resp.ok) {
    const result = await resp.json();
    const users = result?.users ?? result ?? [];
    if (Array.isArray(users) && users[0]?.id) return users[0];
  }

  return null;
}

async function main() {
  console.log('=== CORRECCIÓN DE INCONSISTENCIAS EN BD REMOTA ===\n');

  // 1. Buscar usuario admin
  console.log('--- 1. Usuario administrador ---');
  const existing = await findAdminUser();
  if (existing?.id) {
    console.log(`  Usuario encontrado: ${existing.email} (${existing.id})`);
  } else {
    console.log('  Usuario NO encontrado. Debe ser creado manualmente desde el dashboard de Supabase.');
    console.log(`  Email objetivo: ${ADMIN_EMAIL}`);
    console.log('  Una vez creado, vuelve a ejecutar este script para hacer el backfill.');
  }

  // 2. Backfill user_id en projects
  console.log('\n--- 2. Backfill user_id en projects ---');
  const { data: projects } = await admin.from('projects').select('id, code, name').is('user_id', null).limit(100);
  const orphanProjects = projects ?? [];
  console.log(`  Proyectos sin user_id: ${orphanProjects.length}`);
  if (orphanProjects.length > 0 && existing?.id) {
    const ids = orphanProjects.map(p => p.id);
    const { error } = await admin
      .from('projects')
      .update({ user_id: existing.id })
      .in('id', ids);
    if (error) {
      console.log(`  ERROR: ${error.message}`);
    } else {
      console.log(`  OK: ${ids.length} proyectos backflusheados.`);
      for (const p of orphanProjects) console.log(`    - ${p.code} (${p.id})`);
    }
  } else if (orphanProjects.length > 0 && !existing?.id) {
    console.log('  OMITIDO: usuario admin no disponible.');
  } else {
    console.log('  Nada que backflushear.');
  }

  // 3. Backfill project_id en budget_items
  console.log('\n--- 3. Backfill project_id en budget_items ---');
  const { data: items } = await admin.from('budget_items').select('id, budget_id, project_id').is('project_id', null).limit(200);
  const itemsWithoutProj = items ?? [];
  console.log(`  Items sin project_id: ${itemsWithoutProj.length}`);
  if (itemsWithoutProj.length > 0) {
    const budgetIds = [...new Set(itemsWithoutProj.map(i => i.budget_id).filter(Boolean))];
    const { data: budgets } = await admin.from('budgets').select('id, project_id').in('id', budgetIds);
    const budgetMap = new Map((budgets ?? []).map(b => [b.id, b.project_id]));
    const updates = itemsWithoutProj
      .filter(i => i.budget_id && budgetMap.has(i.budget_id))
      .map(i => ({ id: i.id, project_id: budgetMap.get(i.budget_id)! }));
    console.log(`  Items actualizables: ${updates.length}`);
    for (const u of updates) {
      const { error } = await admin.from('budget_items').update({ project_id: u.project_id }).eq('id', u.id);
      if (error) console.log(`  ERROR: ${error.message}`);
    }
    console.log(`  OK: ${updates.length} items backflusheados.`);
  } else {
    console.log('  Nada que backflushear.');
  }

  // 4. Verificación final
  console.log('\n--- 4. Verificación final ---');
  const { data: finalProjects } = await admin.from('projects').select('id, code, user_id');
  const withUser = (finalProjects ?? []).filter(p => p.user_id);
  console.log(`  Proyectos con user_id: ${withUser.length}/${finalProjects?.length ?? 0}`);

  const { data: finalItems } = await admin.from('budget_items').select('id, project_id').is('project_id', null).limit(10);
  console.log(`  Items sin project_id: ${finalItems?.length ?? 0}`);

  if (existing) {
    console.log(`  Usuario admin confirmado: ${existing.email} (${existing.id})`);
  } else {
    console.log('  Usuario admin: NO ENCONTRADO (debe crearse manualmente).');
  }

  console.log('\n=== FIN ===');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
