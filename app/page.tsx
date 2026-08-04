'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
import RealtimeProvider from '@/components/ui/RealtimeProvider';

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ready, setReady] = useState(false);
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

  // Sincronización bidireccional con la URL (?tab=...)
  const syncTabFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        const valid = NAVIGATION_TABS.some(t => t.id === tab);
        if (valid && tab !== activeTab) {
          setActiveTab(tab as (typeof NAVIGATION_TABS)[number]['id']);
        }
      }
    } catch {
      // ignore malformed URL
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncTabFromUrl();
    const onPop = () => syncTabFromUrl();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isMounted, syncTabFromUrl]);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;

    setIsTabLoading(true);
    setActiveTab(tabId);
    setTabIndex(getTabIndex(tabId));
    router.replace(`/?tab=${tabId}`, { scroll: false });

    // Cerrar menú móvil si está abierto
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    window.clearTimeout((window as Window & { __tabLoadingTimer?: number }).__tabLoadingTimer);
    (window as Window & { __tabLoadingTimer?: number }).__tabLoadingTimer = window.setTimeout(() => {
      setIsTabLoading(false);
    }, 150);
  }, [activeTab, router, isMobileMenuOpen]);

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

      setRecentActivity(activities.slice(0, 4));
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

  // (handleTabChange se define arriba con useCallback)

const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-3 h-full">
            {/* KPIs Full width - fixed height */}
            <div className="flex-shrink-0">
              <DashboardStats />
            </div>

            {/* Grid: Left (overview + activity) | Right (charts) - with intelligent scrolling */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
                {/* Left column - scrollable */}
                <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
                  <div className="glass-panel rounded-xl p-2 md:p-3 flex-shrink-0">
                    <ProjectOverview />
                  </div>
                  <div className="glass-panel rounded-xl p-3 md:p-3 flex-shrink-0">
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

                {/* Right column: charts - scrollable */}
                <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
                  <DashboardCharts />
                </div>
              </div>
            </div>
          </div>
        );
      case 'projects':
        return isTabLoading ? <TabSkeleton /> : <ProjectManager />;
      case 'budgets':
        return isTabLoading ? <TabSkeleton /> : <BudgetCalculator />;
      case 'progress':
        return isTabLoading ? <TabSkeleton /> : <ProgressTracker />;
      case 'finances':
        return isTabLoading ? <TabSkeleton /> : <FinanceManager />;
      case 'payroll':
        return isTabLoading ? <TabSkeleton /> : <PayrollManager />;
      case 'warehouse':
        return isTabLoading ? <TabSkeleton /> : <WarehouseManager />;
      case 'suppliers':
        return isTabLoading ? <TabSkeleton /> : <SupplierManager />;
      case 'orders':
        return isTabLoading ? <TabSkeleton /> : <PurchaseOrderManager />;
      case 'analytics':
        return isTabLoading ? <TabSkeleton /> : <AnalyticsDashboard />;
      case 'clients':
        return isTabLoading ? <TabSkeleton /> : <ClientManager />;
      case 'logs':
        return isTabLoading ? <TabSkeleton /> : <ProjectLogManager />;
      case 'settings':
        return isTabLoading ? <TabSkeleton /> : <SettingsManager />;
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
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans overflow-hidden">
        <DualBrandHeader />
        <RealtimeProvider activeTab={activeTab} />

        {/* Tab navigation - right below header, centered */}
        <Suspense fallback={<div className="py-2 text-white/60 text-xs text-center">Cargando…</div>}>
          <nav
            className="flex-shrink-0 bg-slate-900/60 border-b border-white/10"
            aria-label="Módulos principales"
          >
            <div
              className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 sm:gap-2 sm:px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none"
              style={{ touchAction: 'manipulation' }}
            >
              {NAVIGATION_TABS.map(tab => {
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`shrink-0 min-h-[44px] rounded-lg border px-3 py-2.5 text-[11px] font-medium transition-all duration-200 whitespace-nowrap sm:px-4 sm:text-sm ${
                      isTabActive
                        ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
                        : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                    aria-current={isTabActive ? 'page' : undefined}
                    title={tab.label}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </Suspense>

        {/* Main content area - flex-1 with overflow hidden */}
        <div className="flex flex-1 relative min-h-0">
          {/* Sidebar */}
          <aside
            className={`sidebar-container flex-shrink-0 h-full transition-all duration-300 ease-in-out z-30 ${
              isMobile ? (
                // Mobile: absolute positioning
                `fixed top-0 left-0 h-full ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
              ) : (
                // Desktop: relative with width transition
                isSidebarCollapsed ? 'w-16' : 'w-64'
              )
            }`}
            aria-label="Menú lateral de navegación"
          >
            <DashboardNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isCollapsed={isMobile ? false : isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </aside>

          {/* Mobile overlay */}
          {isMounted && isMobile && isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Main content - full width con scroll automático */}
          <main
            className="flex-1 min-w-0 overflow-hidden"
            id="main-content"
            role="main"
            aria-label="Contenido principal"
          >
            <div
              className="w-full h-full flex flex-col px-2 sm:px-3 py-2 overflow-y-auto overflow-anchor-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {renderTabContent()}
            </div>
          </main>
        </div>

        {/* Mobile menu button - bottom right, solo visible en móvil */}
        {isMounted && isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-xl glass-button shadow-lg shadow-cyan-500/20"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        )}
      </div>
    </AuthGuard>
  );
}
