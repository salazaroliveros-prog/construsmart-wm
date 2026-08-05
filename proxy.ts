// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Middleware para proteger rutas y verificar autenticación por sesión de
// Supabase. Refresca/lee la cookie de sesión y redirige al login si no hay
// usuario autenticado.
// ============================================================================

import { updateSession } from '@/lib/proxy'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  console.log('[Proxy] path=', request.nextUrl.pathname, 'cookies=', request.cookies.getAll().map(c => c.name).join(',') || '(none)');
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - public folder, assets, icons, logo.png (archivos estáticos)
     * - sw.js / manifest.json (service worker PWA)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/.*|assets/.*|icons/.*|logo\\.png|sw\\.js|manifest\\.json).*)',
  ],
};
