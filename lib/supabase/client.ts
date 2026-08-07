import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ENV, assertSupabaseEnv } from './env';

assertSupabaseEnv('Supabase Client');

export const supabase: SupabaseClient | null = SUPABASE_ENV.url && SUPABASE_ENV.anonKey
  ? createClient(SUPABASE_ENV.url, SUPABASE_ENV.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;

// Diagnóstico: verificar inicialización del cliente en runtime
if (typeof window !== 'undefined') {
  console.log(
    '[Supabase][Client] inicializado=',
    !!supabase,
    'url=',
    !!SUPABASE_ENV.url,
    'key=',
    !!SUPABASE_ENV.anonKey
  );
}
