'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ModuleErrorBoundaryProps {
  children: ReactNode;
  moduleName: string;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Module-specific Error Boundary
 * Provides contextual error handling for different application modules
 */
export class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, ModuleErrorBoundaryState> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error with module context
    console.error(`[ModuleErrorBoundary-${this.props.moduleName}] Error caught:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default module-specific error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Error en {this.props.moduleName}</h3>
                <p className="text-white/60 text-sm">Se produjo un error inesperado</p>
              </div>
            </div>

            <details className="mb-4">
              <summary className="text-white/40 text-xs cursor-pointer mb-2 hover:text-white/60 transition-colors">
                Ver detalles técnicos
              </summary>
              <div className="mt-2 space-y-2">
                <pre className="text-xs text-red-300 bg-red-500/10 p-3 rounded-lg overflow-auto max-h-32">
                  {this.state.error?.message}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-white/30 bg-white/5 p-3 rounded-lg overflow-auto max-h-20">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with module-specific error boundary
 */
export function withModuleErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  moduleName: string
) {
  return function WithModuleErrorBoundary(props: P) {
    return (
      <ModuleErrorBoundary moduleName={moduleName}>
        <Component {...props} />
      </ModuleErrorBoundary>
    );
  };
}

/**
 * Pre-configured error boundaries for common modules
 */
export const BudgetErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="Presupuestos" {...props} />
);

export const FinanceErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="Finanzas" {...props} />
);

export const WarehouseErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="Almacén" {...props} />
);

export const ProjectErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="Proyectos" {...props} />
);

export const PayrollErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="Nómina" {...props} />
);

export const CRMErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="CRM" {...props} />
);

export const AnalyticsErrorBoundary = (props: Omit<ModuleErrorBoundaryProps, 'moduleName'>) => (
  <ModuleErrorBoundary moduleName="Analíticas" {...props} />
);