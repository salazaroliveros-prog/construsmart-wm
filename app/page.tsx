'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Menu, X, Clock, Zap, ClipboardList, BarChart3, DollarSign, Package } from 'lucide-react';
import DualBrandHeader from '@/components/dashboard/DualBrandHeader';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import { offlineDB } from '@/lib/db/offlineStore';
import { useScrollLock } from '@/lib/hooks/useScrollLock';

const ProjectManager = dynamic(() => import('@/components/dashboard/ProjectManager'), { ssr: false });
const BudgetCalculator = dynamic(() => import('@/components/budgets/BudgetCalculator'), { ssr: false });
const FinanceManager = dynamic(() => import('@/components/finances/FinanceManager'), { ssr: false });
const PayrollManager = dynamic(() => import('@/components/payroll/PayrollManager'), { ssr: false });
const WarehouseManager = dynamic(() => import('@/components/warehouse/WarehouseManager'), { ssr: false });
const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), { ssr: false });

const tabs = [
  { id: 'dashboard', label: 'Tablero Principal' },
  { id: 'projects', label: 'Gestión de Proyectos' },
  { id: 'budgets', label: 'Calculadora de Presupuestos' },
  { id: 'finances', label: 'Finanzas' },
  { id: 'payroll', label: 'Nómina' },
  { id: 'warehouse', label: 'Almacén' },
  { id: 'analytics', label: 'Analytics' },
];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Bienvenido al Sistema de Control
              </h1>
              <p className="text-white/60 text-sm sm:text-base">
                Gestione proyectos, presupuestos y seguimiento en tiempo real
              </p>
            </div>

            <DashboardStats />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <ProjectOverview />

              <div className="glass-panel rounded-2xl p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center space-x-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
                  </span>
                  <span>Acciones Rápidas</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="glass-button-inline p-3 sm:p-4 rounded-xl text-left group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                        <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base">Nuevo Proyecto</span>
                    </div>
                    <p className="text-xs text-white/60 hidden sm:block">Crear proyecto desde cero</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('budgets')}
                    className="glass-button-inline p-3 sm:p-4 rounded-xl text-left group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base">Nuevo Presupuesto</span>
                    </div>
                    <p className="text-xs text-white/60 hidden sm:block">Generar APU detallado</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('finances')}
                    className="glass-button-inline p-3 sm:p-4 rounded-xl text-left group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base">Gestión Financiera</span>
                    </div>
                    <p className="text-xs text-white/60 hidden sm:block">Control de gastos e ingresos</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('warehouse')}
                    className="glass-button-inline p-3 sm:p-4 rounded-xl text-left group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-teal-500/20 group-hover:bg-teal-500/30 transition-colors">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base">Almacén</span>
                    </div>
                    <p className="text-xs text-white/60 hidden sm:block">Control de inventario</p>
                  </button>
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3 sm:mb-4 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-white/60" aria-hidden="true" />
                    <span>Actividad Reciente</span>
                  </h3>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-white/40">No hay actividad reciente</p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-2 sm:space-x-3 text-sm">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${activity.color}`} />
                          <span className="text-white/70 truncate text-xs sm:text-sm">{activity.text}</span>
                          {activity.time && (
                            <span className="text-white/40 text-[10px] sm:text-xs ml-auto whitespace-nowrap">{activity.time}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center space-x-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
                  </span>
                <span>Matriz de Costos Residenciales (GTQ)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-blue-500">
                  <h3 className="text-blue-400 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Nivel Básico</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-1">Q. 3,000 - Q. 3,500</p>
                  <p className="text-xs sm:text-sm text-white/60">por m²</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2">Acabados económicos estándar</p>
                </div>
                <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-emerald-500">
                  <h3 className="text-emerald-400 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Nivel Moderado</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-1">Q. 3,500 - Q. 4,000</p>
                  <p className="text-xs sm:text-sm text-white/60">por m²</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2">Acabados de calidad media</p>
                </div>
                <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-violet-500">
                  <h3 className="text-violet-400 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Nivel Premium</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-1">Q. 4,000 - Q. 5,000</p>
                  <p className="text-xs sm:text-sm text-white/60">por m²</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2">Acabados de alta gama</p>
                </div>
              </div>
            </div>
          </>
        );
      case 'projects':
        return <ProjectManager />;
      case 'budgets':
        return <BudgetCalculator />;
      case 'finances':
        return <FinanceManager />;
      case 'payroll':
        return <PayrollManager />;
      case 'warehouse':
        return <WarehouseManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DualBrandHeader />

      {isMounted && isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-20 left-3 sm:left-4 z-[45] p-2.5 sm:p-3 rounded-lg glass-button"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />}
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
          className={`sidebar-container fixed lg:relative w-64 flex-shrink-0 h-full lg:block ${isMobileMenuOpen ? 'open' : ''}`}
          style={{ zIndex: 40 }}
          aria-label="Menú lateral de navegación"
        >
          <DashboardNav activeTab={activeTab} onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }} />
        </aside>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 main-content pt-20 sm:pt-24 lg:pt-6" id="main-content" role="main" aria-label="Contenido principal">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <nav className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1" aria-label="Navegación de pestañas">
              {tabs.map(tab => {
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
  );
}

// deployment verification 2026-07-30 17:12:55
