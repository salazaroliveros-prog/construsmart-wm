import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'salazaroliveros@gmail.com';

// Las tablas se eliminan respetando el orden de las llaves foráneas (hijos primero).
const TABLES = [
  'purchase_order_items',
  'purchase_orders',
  'budget_items',
  'budgets',
  'financial_transactions',
  'payroll_employees',
  'payroll_records',
  'warehouse_stock',
  'project_logs',
  'clients',
  'suppliers',
  'projects',
];

// Límite simple en memoria para mitigar abuso de fuerza bruta desde la misma instancia.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function DELETE(request: Request) {
  // 1. Autenticación real por sesión (cookie), NO por encabezado controlable por el cliente.
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ success: false, error: 'Configuración de autenticación inválida' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`${user.id}:${clientIp}`)) {
    return NextResponse.json({ success: false, error: 'Demasiadas solicitudes, intente más tarde' }, { status: 429 });
  }

  // 2. Verificación de rol de administrador de forma autoritativa en el servidor.
  if ((user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    console.error('[Database Cleaner] Acceso denegado para:', user.email);
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  // 3. El cliente de administración (service role) solo se usa después del gate anterior.
  const adminClient = createSupabaseAdminClient();

  for (const table of TABLES) {
    try {
      const { data: rows, error: selectError } = await adminClient
        .from(table)
        .select('id');

      if (selectError) {
        if (selectError.code === 'PGRST116' || selectError.message.includes('does not exist')) {
          continue;
        }
        console.error('[Database Cleaner] Error seleccionando tabla:', table, selectError);
        return NextResponse.json({ success: false, error: 'Error al limpiar la base de datos', table }, { status: 500 });
      }

      if (rows && rows.length > 0) {
        const ids = rows.map(row => row.id);
        const { error: deleteError } = await adminClient
          .from(table)
          .delete()
          .in('id', ids);

        if (deleteError) {
          console.error('[Database Cleaner] Error eliminando de tabla:', table, deleteError);
          return NextResponse.json({ success: false, error: 'Error al limpiar la base de datos', table }, { status: 500 });
        }
      }
    } catch (err) {
      console.error('[Database Cleaner] Excepción en tabla:', table, err);
      return NextResponse.json({ success: false, error: 'Error al limpiar la base de datos', table }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}