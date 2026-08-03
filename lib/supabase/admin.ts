import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'Las variables de entorno SUPABASE_URL y SUPABASE_SECRET_KEY son requeridas para el cliente de administración de Supabase.'
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey);
}
