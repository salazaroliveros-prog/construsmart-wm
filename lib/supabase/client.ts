import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validación estricta de variables de entorno en build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (typeof window === 'undefined') {
  // Server-side: validar que existan
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas. ' +
      'Configúralas en tu archivo .env o en el panel de Vercel.'
    );
  }
}

// Client-side: crear cliente con configuración estándar
// Supabase maneja las cookies automáticamente con localStorage por defecto
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
  console.log('[Supabase][Client] inicializado=', !!supabase, 'url=', !!supabaseUrl, 'key=', !!supabaseAnonKey);
}
