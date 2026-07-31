'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import DualBrandHeader from '@/components/dashboard/DualBrandHeader';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import AuthGuard from '@/components/auth/AuthGuard';
import { offlineDB } from '@/lib/db/offlineStore';
import { useScrollLock } from '@/lib/hooks/useScrollLock';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';

// Dynamic imports for code splitting
const ProjectManager = dynamic(() => import('@/components/dashboard/ProjectManager'), { ssr: false });
const BudgetCalculator = dynamic(() => import('@/components/budgets/BudgetCalculator'), { ssr: false });
const FinanceManager = dynamic(() => import('@/components/finances/FinanceManager'), { ssr: false });
const PayrollManager = dynamic(() => import('@/components/payroll/PayrollManager'), { ssr: false });
const WarehouseManager = dynamic(() => import('@/components/warehouse/WarehouseManager'), { ssr: false });
const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), { ssr: false });
const ClientManager = dynamic(() => import('@/components/crm/ClientManager'), { ssr: false });
const ProjectLogManager = dynamic(() => import('@/components/project/ProjectLogManager'), { ssr: false });
const InteractiveCalendar = dynamic(() => import('@/components/dashboard/InteractiveCalendar'), { ssr: false });
const SupplierManager = dynamic(() => import('@/components/warehouse/SupplierManager'), { ssr: false });
const PurchaseOrderManager = dynamic(() => import('@/components/warehouse/PurchaseOrderManager'), { ssr: false });
const ProgressTracker = dynamic(() => import('@/components/progress/ProgressTracker'), { ssr: false });
const SettingsManager = dynamic(() => import('@/components/settings/SettingsManager'), { ssr: false });

