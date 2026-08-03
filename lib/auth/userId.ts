// ============================================================================
// USER ID HELPER FOR TENANT ISOLATION
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Helper para obtener el user_id del usuario autenticado para incluirlo
// en todas las operaciones CRUD para tenencia por auth.uid()
// ============================================================================

import { supabase } from '@/lib/supabase/client';

/**
 * Obtiene el user_id del usuario autenticado actualmente.
 * Retorna null si no hay usuario autenticado.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Obtiene el user_id del usuario autenticado actualmente (síncrono).
 * Retorna null si no hay usuario autenticado o si el user no está en caché.
 * Use esta versión solo si tienes certeza de que el usuario está autenticado.
 */
export function getCurrentUserIdSync(): string | null {
  try {
    const { data: { user } } = supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user sync:', error);
    return null;
  }
}
