'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserAvatar: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseConfigured = supabase !== null;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // If Supabase is not configured, allow offline mode
      setLoading(false);
      return;
    }

    // Supabase is configured, we can safely use it
    const client = supabase!;

    // Check active session
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isSupabaseConfigured]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Configure las variables de entorno.');
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const getUserAvatar = () => {
    if (!user) {
      // Fallback to generated avatar based on email
      return 'https://ui-avatars.com/api/?name=User&background=0D8BC&color=fff&size=128';
    }

    // Try to get avatar from user metadata
    const avatarUrl = user.user_metadata?.avatar_url;
    if (avatarUrl) return avatarUrl;

    // Try Gravatar based on email
    const email = user.email;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const hash = btoa(normalizedEmail).replace(/=+$/, '');
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&size=128`;
    }

    // Fallback to generated avatar
    return 'https://ui-avatars.com/api/?name=User&background=0D8BC&color=fff&size=128';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSupabaseConfigured, signIn, signOut, getUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
