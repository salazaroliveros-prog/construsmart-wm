import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
const TABLES = [
  'purchase_order_items',
  'purchase_orders',
  'budget_items',
  'budgets',
  'financial_transactions',
  'payroll_records',
  'warehouse_stock',
  'project_logs',
  'clients',
  'suppliers',
  'projects',
];

export async function DELETE() {
  try {
    const authSupabase = await createSupabaseServerClient();
    const {
      data: { session },
      error: sessionError,
    } = await authSupabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 401 });
    }

    const email = session?.user?.email;
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();

    for (const table of TABLES) {
      const { error } = await supabase.from(table).delete().neq('id', '');
      if (error) {
        return NextResponse.json({ success: false, error: error.message, table }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
