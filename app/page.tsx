'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import DualBrandHeader from '@/components/dashboard/DualBrandHeader';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import BudgetCalculator from '@/components/budgets/BudgetCalculator';
import ProjectManager from '@/components/dashboard/ProjectManager';
import FinanceManager from '@/components/finances/FinanceManager';
import PayrollManager from '@/components/payroll/PayrollManager';
import WarehouseManager from '@/components/warehouse/WarehouseManager';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <DualBrandHeader />

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-20 left-4 z-50 p-3 rounded-lg glass-button"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <aside 
          className={`sidebar-container fixed lg:relative w-64 flex-shrink-0 h-full lg:block ${isMobileMenuOpen ? 'open' : ''}`}
        >
          <DashboardNav activeTab={activeTab} onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }} />
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 main-content">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Tablero Principal
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'projects'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Gestión de Proyectos
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'budgets'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Calculadora de Presupuestos
              </button>
              <button
                onClick={() => setActiveTab('finances')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'finances'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Finanzas
              </button>
              <button
                onClick={() => setActiveTab('payroll')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'payroll'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Nómina
              </button>
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'warehouse'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Almacén
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                Analytics
              </button>
            </div>

            {activeTab === 'dashboard' ? (
              <>
                {/* Welcome Section */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}>
                    Bienvenido al Sistema de Control
                  </h1>
                  <p className="text-white/60">
                    Gestione proyectos, presupuestos y seguimiento en tiempo real
                  </p>
                </div>

                {/* Stats Grid */}
                <DashboardStats />

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Project Overview */}
                  <ProjectOverview />

                  {/* Quick Actions Panel */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⚡</span>
                      </span>
                      <span>Acciones Rápidas</span>
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setActiveTab('projects')}
                        className="glass-button p-4 rounded-xl text-left group"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                            <span className="text-xl">📋</span>
                          </div>
                          <span className="text-white font-medium">Nuevo Proyecto</span>
                        </div>
                        <p className="text-xs text-white/60">Crear proyecto desde cero</p>
                      </button>

                      <button 
                        onClick={() => setActiveTab('budgets')}
                        className="glass-button p-4 rounded-xl text-left group"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                            <span className="text-xl">📊</span>
                          </div>
                          <span className="text-white font-medium">Nuevo Presupuesto</span>
                        </div>
                        <p className="text-xs text-white/60">Generar APU detallado</p>
                      </button>

                      <button 
                        onClick={() => setActiveTab('finances')}
                        className="glass-button p-4 rounded-xl text-left group"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                            <span className="text-xl">💰</span>
                          </div>
                          <span className="text-white font-medium">Gestión Financiera</span>
                        </div>
                        <p className="text-xs text-white/60">Control de gastos e ingresos</p>
                      </button>

                      <button 
                        onClick={() => setActiveTab('warehouse')}
                        className="glass-button p-4 rounded-xl text-left group"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 rounded-lg bg-teal-500/20 group-hover:bg-teal-500/30 transition-colors">
                            <span className="text-xl">📦</span>
                          </div>
                          <span className="text-white font-medium">Almacén</span>
                        </div>
                        <p className="text-xs text-white/60">Control de inventario</p>
                      </button>
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h3 className="text-sm font-medium text-white mb-4">Actividad Reciente</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-white/70">Presupuesto aprobado: Villa Real</span>
                          <span className="text-white/40 text-xs ml-auto">hace 2h</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span className="text-white/70">Nuevo material registrado</span>
                          <span className="text-white/40 text-xs ml-auto">hace 4h</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                          <span className="text-white/70">Progreso actualizado: Centro</span>
                          <span className="text-white/40 text-xs ml-auto">hace 6h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Tier Matrix */}
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💰</span>
                    </span>
                    <span>Matriz de Costos Residenciales (GTQ)</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-xl border-l-4 border-l-blue-500">
                      <h3 className="text-blue-400 font-semibold mb-2">Nivel Básico</h3>
                      <p className="text-2xl font-bold text-white mb-1">Q. 3,000 - Q. 3,500</p>
                      <p className="text-sm text-white/60">por m²</p>
                      <p className="text-xs text-white/40 mt-2">Acabados económicos estándar</p>
                    </div>

                    <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
                      <h3 className="text-emerald-400 font-semibold mb-2">Nivel Moderado</h3>
                      <p className="text-2xl font-bold text-white mb-1">Q. 3,500 - Q. 4,000</p>
                      <p className="text-sm text-white/60">por m²</p>
                      <p className="text-xs text-white/40 mt-2">Acabados de calidad media</p>
                    </div>

                    <div className="glass-card p-4 rounded-xl border-l-4 border-l-violet-500">
                      <h3 className="text-violet-400 font-semibold mb-2">Nivel Premium</h3>
                      <p className="text-2xl font-bold text-white mb-1">Q. 4,000 - Q. 5,000</p>
                      <p className="text-sm text-white/60">por m²</p>
                      <p className="text-xs text-white/40 mt-2">Acabados de alta gama</p>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'projects' ? (
              <ProjectManager />
            ) : activeTab === 'budgets' ? (
              <BudgetCalculator />
            ) : activeTab === 'finances' ? (
              <FinanceManager />
            ) : activeTab === 'payroll' ? (
              <PayrollManager />
            ) : activeTab === 'warehouse' ? (
              <WarehouseManager />
            ) : (
              <AnalyticsDashboard />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
