// ============================================================================
// USER SCOPE HELPER FOR LOCAL (DEXIE) READS
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Alinea las lecturas locales con el aislamiento por auth.uid() que aplica el
// RLS en Supabase: filtra las filas locales por el user_id autenticado.
// Se usa con un guard `!row.user_id || row.user_id === uid` para no ocultar
// filas heredadas sin user_id (legacy) ni las de la propia sesión.
// ============================================================================

import { getCurrentUserId } from '@/lib/auth/userId';

/**
 * Obtiene el user_id autenticado para filtrar lecturas locales.
 * Retorna null si no hay sesión (en ese caso NO se filtra).
 */
export async function getUserScope(): Promise<string | null> {
  return getCurrentUserId();
}

/**
 * Filtra una lista de filas locales por el user_id autenticado.
 * - Retorna todas las filas si no hay sesión.
 * - Mantiene filas legacy sin user_id y las de la propia sesión.
 * - Oculta filas de otros usuarios.
 */
export function scopeLocalRows<T extends { user_id?: string | null }>(
  rows: T[],
  userId: string | null | undefined
): T[] {
  if (!userId) return rows;
  return rows.filter((row) => !row.user_id || row.user_id === userId);
}
