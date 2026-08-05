import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan variables.');
  process.exit(1);
}

async function main() {
  const secret = SUPABASE_SECRET_KEY || '';
  const headers = {
    'Authorization': `Bearer ${secret}`,
    'apikey': secret,
  } as Record<string, string>;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('Faltan variables.');
    process.exit(1);
  }
  console.log('--- Estado del usuario admin ---');
  const resp = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`,
    { headers }
  );
  const result = await resp.json();
  const users = result?.users ?? result ?? [];
  const user = users[0];
  if (!user?.id) {
    console.log('Usuario NO encontrado.');
    process.exit(0);
  }
  console.log(`Email: ${user.email}`);
  console.log(`ID: ${user.id}`);
  console.log(`Email confirmado: ${user.email_confirmed_at ?? 'NO'}`);
  console.log(`Cuenta confirmada: ${user.confirmed_at ?? 'NO'}`);
  console.log(`Último login: ${user.last_sign_in_at ?? 'NUNCA'}`);
  console.log(`Creado: ${user.created_at}`);

  if (!user.email_confirmed_at && !user.confirmed_at) {
    console.log('\nConfirmando email...');
    const patchHeaders = {
      ...headers,
      'Content-Type': 'application/json',
    };
    const patch = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
      {
        method: 'PUT',
        headers: patchHeaders,
        body: JSON.stringify({ email_confirm: true, confirmed_at: new Date().toISOString() }),
      }
    );
    const patchResult = await patch.json();
    console.log(`Resultado: ${JSON.stringify(patchResult)}`);
  }

  // 3. Probar login (solo si conocemos la contraseña; aquí solo diagnóstica)
  console.log('\n--- Diagnóstico de login ---');
  console.log('El usuario ya existe. Para probar el login:');
  console.log('1. Ir a /login');
  console.log('2. Ingresar el email y la contraseña que tenga configurada.');
  console.log('Si olvidó la contraseña, usar "Forgot password" o resetear desde Supabase Dashboard.');

  console.log('\n=== FIN ===');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
