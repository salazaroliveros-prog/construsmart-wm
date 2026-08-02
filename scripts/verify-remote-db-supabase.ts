/**
 * CONSTRUCTORA WM/M&S - VERIFICACIÓN REMOTA SUPABASE
 * "CONSTRUYENDO EL FUTURO"
 *
 * Uso:
 *   npx tsx scripts/verify-remote-db-supabase.ts
 *
 * Requiere:
 *   - .env con SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_*)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno desde .env
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno para Supabase.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('Proyecto:', SUPABASE_URL);

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
  ] as const;

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`${table}: ${count ?? 0}${error ? ` (error=${error.message})` : ''}`);
  }
}

main();