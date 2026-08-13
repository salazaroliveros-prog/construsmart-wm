'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'bottom-right';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
};

const bgBorders: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info: 'border-cyan-500/30 bg-cyan-500/10',
};

export function ToastProvider({ children, position = 'bottom-right' }: { children: React.ReactNode; position?: ToastPosition }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const positionClass = position === 'bottom-right' ? 'bottom-4 right-4' : 'top-4 right-4';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`fixed ${positionClass} z-[100] flex flex-col gap-2 pointer-events-none`}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto glass-panel rounded-xl px-4 py-3 border ${bgBorders[toast.type]} max-w-sm animate-slide-up shadow-xl`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.title}</p>
                {toast.message && <p className="text-xs text-white/60 mt-0.5">{toast.message}</p>}
              </div>
              <button type="button" aria-label="Cerrar notificación" onClick={() => removeToast(toast.id)} className="flex-shrink-0 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
