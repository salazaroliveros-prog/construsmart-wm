'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { authLogger } from '@/lib/utils/logger';
import { retryNetworkOperation } from '@/lib/utils/retry';
import { initializeDeviceValidation, isNewDevice, trustDevice } from '@/lib/auth/deviceValidation';
import { createInactivityTimeout } from '@/lib/auth/inactivityTimeout';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isNewDevice: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserAvatar: () => string;
  trustCurrentDevice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isNewDeviceFlag, setIsNewDeviceFlag] = useState(false);
  const router = useRouter();
  const inactivityTimeoutRef = useRef<any>(null);

  // Función de logout separada para ser usada por timeout
  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setIsAuthenticated(false);
      authLogger.info('Sesión cerrada');
    } catch (error) {
      authLogger.error('Error al cerrar sesión');
      // Forzar cierre local incluso si hay error
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Inicializar validación de dispositivo
    const deviceId = initializeDeviceValidation();
    setCurrentDeviceId(deviceId);
    setIsNewDeviceFlag(isNewDevice(deviceId));
    
    // Inicializar timeout de inactividad
    const timeoutMinutes = parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES || '30', 10);
    const warningMinutes = parseInt(process.env.INACTIVITY_WARNING_MINUTES || '5', 10);
    
    const inactivityTimeout = createInactivityTimeout({
      timeoutMs: timeoutMinutes * 60 * 1000,
      warningMs: warningMinutes * 60 * 1000,
      onTimeout: () => {
        authLogger.warn('Timeout de inactividad alcanzado, cerrando sesión');
        handleLogout();
        router.push('/login?reason=timeout');
      },
      onWarning: () => {
        authLogger.warn('Advertencia de inactividad: sesión expirará pronto');
      },
    });
    
    inactivityTimeout.start();
    inactivityTimeoutRef.current = inactivityTimeout;
    
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
        authLogger.error('Error al verificar sesión', { userId: user?.id });
        
        // Diferenciar tipos de error
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Si es error de red, no hacer logout inmediatamente
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
          authLogger.warn('Error de red detectado, manteniendo sesión local');
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

    // Cleanup function for inactivity timeout
    return () => {
      if (inactivityTimeoutRef.current) {
        inactivityTimeoutRef.current.stop();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. No se puede autenticar.');
    }

    try {
      authLogger.debug('Intentando inicio de sesión', { email });
      
      // Usar endpoint con rate limiting para login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok || !loginResult.success) {
        authLogger.error('Login API error', { status: loginResponse.status, error: loginResult.error });
        throw new Error(loginResult.error || 'Credenciales inválidas');
      }

      // Sincronizar sesión con Supabase client
      const { data, error } = await supabase.auth.setSession({
        access_token: loginResult.session.access_token,
        refresh_token: loginResult.session.refresh_token,
      });

      if (error || !data.session) {
        authLogger.error('Error de sincronización de sesión', { error });
        throw new Error('Error al sincronizar la sesión. Intenta nuevamente.');
      }

      authLogger.info('Inicio de sesión exitoso', { userId: data.user?.id });

      try {
        // Use retry with backoff for session sync to handle network issues
        const result = await retryNetworkOperation(async () => {
          if (!data.session) {
            throw new Error('No session available');
          }
          
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          return response.json();
        }, 3); // 3 retries for session sync

        authLogger.debug('Estado de sincronización de sesión', { success: result.success });

        if (!result.success) {
          authLogger.error('Falló sincronización de cookie de sesión', { error: result.error });
          throw new Error(result.error || 'No se pudo sincronizar la sesión en el servidor');
        }
      } catch (sessionError) {
        authLogger.error('Error de sincronización de sesión', { error: sessionError });
        throw new Error('Error al sincronizar la sesión. Intenta nuevamente.');
      }

      const userName = data.user?.email?.split('@')[0] || 'Usuario';

      setUser({
        id: data.user?.id || '',
        email: data.user?.email || '',
        name: userName,
      });
      setIsAuthenticated(true);
      authLogger.info('Estado de autenticación establecido en true');
    } catch (error: any) {
      authLogger.error('Falló inicio de sesión', { email, error: error.message });
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
      authLogger.info('Sesión cerrada exitosamente');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      authLogger.error('Error al cerrar sesión');
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

  const trustCurrentDevice = () => {
    if (currentDeviceId) {
      trustDevice(currentDeviceId);
      setIsNewDeviceFlag(false);
      authLogger.info('Dispositivo marcado como confiable', { deviceId: currentDeviceId });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isNewDevice: isNewDeviceFlag, signIn, signOut, getUserAvatar, trustCurrentDevice }}>
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