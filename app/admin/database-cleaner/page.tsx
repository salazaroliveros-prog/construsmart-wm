'use client';

import { useState, useEffect } from 'react';
import { Database, Trash2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth/auth-context';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getAdminEmail } from '@/lib/config/app.config';
import SecondaryButton from '@/components/ui/SecondaryButton';
import DangerButton from '@/components/ui/DangerButton';

export default function DatabaseCleaner() {
  const { user, isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const adminEmail = getAdminEmail();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const isAdmin = user.email === adminEmail;
      setIsAuthorized(isAdmin);
      if (!isAdmin) {
        showToast('error', 'No tienes permisos para acceder a esta página');
      }
    }
  }, [user, isAuthenticated, loading, showToast, adminEmail]);

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
    setIsClearing(true);

    try {
      const response = await fetch('/api/admin/database-cleaner', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.error('Error al limpiar la base de datos remota:', result.error);
        showToast('error', `Error al limpiar la base remota: ${result.error || response.statusText}`);
        setIsClearing(false);
        return;
      }

      // Eliminar la base de datos IndexedDB
      const deleteRequest = indexedDB.deleteDatabase('ConstructoraWM_OfflineDB');

      // También limpiar datos de sesión antiguos de auth
      localStorage.removeItem('localUser');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('wm_auth_session');
      localStorage.removeItem('wm_auth_hash');
      localStorage.removeItem('wm_presupuesto_activo');

      deleteRequest.onsuccess = () => {
        console.log('✅ Base de datos local eliminada exitosamente');
        setCleared(true);
        showToast('success', 'Base remota y local eliminadas. Recargando...');
        setTimeout(() => {
          location.reload();
        }, 1500);
      };

      deleteRequest.onerror = () => {
        console.error('❌ Error al eliminar la base de datos local');
        showToast('error', 'Error al eliminar la base de datos local');
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
            <h1 className="text-xl sm:text-2xl font-bold text-white">
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
                  Clientes (clients)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Proveedores (suppliers)
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
                  Órdenes de Compra (purchase_orders)
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Items de Órdenes de Compra (purchase_order_items)
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
                <li className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Logs de Proyectos (project_logs)
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SecondaryButton
                onClick={checkDatabase}
                icon={<RefreshCw className="w-4 h-4" />}
                fullWidth
              >
                Verificar Base de Datos
              </SecondaryButton>

              <DangerButton
                onClick={() => setConfirmClear(true)}
                disabled={isClearing || cleared}
                fullWidth
                icon={
                  isClearing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : cleared ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )
                }
              >
                {isClearing ? 'Limpiando...' : cleared ? 'Eliminado' : 'Eliminar Todos los Datos'}
              </DangerButton>
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

      <ConfirmDialog
        isOpen={confirmClear}
        title="Eliminar todos los datos"
        message="¿Está seguro de eliminar TODOS los datos locales y remotos? Esta acción eliminará la base de datos local (IndexedDB) y la remota (Supabase). Esta acción NO se puede deshacer."
        confirmLabel="Eliminar Todo"
        variant="danger"
        onConfirm={() => {
          setConfirmClear(false);
          clearDatabase();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
