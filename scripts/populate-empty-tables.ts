/**
 * CONSTRUCTORA WM/M&S - POBLAR TABLAS REMOTAS VACÍAS
 * "CONSTRUYENDO EL FUTURO"
 *
 * Verifica cuáles tablas tienen 0 registros y las puebla con datos de prueba
 * para que el frontend pueda validar que lee las rutas correctas:
 *   - user_settings : fila del admin con DEFAULT_UI_SETTINGS (upsert onConflict user_id)
 *   - apu_library   : seed de supabase/migrations/populate_apu_library.sql
 *
 * Uso: npx tsx scripts/populate-empty-tables.ts
 * Requiere SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY en .env
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { DEFAULT_UI_SETTINGS } from '../lib/types/uiSettings';

dotenv.config({ path: '.env' });

const U = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const K = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!U || !K) { console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env'); process.exit(1); }
const admin = createClient(U, K, { auth: { persistSession: false } });

const ADMIN_ID = 'ef818cc0-3599-48f0-905d-6be4c8cf05e8';

const ALL_TABLES = [
  'projects', 'budgets', 'budget_items', 'budget_item_breakdowns', 'financial_transactions',
  'payroll_employees', 'payroll_records', 'warehouse_stock', 'clients', 'project_logs',
  'suppliers', 'purchase_orders', 'purchase_order_items', 'subcontractors',
  'apu_library', 'pending_deletes', 'user_settings', 'profiles', 'notes',
];

async function countTable(table: string): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) {
    if (/schema cache|does not exist/i.test(error.message)) return -1;
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Parseo de populate_apu_library.sql (INSERTs con valores entre comillas simples)
// ---------------------------------------------------------------------------

function unquoteToken(token: string): unknown {
  const t = token.trim();
  if (/^NULL$/i.test(t)) return null;
  if (/^NOW\(\)$/i.test(t)) return new Date().toISOString();
  if (t.startsWith("'")) {
    const inner = t.slice(1, t.endsWith("'") ? -1 : undefined);
    return inner.replace(/''/g, "'");
  }
  const n = Number(t);
  return Number.isNaN(n) ? t : n;
}

// Devuelve [{ cols: string[], rows: string[][] }] para cada INSERT INTO apu_library
function extractInsertTuples(sql: string): { cols: string[]; rows: string[][] }[] {
  const out: { cols: string[]; rows: string[][] }[] = [];
  const re = /INSERT\s+INTO\s+apu_library\s*\(([^)]*)\)\s*VALUES\s*/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const cols = m[1].split(',').map((c) => c.trim().replace(/"/g, ''));
    const rest = sql.slice(m.index + m[0].length);
    const end = rest.indexOf(';');
    const body = end >= 0 ? rest.slice(0, end) : rest;

    const rows: string[][] = [];
    let i = 0;
    while (i < body.length) {
      // saltar hasta el siguiente '('
      while (i < body.length && body[i] !== '(') i++;
      if (i >= body.length) break;
      i++; // abrir tupla
      const tokens: string[] = [];
      let cur = '';
      let inStr = false;
      let depth = 0;
      let closed = false;
      for (; i < body.length; i++) {
        const ch = body[i];
        if (inStr) {
          cur += ch;
          if (ch === "'") {
            if (body[i + 1] === "'") { cur += "'"; i++; }
            else inStr = false;
          }
          continue;
        }
        if (ch === "'") { inStr = true; cur += ch; continue; }
        if (ch === '(') { depth++; cur += ch; continue; }
        if (ch === ')') {
          if (depth > 0) { depth--; cur += ch; continue; }
          tokens.push(cur.trim());
          closed = true;
          i++;
          break;
        }
        if (ch === ',' && depth === 0) { tokens.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      if (closed) rows.push(tokens);
    }
    out.push({ cols, rows });
  }
  return out;
}

async function populateApuLibrary(): Promise<number> {
  const current = await countTable('apu_library');
  if (current > 0) {
    console.log(`   apu_library ya tiene ${current} registros; se omite el seed.`);
    return current;
  }
  const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', 'populate_apu_library.sql');
  if (!fs.existsSync(sqlPath)) throw new Error(`No existe ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const blocks = extractInsertTuples(sql);
  if (!blocks.length) throw new Error('No se encontraron INSERT INTO apu_library');

  const rows: Record<string, unknown>[] = [];
  for (const block of blocks) {
    for (const tuple of block.rows) {
      const row: Record<string, unknown> = {};
      block.cols.forEach((col, idx) => {
        if (col === 'id') return; // dejar que el default (uuid/texto) lo asigne
        const raw = tuple[idx];
        if (raw === undefined) return;
        row[col] = unquoteToken(raw);
      });
      rows.push(row);
    }
  }

  // insert en lotes de 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await admin.from('apu_library').insert(batch);
    if (error) throw new Error(`apu_library batch ${i}: ${error.message}`);
  }
  console.log(`   apu_library: ${rows.length} filas insertadas.`);
  return rows.length;
}

async function populateUserSettings(): Promise<number> {
  const current = await countTable('user_settings');
  const payload = {
    user_id: ADMIN_ID,
    settings: DEFAULT_UI_SETTINGS,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from('user_settings').upsert(payload, { onConflict: 'user_id' });
  if (error) throw new Error(`user_settings upsert: ${error.message}`);
  const after = await countTable('user_settings');
  console.log(`   user_settings: ${current} -> ${after} filas (admin ${ADMIN_ID}).`);
  return after;
}

async function main() {
  console.log('Proyecto:', U.replace(/^https:\/\//, ''));
  console.log('\n=== TABLAS REMOTAS (conteos) ===');
  const empty: string[] = [];
  for (const table of ALL_TABLES) {
    const c = await countTable(table);
    if (c === -1) console.log(`❌ ${table.padEnd(26)} NO EXISTE`);
    else if (c === 0) { console.log(`⚠️  ${table.padEnd(26)} 0 registros`); empty.push(table); }
    else console.log(`✅ ${table.padEnd(26)} ${c} registros`);
  }

  console.log('\n=== POBLANDO TABLAS VACÍAS ===');
  const semeadas: string[] = [];
  if (empty.includes('user_settings')) {
    await populateUserSettings();
    semeadas.push('user_settings');
  }
  if (empty.includes('apu_library')) {
    await populateApuLibrary();
    semeadas.push('apu_library');
  }

  if (empty.includes('pending_deletes')) {
    // pending_deletes es una COLA de borrados pendientes: su estado correcto es 0 filas.
    // No se siembra artificialmente para no provocar intentos de borrado fantasma.
    console.log('   ⚠️  pending_deletes es una cola de trabajo (0 = sano); no se siembra.');
  }

  console.log('\n=== CONTEO FINAL ===');
  let okAll = true;
  for (const table of ALL_TABLES) {
    const c = await countTable(table);
    if (c === -1) { console.log(`❌ ${table.padEnd(26)} NO EXISTE`); okAll = false; }
    else if (c === 0) { console.log(`⚠️  ${table.padEnd(26)} 0 registros (cola de trabajo: pending_deletes)`); }
    else console.log(`✅ ${table.padEnd(26)} ${c} registros`);
  }

  console.log('\nResumen: sembradas =', semeadas.join(', ') || '(ninguna)');
  if (!okAll) process.exitCode = 1;
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
