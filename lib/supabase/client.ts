import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ENV, assertSupabaseEnv } from './env';

assertSupabaseEnv('Supabase Client');

function createAuthStorage() {
  if (typeof window === 'undefined') return undefined;

  return {
    getItem: (key: string) => {
      const item = localStorage.getItem(key);
      if (!item) return null;

      try {
        const parsed = JSON.parse(item);
        if (parsed.expires_at && Date.now() >= parsed.expires_at * 1000) {
          localStorage.removeItem(key);
          return null;
        }
      } catch {
        // ignore parse errors and return the raw item
      }

      return item;
    },
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
  };
}

export const supabase: SupabaseClient | null = SUPABASE_ENV.url && SUPABASE_ENV.anonKey
  ? createClient(SUPABASE_ENV.url, SUPABASE_ENV.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: createAuthStorage(),
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