// Navigation tabs configuration
const NAVIGATION_TABS = [
  { id: 'dashboard', label: 'Tablero Principal', icon: 'LayoutDashboard' },
  { id: 'projects', label: 'Proyectos', icon: 'FolderKanban' },
  { id: 'budgets', label: 'Presupuestos', icon: 'Calculator' },
  { id: 'progress', label: 'Control de Avance', icon: 'Activity' },
  { id: 'finances', label: 'Finanzas', icon: 'DollarSign' },
  { id: 'payroll', label: 'Nómina', icon: 'Users' },
  { id: 'warehouse', label: 'Almacén', icon: 'Warehouse' },
  { id: 'suppliers', label: 'Proveedores', icon: 'Truck' },
  { id: 'orders', label: 'Órdenes de Compra', icon: 'ShoppingCart' },
  { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
  { id: 'clients', label: 'Clientes', icon: 'Users' },
  { id: 'logs', label: 'Bitácora', icon: 'BookOpen' },
  { id: 'settings', label: 'Ajustes', icon: 'Settings' },
] as const;

interface RecentActivity {
  id: string;
  text: string;
  time: string;
  color: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Use scroll lock for mobile menu
  useScrollLock(isMobileMenuOpen && isMobile);

  useEffect(() => {
    setIsMounted(true);
    loadRecentActivity();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadRecentActivity = async () => {
    try {
      const [transactions, projects] = await Promise.all([
        offlineDB.financialTransactions.toArray(),
        offlineDB.projects.toArray(),
      ]);

      const activities: RecentActivity[] = [];

      transactions.slice(0, 3).forEach(t => {
        activities.push({
          id: `tx-${t.id}`,
          text: t.description || `${t.type === 'income' ? 'Ingreso' : 'Gasto'} registrado`,
          time: t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('es-GT') : '',
          color: t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500',
        });
      });

      projects.slice(0, 3).forEach(p => {
        activities.push({
          id: `proj-${p.id}`,
          text: `Proyecto: ${p.name}`,
          time: p.status === 'execution' ? 'En ejecución' : p.status,
          color: 'bg-cyan-500',
        });
      });

      setRecentActivity(
        activities.sort(() => Math.random() - 0.5).slice(0, 4)
      );
    } catch {
      setRecentActivity([]);
    }
  };

  // Realtime refresh: actualiza la actividad reciente cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['financial_transactions', 'projects'], loadRecentActivity);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 w-full">
              <ProjectOverview />
              
              <InteractiveCalendar />
              
              <div className="glass-panel rounded-2xl p-3 sm:p-4">
                <h2 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">
                  Matriz de Costos Residenciales (GTQ)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="glass-card p-2 sm:p-3 rounded-xl border-l-4 border-l-blue-500">
                    <h3 className="text-blue-400 font-semibold mb-1 text-xs sm:text-sm">Nivel Básico</h3>
                    <p className="text-base sm:text-xl font-bold text-white mb-0.5">Q. 3,000 - Q. 3,500</p>
                    <p className="text-[10px] sm:text-xs text-white/60">por m²</p>
                    <p className="text-[9px] sm:text-[10px] text-white/40 mt-1">Acabados económicos</p>
                  </div>
                  <div className="glass-card p-2 sm:p-3 rounded-xl border-l-4 border-l-emerald-500">
                    <h3 className="text-emerald-400 font-semibold mb-1 text-xs sm:text-sm">Nivel Moderado</h3>
                    <p className="text-base sm:text-xl font-bold text-white mb-0.5">Q. 3,500 - Q. 4,000</p>
                    <p className="text-[10px] sm:text-xs text-white/60">por m²</p>
                    <p className="text-[9px] sm:text-[10px] text-white/40 mt-1">Calidad media</p>
                  </div>
                  <div className="glass-card p-2 sm:p-3 rounded-xl border-l-4 border-l-violet-500">
                    <h3 className="text-violet-400 font-semibold mb-1 text-xs sm:text-sm">Nivel Premium</h3>
                    <p className="text-base sm:text-xl font-bold text-white mb-0.5">Q. 4,000 - Q. 5,000</p>
                    <p className="text-[10px] sm:text-xs text-white/60">por m²</p>
                    <p className="text-[9px] sm:text-[10px] text-white/40 mt-1">Alta gama</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'projects':
        return <ProjectManager />;
      case 'budgets':
        return <BudgetCalculator />;
      case 'progress':
        return <ProgressTracker />;
      case 'finances':
        return <FinanceManager />;
      case 'payroll':
        return <PayrollManager />;
      case 'warehouse':
        return <WarehouseManager />;
      case 'suppliers':
        return <SupplierManager />;
      case 'orders':
        return <PurchaseOrderManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'clients':
        return <ClientManager />;
      case 'logs':
        return <ProjectLogManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return null;
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <DualBrandHeader />

        {isMounted && isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-20 left-3 sm:left-4 z-[45] p-2.5 sm:p-3 rounded-lg glass-button"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          </button>
        )}

        {isMounted && !isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="fixed top-24 left-4 z-[45] w-8 h-8 rounded-lg glass-button items-center justify-center transition-all hover:scale-110"
            aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            aria-expanded={!isSidebarCollapsed}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5 text-white" /> : <ChevronLeft className="w-5 h-5 text-white" />}
          </button>
        )}

        {isMounted && isMobile && isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex flex-1 overflow-hidden relative">
          <aside
            className={`sidebar-container fixed lg:relative flex-shrink-0 h-full lg:block transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? 'open w-64' : '-left-64 lg:-left-64'
            } ${!isMobile && isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
            style={{ zIndex: 40 }}
            aria-label="Menú lateral de navegación"
          >
            <DashboardNav activeTab={activeTab} onTabChange={(tab) => {
              setActiveTab(tab);
              setIsMobileMenuOpen(false);
            }} isCollapsed={isSidebarCollapsed} />
          </aside>

          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 main-content pt-20 sm:pt-24 lg:pt-6 transition-all duration-300 w-full" id="main-content" role="main" aria-label="Contenido principal">
            <div className="w-full space-y-4 sm:space-y-6">
              <nav className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1" aria-label="Navegación de pestañas">
                {NAVIGATION_TABS.map(tab => {
                  const isTabActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm ${
                        isTabActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                          : 'text-gray-400 hover:text-white border border-transparent'
                      }`}
                      aria-current={isTabActive ? 'page' : undefined}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}