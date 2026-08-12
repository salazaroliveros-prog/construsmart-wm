import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ENV, assertSupabaseEnv } from '@/lib/supabase/env';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIG } from '@/lib/auth/rateLimit';

assertSupabaseEnv('Session API');

export const runtime = 'nodejs';

// Lista de orígenes permitidos para CSRF protection
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

function isOriginAllowed(origin: string | null): boolean {
  // Si no hay origin, verificar si es same-origin request (referer mismo dominio)
  if (!origin) {
    return true; // Permitir requests sin origin (same-origin)
  }
  
  // Normalizar origin para comparación exacta
  const normalizedOrigin = origin.trim().toLowerCase();
  
  // Lista dinámica de orígenes permitidos
  const allowedOrigins = new Set(ALLOWED_ORIGINS);
  
  // Agregar el origen del sitio en producción si está configurado
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim();
    allowedOrigins.add(siteUrl);
  }
  
  // Comparación exacta (no usar endsWith para evitar ataques como evil.com/allowed.com)
  return Array.from(allowedOrigins).some(allowed => {
    const normalizedAllowed = allowed.trim().toLowerCase();
    return normalizedAllowed === normalizedOrigin;
  });
}

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIG.session);
    
    if (!rateLimitResult.success) {
      console.warn('[Session] Rate limit exceeded for IP:', clientIP);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    // Validación CSRF: verificar origin
    const origin = request.headers.get('origin');
    
    if (!isOriginAllowed(origin)) {
      console.error('[Session] Origin not allowed:', origin);
      return NextResponse.json(
        { success: false, error: 'Origen no permitido', origin, allowedOrigins: Array.from(new Set(ALLOWED_ORIGINS)) },
        { status: 403 }
      );
    }

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

    // Solo log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] setSession error=', error?.message || 'null', 'user=', data.user?.email || 'null');
    }

    if (error || !data.session) {
      return NextResponse.json(
        { success: false, error: error?.message || 'No se pudo establecer la sesión' },
        { status: 401 }
      );
    }

    // CORRECCIÓN DE SEGURIDAD: No exponer tokens en headers HTTP
    // Los tokens se gestionan a través de cookies HTTPS-only del cliente Supabase
    const response = NextResponse.json({ success: true, user: data.user });
    
    // Set CORS headers para orígenes permitidos
    response.headers.set('Access-Control-Allow-Origin', origin || '');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '10');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// OPTIONS para preflight CORS
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { success: false, error: 'Origen no permitido' },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Access-Control-Allow-Origin', origin || '');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
  
  return response;
}
