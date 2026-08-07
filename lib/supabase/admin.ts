import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ENV, assertSupabaseEnv } from './env';

assertSupabaseEnv('Supabase Admin Client');

export function createSupabaseAdminClient(): SupabaseClient {
  if (!SUPABASE_ENV.secretKey) {
    throw new Error(
      'Supabase Admin Client: falta SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(SUPABASE_ENV.url, SUPABASE_ENV.secretKey);
}
