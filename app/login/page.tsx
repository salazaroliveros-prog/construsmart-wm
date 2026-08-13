'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Mail, Lock, ArrowRight, AlertCircle, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/Toast';
import PrimaryButton from '@/components/ui/PrimaryButton';
import zxcvbn from 'zxcvbn';
import { getSafeRedirectPath } from '@/lib/auth/validation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; warning?: string } | null>(null);

  // Validar fortaleza de password con zxcvbn
  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordStrength(null);
      return true;
    }
    
    const result = zxcvbn(pwd);
    setPasswordStrength({
      score: result.score,
      warning: result.feedback.warning
    });
    
    // Score 0-4 (4 = muy fuerte). Aceptamos scores >= 2
    return result.score >= 2;
  };

  // Verificar si hay error de autorización en la URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError('Acceso no autorizado. Solo el administrador puede acceder al sistema.');
      showToast('error', 'Acceso no autorizado');
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar fortaleza de password antes de enviar
    if (!validatePassword(password)) {
      setError('La contraseña es muy débil. Por favor usa una contraseña más fuerte.');
      showToast('error', 'Contraseña muy débil');
      return;
    }
    
    setLoading(true);

    try {
      await signIn(email, password);
      showToast('success', 'Inicio de sesión exitoso');
      // Navegar a la ruta original (si es válida e interna) o al dashboard
      const next = getSafeRedirectPath(searchParams.get('next'));
      router.replace(next);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      showToast('error', err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="glass-panel rounded-3xl p-8 sm:p-12 w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            CONSTRUCTORA WM/M&S
          </h1>
          <p className="text-cyan-400 text-xs sm:text-sm italic">
            "CONSTRUYENDO EL FUTURO"
          </p>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg mb-6">
          <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <p className="text-violet-400 text-sm">
            Acceso exclusivo para administrador
          </p>
        </div>

        {/* Info Message */}
        <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-6">
          <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <p className="text-cyan-400 text-sm">
            Sesión persistente. No pedirá login hasta que cierre sesión.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salazaroliveros@gmail.com"
                autoComplete="email"
                spellCheck={false}
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/60 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-[border-color,box-shadow,background-color]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/60 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-[border-color,box-shadow,background-color]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordStrength && password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-[width,background-color] duration-300 ${
                        passwordStrength.score >= 4 ? 'bg-emerald-500' :
                        passwordStrength.score >= 3 ? 'bg-cyan-500' :
                        passwordStrength.score >= 2 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                    />
                  </div>
                  <span className={`text-xs ${
                    passwordStrength.score >= 4 ? 'text-emerald-400' :
                    passwordStrength.score >= 3 ? 'text-cyan-400' :
                    passwordStrength.score >= 2 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {passwordStrength.score >= 4 ? 'Muy fuerte' :
                     passwordStrength.score >= 3 ? 'Fuerte' :
                     passwordStrength.score >= 2 ? 'Aceptable' :
                     'Muy débil'}
                  </span>
                </div>
                {passwordStrength.warning && (
                  <p className="text-white/60 text-xs">{passwordStrength.warning}</p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div role="alert" aria-live="polite" className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <PrimaryButton
            type="submit"
            fullWidth
            isLoading={loading}
            icon={!loading ? <ArrowRight className="w-5 h-5" /> : undefined}
          >
            Iniciar Sesión
          </PrimaryButton>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Sistema de Gestión de Proyectos
          </p>
          <p className="text-white/30 text-xs mt-1">
            CONSTRUCTORA WM/M&S © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-white">Cargando...</div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
}
