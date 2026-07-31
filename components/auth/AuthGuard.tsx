'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isSupabaseConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If Supabase is not configured, allow access (offline mode)
    if (!isSupabaseConfigured) {
      return;
    }

    // If Supabase is configured but user is not logged in, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, isSupabaseConfigured, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Allow access if Supabase is not configured (offline mode)
  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  // Require login if Supabase is configured
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
