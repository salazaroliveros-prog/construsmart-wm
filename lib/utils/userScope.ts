// ============================================================================
// USER SCOPE HELPER FOR LOCAL (DEXIE) READS
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Alinea las lecturas locales con el aislamiento por auth.uid() que aplica el
// RLS en Supabase: filtra las filas locales por el user_id autenticado.
// CORRECCIÓN DE SEGURIDAD: Eliminado fallback de datos legacy sin user_id
// para mayor seguridad y consistencia con RLS actualizado.
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
 * - CORREGIDO: Solo filas con user_id del usuario actual (eliminado fallback legacy)
 * - Oculta filas de otros usuarios y filas sin user_id.
 */
export function scopeLocalRows<T extends { user_id?: string | null }>(
  rows: T[],
  userId: string | null | undefined
): T[] {
  if (!userId) return rows;
  return rows.filter((row) => row.user_id === userId);
}
