import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * CONSTRUCTORA WM/M&S - SUPABASE SERVER CLIENT
 * "CONSTRUYENDO EL FUTURO"
 *
 * Cliente seguro para Server Components, Server Actions y Route Handlers.
 * Usa cookies de Next.js para gestionar la sesión de Supabase (SSR).
 * Requiere variables de entorno:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Si se llama desde un Server Component, solo se puede leer
          // (la sesión se persistirá en el siguiente render/Server Action).
        }
      },
    },
  });
}