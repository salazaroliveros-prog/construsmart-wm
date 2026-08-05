import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan variables de entorno.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('=== BACKFILL DE DATOS PARA CONSISTENCIA ===\n');

  // 1. Buscar usuario administrador
  console.log('--- 1. Buscar usuario admin ---');
  const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
  const { data: users } = await admin.from('auth.users').select('id, email').ilike('email', ADMIN_EMAIL).limit(5);
  const adminUser = users?.[0];
  if (adminUser) {
    console.log(`  Admin encontrado: ${adminUser.email} (${adminUser.id})`);
  } else {
    console.log(`  Admin NO encontrado con email ${ADMIN_EMAIL}`);
    console.log('  Usuarios en auth.users:');
    const { data: allUsers } = await admin.from('auth.users').select('id, email').limit(10);
    for (const u of allUsers ?? []) {
      console.log(`    ${u.email}`);
    }
  }

  // 2. Backfill user_id en projects
  console.log('\n--- 2. Backfill user_id en projects ---');
  const { data: projects } = await admin.from('projects').select('id, code, name, user_id').is('user_id', null).limit(100);
  console.log(`  Proyectos sin user_id: ${projects?.length ?? 0}`);
  if (projects && projects.length > 0 && adminUser) {
    const { error: updateErr } = await admin
      .from('projects')
      .update({ user_id: adminUser.id })
      .in('id', projects.map(p => p.id));
    if (updateErr) {
      console.log(`  ERROR actualizando: ${updateErr.message}`);
    } else {
      console.log(`  OK: ${projects.length} proyectos actualizados con user_id=${adminUser.id}`);
    }
  } else if (!adminUser) {
    console.log('  OMITIDO: no se encontró usuario admin para asignar.');
  }

  // 3. Backfill project_id en budget_items desde budgets
  console.log('\n--- 3. Backfill project_id en budget_items ---');
  const { data: items } = await admin.from('budget_items').select('id, budget_id, project_id').is('project_id', null).limit(100);
  console.log(`  Items sin project_id: ${items?.length ?? 0}`);
  if (items && items.length > 0) {
    const budgetIds = [...new Set(items.map(i => i.budget_id).filter(Boolean))];
    console.log(`  Buscando project_id para ${budgetIds.length} presupuestos únicos...`);
    const { data: budgets } = await admin.from('budgets').select('id, project_id').in('id', budgetIds);
    const budgetMap = new Map((budgets ?? []).map(b => [b.id, b.project_id]));
    const updates = items
      .filter(i => i.budget_id && budgetMap.has(i.budget_id))
      .map(i => ({ id: i.id, project_id: budgetMap.get(i.budget_id)! }));
    console.log(`  Items actualizables: ${updates.length}`);
    if (updates.length > 0) {
      for (const u of updates) {
        const { error } = await admin.from('budget_items').update({ project_id: u.project_id }).eq('id', u.id);
        if (error) {
          console.log(`  ERROR actualizando item ${u.id}: ${error.message}`);
        }
      }
      console.log(`  OK: ${updates.length} items actualizados.`);
    }
  }

  // 4. Verificar categoría de nómina en migración
  console.log('\n--- 4. Verificar constraint de categoría ---');
  const testCategories = [
    'Gastos Operativos / Nómina de Mano de Obra',
    'materiales',
    'mano_de_obra',
    'aporte',
    'sub_contrato',
    'categoria_invalida_xyz',
  ];
  for (const cat of testCategories) {
    const { data, error } = await admin.from('financial_transactions')
      .insert({
        project_id: null,
        type: 'expense',
        category: cat,
        description: `Test constraint: ${cat}`,
        quantity: 1,
        unit: 'Q',
        unit_cost: 1,
        total_cost: 1,
        date: '2026-01-01',
        sync_status: 'synced',
      })
      .select('id')
      .single();
    if (error) {
      console.log(`  "${cat}": RECHAZADA (correcto si es inválida)`);
    } else {
      console.log(`  "${cat}": ACEPTADA`);
      await admin.from('financial_transactions').delete().eq('id', data.id);
    }
  }

  // 5. Verificar estado final
  console.log('\n--- 5. Estado final ---');
  const { data: finalProjects } = await admin.from('projects').select('id, code, user_id');
  const withUser = (finalProjects ?? []).filter(p => p.user_id);
  console.log(`  Proyectos con user_id: ${withUser.length}/${finalProjects?.length ?? 0}`);
}

main().catch(e => { console.error(e); process.exit(1); });
