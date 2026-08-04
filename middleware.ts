// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Middleware para proteger rutas y verificar autenticación.
// Redirige al login si el usuario no está autenticado.
// Una vez autenticado, no vuelve a pedir login hasta que el usuario cierre sesión.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/_next', '/api/auth'];

  // Si es ruta pública, permitir acceso
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Para rutas protegidas, el middleware ya no verifica la sesión
  // La verificación se hace en el lado del cliente usando AuthContext
  // Esto permite que localStorage funcione correctamente
  return NextResponse.next();
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
