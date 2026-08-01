import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validación estricta de variables de entorno en build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window === 'undefined') {
  // Server-side: validar que existan
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas. ' +
      'Configúralas en tu archivo .env o en el panel de Vercel.'
    );
  }
}

// Client-side: crear cliente solo si las variables están presentes
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
