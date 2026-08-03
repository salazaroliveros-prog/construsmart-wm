// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Middleware para proteger rutas y verificar autenticación.
// Redirige al login si el usuario no está autenticado.
// Una vez autenticado, no vuelve a pedir login hasta que el usuario cierre sesión.
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Crear cliente de Supabase para middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  // Verificar sesión activa
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/_next', '/api/auth'];

  // Si es ruta pública, permitir acceso
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return res;
  }

  // Si no hay sesión y no es ruta pública, redirigir al login
  if (!session) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Verificar que el usuario sea el administrador autorizado
  const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
  if (session.user.email !== ADMIN_EMAIL) {
    // Si no es el administrador, cerrar sesión y redirigir al login
    await supabase.auth.signOut();
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión válida y es el administrador, permitir acceso
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|manifest.json).*)',
  ],
};
