'use client';

import { useState, useEffect } from 'react';
import { Database, Trash2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth/auth-context';

export default function DatabaseCleaner() {
  const { user, isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const isAdmin = user.email === ADMIN_EMAIL;
      setIsAuthorized(isAdmin);
      if (!isAdmin) {
        showToast('error', 'No tienes permisos para acceder a esta página');
      }
    }
  }, [user, isAuthenticated, loading, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8">
          <p className="text-white text-lg">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h1>
          <p className="text-white/70 mb-6">
            No tienes permisos para acceder a esta página. Solo el administrador puede acceder.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg glass-button text-white"
          >
            Volver al Dashboard
          </a>
        </div>
      </div>
    );
  }

  const clearDatabase = async () => {
    if (!confirm('⚠️ ¿Está seguro de eliminar TODOS los datos locales?\n\nEsta acción:\n- Eliminará todos los proyectos\n- Eliminará todos los presupuestos\n- Eliminará todas las transacciones\n- Eliminará toda la nómina\n- Eliminará todo el inventario\n\nLa base de datos se recreará automáticamente con el nuevo schema.\n\nEsta acción NO se puede deshacer.')) {
      return;
    }

    setIsClearing(true);

    try {
      // Eliminar la base de datos IndexedDB
      const deleteRequest = indexedDB.deleteDatabase('ConstructoraWM_OfflineDB');

      // También limpiar datos de sesión antiguos de auth
      localStorage.removeItem('localUser');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('wm_auth_session');
      localStorage.removeItem('wm_auth_hash');
      localStorage.removeItem('wm_presupuesto_activo');

      deleteRequest.onsuccess = () => {
        console.log('✅ Base de datos eliminada exitosamente');
        setCleared(true);
        showToast('success', 'Base de datos local eliminada. Recargando...');
        setTimeout(() => {
          location.reload();
        }, 1500);
      };

      deleteRequest.onerror = () => {
        console.error('❌ Error al eliminar la base de datos');
        showToast('error', 'Error al eliminar la base de datos');
        setIsClearing(false);
      };

      deleteRequest.onblocked = () => {
        console.warn('⚠️ Eliminación bloqueada - cierre otras pestañas');
        showToast('error', 'Cierre otras pestañas de la aplicación e intente nuevamente');
        setIsClearing(false);
      };
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error inesperado al limpiar la base de datos');
      setIsClearing(false);
    }
  };

  const checkDatabase = () => {
    const request = indexedDB.open('ConstructoraWM_OfflineDB');

    request.onsuccess = () => {
      const db = request.result;
      const objectStores = Array.from(db.objectStoreNames);
      showToast('success', `Base de datos encontrada con ${objectStores.length} tablas`);
      db.close();
    };

    request.onerror = () => {
      showToast('error', 'No se pudo abrir la base de datos');
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Limpieza de Base de Datos Local
            </h1>
          </div>

          <div className="space-y-6">
            {/* Information Card */}
            <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Información Importante</h3>
                  <p className="text-white/70 text-sm">
                    Esta herramienta elimina TODOS los datos almacenados localmente en IndexedDB.
                    Después de la limpieza, la base de datos se recreará automáticamente con el
                    nuevo schema (versión 2) que incluye campos actualizados como <code className="bg-white/10 px-1 py-0.5 rounded">updated_at</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* What Gets Deleted */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Datos que se eliminarán:</h3>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Proyectos (projects)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Presupuestos (budgets)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Items de Presupuesto (budget_items)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Transacciones Financieras (financial_transactions)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Empleados (payroll_employees)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Registros de Nómina (payroll_records)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Inventario (warehouse_stock)
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={checkDatabase}
                className="glass-button px-4 py-3 rounded-lg text-white flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Verificar Base de Datos
              </button>

              <button
                onClick={clearDatabase}
                disabled={isClearing || cleared}
                className="flex-1 px-4 py-3 rounded-lg text-white flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Limpiando...
                  </>
                ) : cleared ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Eliminado
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar Todos los Datos
                  </>
                )}
              </button>
            </div>

            {/* Success Message */}
            {cleared && (
              <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-white font-semibold">Base de Datos Eliminada</h3>
                    <p className="text-white/70 text-sm">
                      La página se recargará automáticamente para recrear la base de datos con el nuevo schema.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Dashboard */}
            <div className="pt-4 border-t border-white/10">
              <a
                href="/"
                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2"
              >
                ← Volver al Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
