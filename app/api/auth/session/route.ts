import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ENV, assertSupabaseEnv } from '@/lib/supabase/env';

assertSupabaseEnv('Session API');

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { success: false, error: 'Faltan tokens de sesión' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      SUPABASE_ENV.url,
      SUPABASE_ENV.anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    console.log('[Session] setSession error=', error?.message || 'null', 'user=', data.user?.email || 'null');

    if (error || !data.session) {
      return NextResponse.json(
        { success: false, error: error?.message || 'No se pudo establecer la sesión' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, user: data.user });
    response.headers.set('x-auth-access-token', access_token);
    response.headers.set('x-auth-refresh-token', refresh_token);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error interno' },
      { status: 500 }
    );
  }
}

export const GET = POST;
