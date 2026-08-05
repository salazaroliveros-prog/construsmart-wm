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
    console.log('[AuthGuard] loading=', loading, 'isAuthenticated=', isAuthenticated, 'user=', user?.email || 'null', 'pathname=', pathname);
    if (loading) return;

    const publicPaths = ['/login'];

    if (publicPaths.some(path => pathname.startsWith(path))) {
      if (isAuthenticated && user?.email === ADMIN_EMAIL) {
        console.log('[AuthGuard] already authenticated on public route, navigating to /');
        router.replace('/');
      }
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('[AuthGuard] No authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (user.email.toLowerCase() !== ADMIN_EMAIL) {
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
