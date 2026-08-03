'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si está cargando, no hacer nada
    if (loading) return;

    // Rutas públicas que no requieren autenticación
    const publicPaths = ['/login'];

    // Si es ruta pública, permitir acceso
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated || !user) {
      console.log('[AuthGuard] No authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Verificar que el usuario sea el administrador autorizado
    if (user.email !== ADMIN_EMAIL) {
      console.log('[AuthGuard] Unauthorized user:', user.email);
      router.push('/login?error=unauthorized');
      return;
    }

    console.log('[AuthGuard] Access granted for:', user.email);
  }, [user, loading, isAuthenticated, pathname, router]);

  // Si está cargando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Si es ruta pública o está autenticado, mostrar children
  const publicPaths = ['/login'];
  if (publicPaths.some(path => pathname.startsWith(path)) || (isAuthenticated && user?.email === ADMIN_EMAIL)) {
    return <>{children}</>;
  }

  // Si no está autenticado y no es ruta pública, no mostrar nada (redirección en progreso)
  return null;
}
