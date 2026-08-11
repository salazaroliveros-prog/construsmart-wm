'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserAvatar: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
    // Verificar sesión activa al montar
    const checkSession = async () => {
      try {
        if (!supabase) {
          console.warn('Supabase no configurado - modo offline');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const userName = data.session.user.email?.split('@')[0] || 'Usuario';

        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: userName,
        });
        setIsAuthenticated(true);
      } catch (error) {
        // CORRECCIÓN: Mejorar manejo de errores con recuperación específica
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthContext] Error al verificar sesión:', error);
        }
        
        // Diferenciar tipos de error
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Si es error de red, no hacer logout inmediatamente
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AuthContext] Error de red detectado, manteniendo sesión local');
          }
          // No hacer logout en errores de red temporales
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Para errores de auth u otros, hacer logout
          if (supabase) {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios de autenticación
    if (supabase) {
      const client = supabase; // Capturar referencia no-null para callbacks
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // Usar el email como nombre de usuario (sin depender de tabla profiles)
            const userName = session.user.email?.split('@')[0] || 'Usuario';
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: userName,
            });
            setIsAuthenticated(true);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. No se puede autenticar.');
    }

    try {
      // Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] Attempting sign in for:', email);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthContext] Sign in error:', error);
        }
        throw new Error(error.message || 'Credenciales inválidas');
      }

      if (data.user && data.session) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] Sign in successful for:', data.user.email);
        }

        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });

          const result = await response.json();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthContext] session sync status=', response.status, 'result=', result);
          }

          if (!response.ok || !result.success) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[AuthContext] Session cookie sync failed:', result.error);
            }
            throw new Error(result.error || 'No se pudo sincronizar la sesión en el servidor');
          }
        } catch (sessionError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[AuthContext] Session sync error:', sessionError);
          }
          throw new Error('Error al sincronizar la sesión. Intenta nuevamente.');
        }

        const userName = data.user.email?.split('@')[0] || 'Usuario';

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: userName,
        });
        setIsAuthenticated(true);
        console.log('[AuthContext] isAuthenticated set to true');
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthContext] Sign in failed:', error);
      }
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthContext] Error al cerrar sesión:', error);
      }
      // Forzar cierre local incluso si hay error
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const getUserAvatar = () => {
    if (!user) {
      return 'https://ui-avatars.com/api/?name=User&background=0D8BC&color=fff&size=128';
    }

    const email = user.email;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const hash = btoa(normalizedEmail).replace(/=+$/, '');
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&size=128`;
    }

    return 'https://ui-avatars.com/api/?name=User&background=0D8BC&color=fff&size=128';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, signIn, signOut, getUserAvatar }}>
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