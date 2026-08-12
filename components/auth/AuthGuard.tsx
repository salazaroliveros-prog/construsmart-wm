'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { getAdminEmail } from '@/lib/config/app.config';
import { isAdminUser, getSafeRedirectPath } from '@/lib/auth/validation';

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
      if (isAuthenticated && isAdminUser(user?.email || '', adminEmail)) {
        const next = typeof window !== 'undefined'
          ? getSafeRedirectPath(new URLSearchParams(window.location.search).get('next'))
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

    if (!isAdminUser(user.email, adminEmail)) {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/80 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si es ruta pública o está autenticado, mostrar children
  const publicPaths = ['/login'];
  if (publicPaths.some(path => pathname.startsWith(path)) || (isAuthenticated && isAdminUser(user?.email || '', adminEmail))) {
    return <>{children}</>;
  }

  // Si no está autenticado y no es ruta pública, no mostrar nada (redirección en progreso)
  return null;
}
