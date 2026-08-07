'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { getAdminEmail } from '@/lib/config/app.config';

// Valida que la ruta de destino sea interna (evita open-redirect).
const getSafeNextPath = (next?: string | null): string => {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/';
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const adminEmail = getAdminEmail();

  useEffect(() => {
    console.log('[AuthGuard] loading=', loading, 'isAuthenticated=', isAuthenticated, 'user=', user?.email || 'null', 'pathname=', pathname, 'admin=', adminEmail);
    if (loading) return;

    const publicPaths = ['/login'];

    if (publicPaths.some(path => pathname.startsWith(path))) {
      if (isAuthenticated && user?.email === adminEmail) {
        const next = typeof window !== 'undefined'
          ? getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
          : '/';
        console.log('[AuthGuard] already authenticated on public route, navigating to', next);
        router.replace(next);
      }
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('[AuthGuard] No authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
      console.log('[AuthGuard] Unauthorized user:', user.email);
      router.push('/login?error=unauthorized');
      return;
    }

    console.log('[AuthGuard] Access granted for:', user.email);
  }, [user, loading, isAuthenticated, pathname, router, adminEmail]);

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
  if (publicPaths.some(path => pathname.startsWith(path)) || (isAuthenticated && user?.email === adminEmail)) {
    return <>{children}</>;
  }

  // Si no está autenticado y no es ruta pública, no mostrar nada (redirección en progreso)
  return null;
}
