import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
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

export async function DELETE(request: Request) {
  try {
    // Obtener el email del usuario desde el header (enviado por el cliente)
    const userEmail = request.headers.get('x-user-email');

    // Verificar que sea el administrador
    if (userEmail !== ADMIN_EMAIL) {
      console.log('[Database Cleaner] Unauthorized access attempt:', userEmail);
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    console.log('[Database Cleaner] Authorized user:', userEmail);

    const supabase = createSupabaseAdminClient();

    for (const table of TABLES) {
      console.log('[Database Cleaner] Processing table:', table);

      // Primero obtener todos los IDs de la tabla
      const { data: rows, error: selectError } = await supabase
        .from(table)
        .select('id');

      if (selectError) {
        console.error('[Database Cleaner] Error selecting from table:', table, selectError);
        // Si la tabla está vacía o no existe, continuar con la siguiente
        if (selectError.code === 'PGRST116' || selectError.message.includes('does not exist')) {
          console.log('[Database Cleaner] Table empty or does not exist, continuing:', table);
          continue;
        }
        return NextResponse.json({ success: false, error: selectError.message, table }, { status: 500 });
      }

      // Si hay filas, eliminarlas por ID
      if (rows && rows.length > 0) {
        const ids = rows.map(row => row.id);
        console.log(`[Database Cleaner] Deleting ${ids.length} rows from ${table}`);

        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', ids);

        if (deleteError) {
          console.error('[Database Cleaner] Error deleting from table:', table, deleteError);
          return NextResponse.json({ success: false, error: deleteError.message, table }, { status: 500 });
        }

        console.log(`[Database Cleaner] Successfully deleted ${ids.length} rows from ${table}`);
      } else {
        console.log(`[Database Cleaner] Table ${table} is already empty`);
      }
    }

    console.log('[Database Cleaner] All tables cleaned successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Database Cleaner] Unexpected error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
