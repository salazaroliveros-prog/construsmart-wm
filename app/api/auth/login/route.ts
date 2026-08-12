import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ENV, assertSupabaseEnv } from '@/lib/supabase/env';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/auth/rateLimit';

assertSupabaseEnv('Login API');

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Rate limiting check for login attempts
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIG.login);
    
    if (!rateLimitResult.success) {
      console.warn('[Login] Rate limit exceeded for IP:', clientIP);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiados intentos de inicio de sesión. Por favor espera unos minutos antes de intentar nuevamente.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ 
      success: true, 
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }
    });
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error interno';
    console.error('[Login] Error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}