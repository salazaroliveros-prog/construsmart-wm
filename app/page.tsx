'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import DualBrandHeader from '@/components/dashboard/DualBrandHeader';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import AuthGuard from '@/components/auth/AuthGuard';
import { offlineDB } from '@/lib/db/offlineStore';
import { useScrollLock } from '@/lib/hooks/useScrollLock';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';

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

const CONTENT_HEIGHT = 'calc(100vh - 4rem - 3.25rem)';

// Función para obtener el índice del tab actual
const getTabIndex = (tabId: string): number => {
  const index = NAVIGATION_TABS.findIndex(tab => tab.id === tabId);
  return index >= 0 ? index : 0;
};

// Función para obtener el tab por índice
const getTabById = (index: number): string => {
  return NAVIGATION_TABS[Math.max(0, Math.min(index, NAVIGATION_TABS.length - 1))]?.id || 'dashboard';
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(getTabIndex('dashboard'));

  useScrollLock(isMobileMenuOpen && isMobile);

  useEffect(() => {
    setIsMounted(true);
    loadRecentActivity();
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Actualizar tabIndex cuando cambie activeTab
  useEffect(() => {
    setTabIndex(getTabIndex(activeTab));
  }, [activeTab]);

useEffect(() => {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      const valid = NAVIGATION_TABS.some(t => t.id === tab);
      if (valid) {
        setActiveTab(tab as (typeof NAVIGATION_TABS)[number]['id']);
      }
    }
  } catch {
    // ignore malformed URL
  }
}, [isMounted]);

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

  useRealtimeRefresh(['financial_transactions', 'projects'], loadRecentActivity);

  // Gestos de swipe para navegación móvil (eventos touch nativos)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 50; // Mínimo desplazamiento horizontal para cambiar de tab

    // Solo activar swipe si el movimiento es principalmente horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      // Swipe izquierdo (siguiente tab)
      if (deltaX < 0) {
        const nextIndex = Math.min(tabIndex + 1, NAVIGATION_TABS.length - 1);
        const nextTab = getTabById(nextIndex);
        handleTabChange(nextTab);
      }
      // Swipe derecho (tab anterior)
      else {
        const prevIndex = Math.max(tabIndex - 1, 0);
        const prevTab = getTabById(prevIndex);
        handleTabChange(prevTab);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      setIsTabLoading(true);
      setActiveTab(tabId);
      setTabIndex(getTabIndex(tabId));
      setTimeout(() => setIsTabLoading(false), 150);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-3 h-full">
            {/* KPIs Full width - centrado */}
            <div className="w-full">
              <DashboardStats />
            </div>

            {/* Grid: Left (overview + activity) | Right (matrix + calendar) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
              {/* Left column */}
              <div className="flex flex-col gap-3">
                <div className="glass-panel rounded-xl p-2 md:p-3">
                  <ProjectOverview />
                </div>
                <div className="glass-panel rounded-xl p-3 md:p-3">
                  <h3 className="text-xs md:text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    Actividad Reciente
                  </h3>
                  <div className="space-y-1.5">
                    {recentActivity.length === 0 ? (
                      <p className="text-xs text-white/40">No hay actividad reciente</p>
                    ) : (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-2 py-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${activity.color}`} />
                          <span className="text-xs text-white/80 truncate">{activity.text}</span>
                          {activity.time && <span className="text-[9px] text-white/40 ml-auto">{activity.time}</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: charts + calendar */}
              <div className="flex flex-col gap-3">
                <DashboardCharts />
                <div className="flex-1">
                  <InteractiveCalendar />
                </div>
              </div>
            </div>
          </div>
        );
      case 'projects':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><ProjectManager /></div>;
      case 'budgets':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><BudgetCalculator /></div>;
      case 'progress':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><ProgressTracker /></div>;
      case 'finances':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><FinanceManager /></div>;
      case 'payroll':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><PayrollManager /></div>;
      case 'warehouse':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><WarehouseManager /></div>;
      case 'suppliers':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><SupplierManager /></div>;
      case 'orders':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><PurchaseOrderManager /></div>;
      case 'analytics':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><AnalyticsDashboard /></div>;
      case 'clients':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><ClientManager /></div>;
      case 'logs':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><ProjectLogManager /></div>;
      case 'settings':
        return isTabLoading ? <TabSkeleton /> : <div className="h-full"><SettingsManager /></div>;
      default:
        return null;
    }
  };

  // Componente skeleton para transiciones de tab
  const TabSkeleton = () => (
    <div className="h-full w-full">
      <div className="glass-panel rounded-xl p-4 h-full">
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
          <div className="h-32 bg-white/5 rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
        <DualBrandHeader />

        {/* Tab navigation - right below header, centered */}
        <nav className="flex-shrink-0 bg-slate-900/60 border-b border-white/10 overflow-x-auto overflow-anchor-none">
          <div className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5">
            {NAVIGATION_TABS.map(tab => {
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id !== activeTab) {
                      setIsTabLoading(true);
                      setActiveTab(tab.id);
                      // Ocultar skeleton después de un delay corto para permitir que el componente se monte
                      setTimeout(() => setIsTabLoading(false), 150);
                    }
                  }}
                  className={`px-4 sm:px-4 py-3 sm:py-1.5 min-h-[44px] rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm font-medium ${
                    isTabActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  aria-current={isTabActive ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main content area */}
        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <aside
            className={`sidebar-container fixed lg:relative flex-shrink-0 h-full lg:block transition-all duration-300 ease-in-out z-30 ${
              isMobileMenuOpen ? 'open w-64 left-0' : '-left-64 lg:left-0'
            } ${!isMobile && !isSidebarCollapsed ? 'lg:w-64' : 'lg:w-16'}`}
            aria-label="Menú lateral de navegación"
          >
            <DashboardNav activeTab={activeTab} onTabChange={(tab) => {
              setActiveTab(tab);
              setIsMobileMenuOpen(false);
            }} isCollapsed={isMobile ? true : isSidebarCollapsed} />
          </aside>

          {/* Mobile overlay */}
          {isMounted && isMobile && isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

        {/* Main content - full width con scroll libre y automático */}
        <main
          className={`flex-1 overflow-y-auto overflow-anchor-none transition-all duration-300 ${!isMobile && !isSidebarCollapsed ? 'lg:ml-64' : 'lg:ml-16'}`}
          style={{ height: 'calc(100vh - 4rem - 3.25rem)' }}
          id="main-content"
          role="main"
          aria-label="Contenido principal"
        >
          <div 
            className="w-full px-3 sm:px-4 py-1.5"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {renderTabContent()}
          </div>
        </main>
        </div>

        {/* Mobile menu button - bottom right, respetando safe areas */}
        {isMounted && isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-40 w-10 h-10 rounded-xl glass-button shadow-lg shadow-cyan-500/20 pb-safe"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        )}

        {/* Desktop sidebar toggle button */}
        {isMounted && !isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="fixed top-20 left-4 z-40 w-8 h-8 rounded-lg glass-button shadow-lg shadow-cyan-500/20 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-expanded={!isSidebarCollapsed}
          >
            <Menu className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </AuthGuard>
  );
}
