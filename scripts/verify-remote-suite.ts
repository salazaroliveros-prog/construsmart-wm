/**
 * CONSTRUCTORA WM/M&S - VERIFICACIÓN COMPLETA BD REMOTA
 * "CONSTRUYENDO EL FUTURO"
 *
 * Verifica:
 *  1) Existencia y estado del usuario administrador (service-role)
 *  2) Existencia y conteo de las tablas principales de la suite
 *  3) Existencia de la tabla user_settings (migración de backup remoto)
 *
 * Uso:
 *   npx tsx scripts/verify-remote-suite.ts
 *
 * Requiere SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY en .env
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar .env (aquí vive el service-role). No sobrescribe variables ya presentes.
dotenv.config({ path: '.env' });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
const headers = { Authorization: `Bearer ${SECRET_KEY}`, apikey: SECRET_KEY };

async function checkAdmin() {
  console.log('\n=== 1. USUARIO ADMINISTRADOR ===');
  const resp = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`,
    { headers: headers as Record<string, string> }
  );
  const json = await resp.json();
  const users = json?.users ?? json ?? [];
  const user = users[0];

  if (!user?.id) {
    console.log(`❌ NO existe el usuario admin (${ADMIN_EMAIL}).`);
    console.log('   Debe crearse desde el Dashboard de Supabase > Authentication > Add user.');
    return;
  }

  console.log(`✅ Email:            ${user.email}`);
  console.log(`   ID:               ${user.id}`);
  console.log(`   Email confirmado: ${user.email_confirmed_at ?? 'NO'}`);
  console.log(`   Cuenta confirmada:${user.confirmed_at ?? 'NO'}`);
  console.log(`   Último login:     ${user.last_sign_in_at ?? 'NUNCA'}`);
  console.log(`   Creado:           ${user.created_at}`);
}

async function checkTables() {
  const tables = [
    'projects',
    'budgets',
    'budget_items',
    'financial_transactions',
    'payroll_employees',
    'payroll_records',
    'warehouse_stock',
    'clients',
    'project_logs',
    'suppliers',
    'purchase_orders',
    'purchase_order_items',
    'subcontractors',
    'user_settings',
  ];

  console.log('\n=== 2. TABLAS DE LA SUITE ===');
  for (const table of tables) {
    const { count, error } = await admin
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${table.padEnd(24)} NO EXISTE (${error.message})`);
    } else {
      console.log(`✅ ${table.padEnd(24)} ${count ?? 0} registros`);
    }
  }
}

async function main() {
  console.log('Proyecto:', SUPABASE_URL.replace(/^https:\/\//, ''));
  await checkAdmin();
  await checkTables();
  console.log('\n=== VERIFICACIÓN COMPLETA ===');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
