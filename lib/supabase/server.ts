// ============================================================================
// SUPABASE SERVER CLIENT
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Cliente de Supabase para usar en Server Actions y componentes de servidor.
// Este cliente incluye el user_id automáticamente para tenencia por auth.uid()
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crea un cliente de Supabase para usar en el servidor (Server Actions, RSC, etc.)
 * Incluye automáticamente el user_id para tenencia por auth.uid()
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

/**
 * Obtiene el user_id del usuario autenticado en el servidor
 * Retorna null si no hay usuario autenticado
 */
export async function getServerUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting server user:', error);
    return null;
  }
  
  return user?.id || null;
}

/**
 * Helper para verificar si el usuario está autenticado en el servidor
 * Lanza un error si no está autenticado
 */
export async function requireServerAuth(): Promise<string> {
  const userId = await getServerUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
}
