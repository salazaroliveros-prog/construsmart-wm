#!/usr/bin/env node
/**
 * CONSTRUCTORA WM/M&S - CRUD VERIFICATION SCRIPT
 * Slogan: "CONSTRUYENDO EL FUTURO"
 *
 * Verifies that the suite can CREATE, READ, UPDATE, and DELETE data
 * against the remote Supabase database via REST API.
 *
 * Usage:
 *   node scripts/verify-crud.js
 *
 * Requires .env with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const BASE = `${SUPABASE_URL}/rest/v1`;
const DETAILS = {
  projects: {
    body: {
      code: 'TEST-CRUD-' + Date.now(),
      name: 'Proyecto Verificación CRUD',
      client_name: 'Cliente CRUD',
      client_phone: '5555-1234',
      client_email: 'cliente@test.com',
      location: 'Guatemala',
      typology: 'residential',
      area_m2: 100,
      quality_level: 'premium',
      status: 'planning',
      start_date: new Date().toISOString().split('T')[0],
      estimated_end_date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      duration_days: 30,
      total_budget: 0,
      budget_total: 0,
      calculated_duration: 30,
      sync_status: 'synced',
    },
    read: 'select=code&code=eq.',
  },
  clients: {
    body: {
      code: 'CLI-TEST-' + Date.now(),
      name: 'Cliente Verificación CRUD',
      client_type: 'individual',
      phone: '5555-1234',
      email: 'cliente@test.com',
      sync_status: 'synced',
    },
    read: 'select=code&code=eq.',
  },
  suppliers: {
    body: {
      code: 'SUP-TEST-' + Date.now(),
      name: 'Proveedor Verificación CRUD',
      contact_person: 'Persona Contacto',
      phone: '5555-1234',
      email: 'proveedor@test.com',
      sync_status: 'synced',
    },
    read: 'select=code&code=eq.',
  },
};

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

let passed = 0;
let failed = 0;

function log(result) {
  if (result.ok) {
    passed++;
    console.log(`✅ ${result.message}`);
  } else {
    failed++;
    console.log(`❌ ${result.message}`);
  }
}

async function testCrud(table, config) {
  console.log(`\n📋 Table: ${table}`);

  // 1. READ - should return 0 (or existing records)
  try {
    const readRes = await fetch(`${BASE}/${table}?${config.read}`, { headers: headers() });
    if (readRes.status === 200) {
      const data = await readRes.json();
      log({ ok: true, message: `READ: Tabla accesible (${Array.isArray(data) ? data.length : '?'} registros)` });
    } else {
      log({ ok: false, message: `READ: HTTP ${readRes.status}` });
      return;
    }
  } catch (e) {
    log({ ok: false, message: `READ: Error ${e.message}` });
    return;
  }

  // 2. CREATE - insert test row
  let createdId = null;
  try {
    const createRes = await fetch(`${BASE}/${table}`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(config.body),
    });
    if (createRes.status === 201) {
      const created = await createRes.json();
      createdId = created[0]?.id || null;
      log({ ok: true, message: `CREATE: Registro creado (${createdId || 'id desconocido'})` });
    } else {
      const err = await createRes.text();
      log({ ok: false, message: `CREATE: HTTP ${createRes.status} - ${err.slice(0, 100)}` });
      return;
    }
  } catch (e) {
    log({ ok: false, message: `CREATE: Error ${e.message}` });
    return;
  }

  if (!createdId) {
    log({ ok: false, message: 'CREATE: No se obtuvo id' });
    return;
  }

  // 3. READ (after create) - verify the row exists
  try {
    const readRes = await fetch(`${BASE}/${table}?select=id&id=eq.${createdId}`, { headers: headers() });
    if (readRes.status === 200) {
      const data = await readRes.json();
      if (Array.isArray(data) && data.length > 0) {
        log({ ok: true, message: 'READ (post-create): Registro encontrado' });
      } else {
        log({ ok: false, message: 'READ (post-create): Registro no encontrado' });
      }
    } else {
      log({ ok: false, message: `READ (post-create): HTTP ${readRes.status}` });
    }
  } catch (e) {
    log({ ok: false, message: `READ (post-create): Error ${e.message}` });
  }

  // 4. UPDATE - modify the row
  try {
    const updateRes = await fetch(`${BASE}/${table}?id=eq.${createdId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ name: config.body.name + ' (MODIFICADO)' }),
    });
    if (updateRes.status === 204) {
      log({ ok: true, message: 'UPDATE: Registro modificado correctamente' });
    } else {
      const err = await updateRes.text();
      log({ ok: false, message: `UPDATE: HTTP ${updateRes.status} - ${err.slice(0, 100)}` });
    }
  } catch (e) {
    log({ ok: false, message: `UPDATE: Error ${e.message}` });
  }

  // 5. READ (after update) - verify modification
  try {
    const readRes = await fetch(`${BASE}/${table}?select=name&id=eq.${createdId}`, { headers: headers() });
    if (readRes.status === 200) {
      const data = await readRes.json();
      const updated = Array.isArray(data) && data.length > 0 && data[0].name?.includes('MODIFICADO');
      if (updated) {
        log({ ok: true, message: 'READ (post-update): Cambio verificado' });
      } else {
        log({ ok: false, message: 'READ (post-update): Cambio NO verificado' });
      }
    } else {
      log({ ok: false, message: `READ (post-update): HTTP ${readRes.status}` });
    }
  } catch (e) {
    log({ ok: false, message: `READ (post-update): Error ${e.message}` });
  }

  // 6. DELETE - remove the test row
  try {
    const deleteRes = await fetch(`${BASE}/${table}?id=eq.${createdId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (deleteRes.status === 204) {
      log({ ok: true, message: 'DELETE: Registro eliminado correctamente' });
    } else if (deleteRes.status === 200) {
      log({ ok: true, message: 'DELETE: Registro eliminado correctamente (200)' });
    } else {
      const err = await deleteRes.text();
      log({ ok: false, message: `DELETE: HTTP ${deleteRes.status} - ${err.slice(0, 100)}` });
    }
  } catch (e) {
    log({ ok: false, message: `DELETE: Error ${e.message}` });
  }

  // 7. READ (after delete) - verify deletion
  try {
    const readRes = await fetch(`${BASE}/${table}?select=id&id=eq.${createdId}`, { headers: headers() });
    if (readRes.status === 200) {
      const data = await readRes.json();
      if (Array.isArray(data) && data.length === 0) {
        log({ ok: true, message: 'READ (post-delete): Registro eliminado (no encontrado)' });
      } else {
        log({ ok: false, message: 'READ (post-delete): Registro aún existe' });
      }
    } else {
      log({ ok: false, message: `READ (post-delete): HTTP ${readRes.status}` });
    }
  } catch (e) {
    log({ ok: false, message: `READ (post-delete): Error ${e.message}` });
  }
}

async function main() {
  console.log('\n🧪 Verifying CRUD Operations against Remote Supabase\n');
  console.log('='.repeat(60));
  console.log(`📡 URL: ${SUPABASE_URL}`);
  console.log('='.repeat(60));

  for (const [table, config] of Object.entries(DETAILS)) {
    await testCrud(table, config);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Resumen: ${passed} checks pasaron, ${failed} fallaron`);

  if (failed > 0) {
    console.log('\n⚠️  Algunos checks fallaron. Revisa los detalles arriba.');
    process.exit(1);
  } else {
    console.log('\n✅ Todo el CRUD (Create, Read, Update, Delete) funciona correctamente.');
    process.exit(0);
  }
}

main();