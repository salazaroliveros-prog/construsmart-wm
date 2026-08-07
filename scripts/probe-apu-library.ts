/**
 * SONDA DE TIPO Y PERMISOS - apu_library / pending_deletes / user_settings
 *
 * Confirma en el REMOTO:
 *  1) El tipo real de la columna `id` de apu_library (uuid vs text) — clave para
 *     saber si el seed populate_apu_library.sql (ids 'res-001') aplica tal cual.
 *  2) Que service-role puede insertar/borrar en las 3 tablas (probes temporales).
 *
 * Uso: npx tsx scripts/probe-apu-library.ts
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const U = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const K = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!U || !K) { console.error('Faltan claves .env'); process.exit(1); }

const admin = createClient(U, K, { auth: { persistSession: false } });
const ADMIN_ID = 'ef818cc0-3599-48f0-905d-6be4c8cf05e8';

async function fetchOpenApi() {
  console.log('=== ESQUEMA OPENAPI (tipos reales) ===');
  try {
    const res = await fetch(`${U}/rest/v1/`, {
      headers: {
        apikey: K,
        Authorization: `Bearer ${K}`,
        Accept: 'application/openapi+json',
      },
    });
    if (!res.ok) {
      console.log(`OpenAPI HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return;
    }
    const json: any = await res.json();
    const schemas = json?.components?.schemas ?? {};
    for (const t of ['apu_library', 'pending_deletes', 'user_settings']) {
      const s = schemas[t];
      if (!s) { console.log(`- ${t}: sin esquema en OpenAPI`); continue; }
      const cols = s.properties ?? {};
      console.log(`- ${t}:`);
      for (const [name, c] of Object.entries(cols) as [string, any][]) {
        console.log(`    ${name.padEnd(24)} ${c.type ?? '?'}${c.format ? ` (${c.format})` : ''}${c.enum ? ` enum=${JSON.stringify(c.enum).slice(0,80)}` : ''}`);
      }
    }
  } catch (e) {
    console.log('OpenAPI falló:', (e as Error).message);
  }
}

async function probeApuLibrary() {
  console.log('\n=== apu_library: ¿id es uuid o text? ===');
  const base = {
    code: 'PROBE_X1', typology: 'residential', chronological_order: 99999,
    description: 'fila sonda', unit: 'm²', category: 'probe', sync_status: 'synced',
  };
  // Intento 1: id textual no-uuid
  const p1 = await admin.from('apu_library').insert({ id: 'probe-col', ...base });
  if (!p1.error) {
    console.log('id textual OK -> la columna id NO es uuid (acepta strings).');
    await admin.from('apu_library').delete().eq('code', 'PROBE_X1');
  } else {
    console.log('id textual -> error:', p1.error.message);
    if (/uuid/i.test(p1.error.message)) {
      console.log('=> id es UUID en el remoto.');
      const p2 = await admin.from('apu_library').insert({
        id: crypto.randomUUID(), ...base,
      });
      if (p2.error) console.log('insert con uuid falló:', p2.error.message);
      else {
        console.log('=> insert con uuid OK. Columnas devueltas:');
        const row: any = p2.data?.[0] ?? {};
        for (const [name, val] of Object.entries(row)) console.log(`    ${name.padEnd(24)} ${typeof val === 'object' ? JSON.stringify(val).slice(0,60) : String(val)}`);
        await admin.from('apu_library').delete().eq('code', 'PROBE_X1');
      }
    } else {
      console.log('Otro tipo de error:', p1.error.message);
    }
  }
}

async function probePendingDeletes() {
  console.log('\n=== pending_deletes: insert/delete probe ===');
  const ins = await admin.from('pending_deletes').insert({ table_name: 'probe', server_id: 'probe-col' }).select();
  if (ins.error) { console.log('insert falló:', ins.error.message); return; }
  console.log('insert OK, fila:', JSON.stringify(ins.data?.[0]));
  const del = await admin.from('pending_deletes').delete().eq('server_id', 'probe-col');
  if (del.error) console.log('delete falló:', del.error.message);
  else console.log('delete OK, filas:', del.count ?? 'n/a');
}

async function probeUserSettings() {
  console.log('\n=== user_settings: upsert probe (user_id del admin) ===');
  const payload = {
    user_id: ADMIN_ID,
    settings: { probe: true, ui: { language: 'es' } },
    updated_at: new Date().toISOString(),
  };
  const up = await admin.from('user_settings').upsert(payload, { onConflict: 'user_id' }).select();
  if (up.error) { console.log('upsert falló:', up.error.message); return; }
  console.log('upsert OK, fila:', JSON.stringify(up.data?.[0]));
  const sel = await admin.from('user_settings').select('user_id, settings, logo_url, updated_at').eq('user_id', ADMIN_ID).maybeSingle();
  console.log('select OK:', JSON.stringify(sel.data));
  // Dejar la fila sonda (settings {probe}) -> la siembra real la sobrescribirá.
}

async function main() {
  console.log('Proyecto:', U.replace(/^https:\/\//, ''));
  await fetchOpenApi();
  await probeApuLibrary();
  await probePendingDeletes();
  await probeUserSettings();
  console.log('\n=== SONDA COMPLETA ===');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
