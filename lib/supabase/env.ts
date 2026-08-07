// ============================================================================
// SUPABASE ENVIRONMENT RESOLVER
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Helper centralizado para resolver variables de entorno de Supabase.
// Evita divergencias entre capas (client/server/admin/proxy) y elimina
// aserciones `!` inseguras que pueden romper el ingreso en runtime.
// ============================================================================

type EnvResolver = {
  url: string;
  anonKey: string;
  secretKey?: string;
};

function resolveSupabaseEnv(): EnvResolver {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  // Canónica cliente: NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Compatibilidad legacy: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  // Service role / admin
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    undefined;

  return { url, anonKey, secretKey };
}

export const SUPABASE_ENV = resolveSupabaseEnv();

export function assertSupabaseEnv(label = 'Supabase'): void {
  if (!SUPABASE_ENV.url || !SUPABASE_ENV.anonKey) {
    throw new Error(
      `${label}: Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. ` +
        'Configúralas en .env/.env.local/.env.production o en Vercel.'
    );
  }
}
