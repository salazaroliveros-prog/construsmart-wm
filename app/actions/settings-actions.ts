'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, requireServerAuth } from '@/lib/supabase/server';
import { UISettingsSchema } from '@/lib/types/uiSettings';
import { z } from 'zod';

export type SaveUserSettingsInput = z.infer<typeof UISettingsSchema>;

export async function saveUserSettings(settings: unknown) {
  try {
    const userId = await requireServerAuth();
    const parsed = UISettingsSchema.parse(settings);

    const supabase = await createSupabaseServerClient();
    const payload = {
      user_id: userId,
      settings: parsed,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.issues.map((e) => e.message).join(', ')
      : err instanceof Error
        ? err.message
        : 'Error al guardar la configuración';
    return { success: false, error: message };
  }
}

export async function loadUserSettings() {
  try {
    const userId = await requireServerAuth();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { settings: null, error: error.message };
    }

    return { settings: data?.settings ?? null, error: null };
  } catch (err) {
    return {
      settings: null,
      error: err instanceof Error ? err.message : 'Error al cargar la configuración',
    };
  }
}

export async function uploadUserLogo(formData: FormData) {
  try {
    const userId = await requireServerAuth();
    const file = formData.get('file') as File | null;

    if (!file) {
      return { success: false, error: 'Archivo vacío', url: null, path: null };
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de archivo no permitido. Usa PNG, JPG, WEBP o SVG.', url: null, path: null };
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'El logo no debe superar 2MB.', url: null, path: null };
    }

    const supabase = await createSupabaseServerClient();
    const extension = file.name.split('.').pop() || 'bin';
    const path = `logos/${userId}/${Date.now()}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message, url: null, path: null };
    }

    const { data: publicData } = supabase.storage
      .from('logos')
      .getPublicUrl(path);

    return { success: true, error: null, url: publicData.publicUrl, path };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al subir el logo',
      url: null,
      path: null,
    };
  }
}

export async function deleteUserLogo(storagePath: string) {
  try {
    const userId = await requireServerAuth();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.storage.from('logos').remove([storagePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase
      .from('user_settings')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar el logo',
    };
  }
}

export type DiagnosticSuggestion = {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action: string; // instructivo concreto paso a paso
  canAutoFix?: boolean;
  autoFixLabel?: string;
};

export type RemoteDiagnosticsResult = {
  success: boolean;
  data?: {
    admin: { email: string; exists: boolean; confirmed: boolean; lastSignIn?: string | null };
    checks: { label: string; ok: boolean; detail?: string }[];
    suggestions: DiagnosticSuggestion[];
    summary: { total: number; ok: number; failed: number };
    timestamp: string;
  };
  error?: string;
};

export async function runRemoteDatabaseDiagnostics(): Promise<RemoteDiagnosticsResult> {
  const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
  const checks: { label: string; ok: boolean; detail?: string }[] = [];
  const suggestions: DiagnosticSuggestion[] = [];

  try {
    await requireServerAuth();

    const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
    const admin = createSupabaseAdminClient();

    let adminConfirmed = false;
    let adminExists = false;
    let user: { email?: string; email_confirmed_at?: string | null; last_sign_in_at?: string | null } | undefined;

    try {
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 100 });
      user = users?.find((u) => u.email === ADMIN_EMAIL);
      adminExists = !!user;
      adminConfirmed = !!user?.email_confirmed_at;
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : 'Error de autenticación';
      suggestions.push({
        severity: 'critical',
        title: 'No se pudo consultar Supabase Auth',
        description: msg,
        action:
          '1. Confirma que el proyecto apunta a la BD remota (yibjsruoxjlgdnkgylld.supabase.co).\n' +
          '2. Verifica que la variable SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL sea correcta en Vercel.\n' +
          '3. Si el error persiste, revisa si la cuenta aún tiene acceso al proyecto Supabase.',
      });
    }

    checks.push({
      label: `Usuario administrador (${ADMIN_EMAIL})`,
      ok: adminExists,
      detail: adminExists
        ? `Confirmado: ${adminConfirmed ? 'sí' : 'no'} | Último login: ${user?.last_sign_in_at ?? 'nunca'}`
        : 'No encontrado en Supabase Auth',
    });

    if (!adminExists) {
      suggestions.push({
        severity: 'critical',
        title: 'El usuario administrador no existe',
        description: `No se encontró ${ADMIN_EMAIL} en Supabase Auth. Sin él no es posible iniciar sesión.`,
        action:
          'En el Dashboard de Supabase → Authentication → Users → "Add user", crea un usuario con:\n' +
          `  Email: ${ADMIN_EMAIL}\n` +
          '  Password: define una segura y guárdala.\n' +
          'Luego vuelve a ejecutar este diagnóstico.',
        canAutoFix: true,
        autoFixLabel: 'Crear usuario admin',
      });
    } else if (!adminConfirmed) {
      suggestions.push({
        severity: 'warning',
        title: 'El email del administrador no está confirmado',
        description: 'El usuario existe pero el email no fue confirmado, lo que puede impedir el login.',
        action:
          'En Supabase Dashboard → Authentication → Users, selecciona el usuario y usa "Confirm user".\n' +
          'O vuelve a enviar el correo de confirmación desde Users → más opciones.',
        canAutoFix: true,
        autoFixLabel: 'Confirmar email del admin',
      });
    }

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

    const missingTables: string[] = [];
    for (const table of tables) {
      const { count, error } = await admin
        .from(table)
        .select('*', { count: 'exact', head: true });

      checks.push({
        label: `Tabla: ${table}`,
        ok: !error,
        detail: error ? error.message : `${count ?? 0} registros`,
      });

      if (error) missingTables.push(table);
    }

    if (missingTables.length > 0) {
      suggestions.push({
        severity: 'critical',
        title: 'Faltan tablas en la base de datos',
        description: `No existen estas tablas: ${missingTables.join(', ')}. La suite requiere todo el esquema.`,
        action:
          'Estas tablas las crea el esquema SQL del proyecto (carpeta supabase/migrations o scripts/).\n' +
          '1. Aplica las migraciones pendientes desde Supabase Dashboard → SQL Editor.\n' +
          '2. O ejecuta el script de inicialización del repo.\n' +
          '3. Vuelve a ejecutar el diagnóstico.',
      });
    }

    const summary = {
      total: checks.length,
      ok: checks.filter((c) => c.ok).length,
      failed: checks.filter((c) => !c.ok).length,
    };

    if (summary.failed === 0) {
      suggestions.push({
        severity: 'info',
        title: 'Todo en orden',
        description: 'No se detectaron problemas en la base de datos remota.',
        action: 'No se requiere ninguna acción. La suite está lista para usarse.',
      });
    }

    return {
      success: true,
      data: {
        admin: {
          email: ADMIN_EMAIL,
          exists: adminExists,
          confirmed: adminConfirmed,
          lastSignIn: user?.last_sign_in_at,
        },
        checks,
        suggestions,
        summary,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error ejecutando diagnóstico',
    };
  }
}


