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

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Usar el email como nombre de usuario (sin depender de tabla profiles)
          const userName = session.user.email?.split('@')[0] || 'Usuario';
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: userName,
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Credenciales inválidas');
      }

      if (data.user) {
        const userName = data.user.email?.split('@')[0] || 'Usuario';
        
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: userName,
        });
        setIsAuthenticated(true);
      }
    } catch (error: any) {
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
      console.error('Error al cerrar sesión:', error);
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