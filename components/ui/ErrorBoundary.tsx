'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default function ErrorBoundary({ children, fallback }: Props) {
  const [state, setState] = useState<State>({ hasError: false, error: null });

  if (state.hasError) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Algo salió mal</h3>
                <p className="text-white/60 text-sm">Se produjo un error inesperado</p>
              </div>
            </div>
            <details className="mb-4">
              <summary className="text-white/40 text-xs cursor-pointer mb-2">Detalles técnicos</summary>
              <pre className="text-xs text-red-300 bg-red-500/10 p-3 rounded-lg overflow-auto max-h-32">
                {state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => setState({ hasError: false, error: null })}
              className="w-full px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    );
  }

  return (
    <ErrorCatcher onError={(error) => setState({ hasError: true, error })}>
      {children}
    </ErrorCatcher>
  );
}

function ErrorCatcher({ children, onError }: { children: ReactNode; onError: (error: Error) => void }) {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      event.preventDefault();
      onError(event.error);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, [onError]);

  return <>{children}</>;
}
