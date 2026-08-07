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
