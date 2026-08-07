/**
 * VERIFICACIÓN DE ALINEACIÓN DE COLUMNAS - BD REMOTA vs LOCAL
 *
 * Fuente de verdad local: mirror pgdelta (supabase/database/schemas/public/tables/*.sql)
 * que refleja el esquema FINAL aplicado. Se complementa con:
 *   - add column de migraciones posteriores al mirror (ej. budget_item_id)
 *   - create table desde migraciones SOLO para tablas sin archivo mirror
 *   - renames (old→new) de migraciones: quita el nombre viejo
 *
 * Compara contra las columnas reales del remoto (fila de muestra; insert
 * temporal para tablas vacías).
 *
 * Uso: npx tsx scripts/verify-remote-cols.ts
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const U = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const K = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!U || !K) { console.error('Faltan claves .env'); process.exit(1); }
const admin = createClient(U, K, { auth: { persistSession: false } });

const TABLES = [
  'projects','budgets','budget_items','financial_transactions','payroll_employees',
  'payroll_records','warehouse_stock','clients','project_logs','suppliers',
  'purchase_orders','purchase_order_items','subcontractors','user_settings',
];

const Q = `["`+"`"+`]?`;

// Extrae columnas del cuerpo de CREATE TABLE (paréntesis balanceado).
function extractCreateCols(sql: string, table: string): string[] {
  const re = new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?(public\\.)?${Q}${table}${Q}\\s*\\(`,'i');
  const m = re.exec(sql);
  if (!m) return [];
  const start = m.index + m[0].length;
  let depth = 1, i = start;
  while (i < sql.length && depth > 0) {
    if (sql[i] === '(') depth++;
    else if (sql[i] === ')') depth--;
    i++;
  }
  const body = sql.slice(start, i - 1);
  const cols: string[] = [];
  for (const raw of body.split('\n')) {
    const t = raw.trim().replace(/,$/, '');
    if (!t) continue;
    if (/^(constraint|primary key|foreign key|unique|check|references|index|exclude)/i.test(t)) continue;
    const cm = t.match(new RegExp(`^${Q}(\\w+)${Q}\\s`));
    if (cm && !cols.includes(cm[1])) cols.push(cm[1]);
  }
  return cols;
}

// Aplica renames old→new de las migraciones a un set de columnas.
function applyRenames(cols: string[], table: string): void {
  const migDir = path.join(process.cwd(),'supabase','migrations');
  if (!fs.existsSync(migDir)) return;
  for (const f of fs.readdirSync(migDir).filter(f=>f.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(migDir,f),'utf-8');
    const re = new RegExp(
      `alter\\s+table\\s+(if\\s+exists\\s+)?(public\\.)?${Q}${table}${Q}\\s+rename\\s+column\\s+${Q}(\\w+)${Q}\\s+to\\s+${Q}(\\w+)${Q}`,'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql))) {
      const oldName = m[3], newName = m[4];
      const idx = cols.indexOf(oldName);
      if (idx >= 0) { cols.splice(idx, 1); }
      if (!cols.includes(newName)) cols.push(newName);
    }
  }
}

function loadExpected(table: string): string[] | null {
  const cols: string[] = [];
  const add = (c: string) => { if (c && !cols.includes(c)) cols.push(c); };
  const mirror = path.join(process.cwd(),'supabase','database','schemas','public','tables',`${table}.sql`);
  const hasMirror = fs.existsSync(mirror);
  if (hasMirror) extractCreateCols(fs.readFileSync(mirror,'utf-8'), table).forEach(add);

  const migDir = path.join(process.cwd(),'supabase','migrations');
  if (fs.existsSync(migDir)) {
    for (const f of fs.readdirSync(migDir).filter(f=>f.endsWith('.sql')).sort()) {
      const sql = fs.readFileSync(path.join(migDir,f),'utf-8');
      if (!hasMirror) extractCreateCols(sql, table).forEach(add); // tabla sin mirror: usar migraciones
      const addRe = new RegExp(
        `alter\\s+table\\s+(if\\s+exists\\s+)?(public\\.)?${Q}${table}${Q}\\s+add\\s+(?!constraint\\b)(column\\s+)?(if\\s+not\\s+exists\\s+)?${Q}(\\w+)${Q}`,'gi');
      let m: RegExpExecArray | null;
      while ((m = addRe.exec(sql))) add(m[5]);
    }
  }
  applyRenames(cols, table);
  return cols.length ? cols : null;
}

async function remoteCols(table: string): Promise<string[]> {
  const { data, error } = await admin.from(table).select('*').limit(1);
  if (data && data.length > 0) return Object.keys(data[0]);
  if (error && !/schema cache/i.test(error.message)) throw error;
  // user_settings no tiene id/created_at: usar user_id (FK auth.users) y settings
  const probe: Record<string, unknown> = table === 'user_settings'
    ? { user_id: 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', settings: { probe: true } }
    : { id: 'probe-col', created_at: new Date().toISOString(), sync_status: 'synced' };
  const ins = await admin.from(table).insert(probe).select('*');
  if (ins.error) throw ins.error;
  const cols = ins.data && ins.data.length ? Object.keys(ins.data[0]) : Object.keys(probe);
  if (table === 'user_settings') await admin.from(table).delete().eq('user_id', probe.user_id);
  else await admin.from(table).delete().eq('id', 'probe-col');
  return cols;
}

async function main() {
  console.log('Proyecto:', U.replace(/^https:\/\//,''));
  console.log('=== ALINEACIÓN DE COLUMNAS (local vs remoto) ===\n');
  let ok = 0, total = 0; const problems: string[] = [];
  for (const table of TABLES) {
    const exp = loadExpected(table);
    if (!exp) { console.log(`❌ ${table.padEnd(26)} sin definición local localizable`); problems.push(`[${table}] sin definición local`); continue; }
    let rem: string[];
    try { rem = await remoteCols(table); } catch(e) {
      console.log(`❌ ${table.padEnd(26)} ERROR: ${(e as Error).message}`);
      problems.push(`[${table}] ${(e as Error).message}`); continue;
    }
    const es = new Set(exp), rs = new Set(rem);
    const missing = exp.filter(c=>!rs.has(c));
    const extra = rem.filter(c=>!es.has(c));
    total++;
    if (!missing.length && !extra.length) {
      ok++;
      console.log(`✅ ${table.padEnd(26)} ${exp.length} cols alineadas (${rem.length} remoto)`);
    } else {
      console.log(`⚠️  ${table.padEnd(26)} local=${exp.length} remoto=${rem.length}`);
      if (missing.length) { console.log(`   FALTAN REMOTO: ${missing.join(', ')}`); problems.push(`[${table}] faltan remoto: ${missing.join(', ')}`); }
      if (extra.length) console.log(`   EXTRA REMOTO:  ${extra.join(', ')}`);
    }
  }
  console.log(`\n=== ${ok}/${total} tablas con columnas 100% alineadas ===`);
  if (problems.length) { console.log('\nPROBLEMAS:'); problems.forEach(p=>console.log(' - '+p)); process.exitCode=1; }
}
main().catch(e=>{ console.error('FATAL:', e); process.exit(1); });