'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Target, Clock, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';
import { offlineDB, LocalProject, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { budgetState, ActiveBudgetState } from '@/lib/state/budgetState';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';

// Recharts is a client-only library. We use static imports (like DashboardCharts.tsx)
// which is the correct pattern for recharts (no default export).
const ChartComponents = {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip: ChartTooltip,
  Legend,
};

interface ProgressMetrics {
  physicalProgress: number;      // % avance físico estimado
  financialProgress: number;     // % avance financiero
  variance: number;               // Diferencia (físico - financiero)
  spentAmount: number;            // Monto gastado real
  estimatedSpent: number;         // Monto estimado gastado según progreso
  remainingBudget: number;        // Presupuesto restante
  daysElapsed: number;           // Días transcurridos
  totalDays: number;              // Días totales del proyecto
  timeProgress: number;           // % de tiempo transcurrido
}

export default function ProgressTracker() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeBudget, setActiveBudget] = useState<ActiveBudgetState | null>(null);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalFinancialTransaction | null>(null);

  // Load projects in execution status
  useEffect(() => {
    loadProjects();
  }, []);

  // Load budget state and transactions when project changes
  useEffect(() => {
    if (selectedProject) {
      loadBudgetState();
      loadTransactions();
    } else {
      setActiveBudget(null);
      setTransactions([]);
      setMetrics(null);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const allProjects = await offlineDB.projects.toArray();
      const executionProjects = allProjects.filter(p => p.status === 'execution');
      setProjects(executionProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadBudgetState = async () => {
    // Try to get budget from global state first
    const state = budgetState.get();
    if (state && state.projectId === selectedProject) {
      setActiveBudget(state);
      return;
    }

    // Fallback: read the latest budget from the local DB (e.g. created on another device)
    try {
      const budgets = await offlineDB.budgets
        .where('project_id')
        .equals(selectedProject)
        .reverse()
        .limit(1)
        .toArray();

      if (budgets.length > 0) {
        const budget = budgets[0];
        setActiveBudget({
          projectId: selectedProject,
          budgetId: budget.id as string,
          typology: 'residential',
          costDirectTotal: budget.direct_cost || 0,
          costTotalWithIndirects: budget.total_amount || 0,
          breakdown: {
            materials: 0,
            labor: 0,
            machinery: 0,
          },
          calculatedAt: budget.updated_at || '',
        });
        return;
      }
    } catch (error) {
      console.error('Error loading budget from DB:', error);
    }

    setActiveBudget(null);
  };

  const loadTransactions = async () => {
    try {
      const allTransactions = await offlineDB.financialTransactions.toArray();
      const projectTransactions = allTransactions.filter(t => t.project_id === selectedProject);
      setTransactions(projectTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Calculate progress metrics
  useEffect(() => {
    if (!activeBudget || !selectedProject) {
      setMetrics(null);
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    // Calculate financial progress (actual spending)
    const spentAmount = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.total_cost, 0);

    const financialProgress = (spentAmount / activeBudget.costTotalWithIndirects) * 100;

    // Calculate time progress
    const startDate = project.start_date ? new Date(project.start_date) : new Date();
    const endDate = project.estimated_end_date 
      ? new Date(project.estimated_end_date)
      : new Date(startDate.getTime() + (project.duration_days * 24 * 60 * 60 * 1000));
    
    const now = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const timeProgress = (daysElapsed / totalDays) * 100;

    // Estimate physical progress based on time (can be adjusted with actual progress input)
    // Default: assume linear progress unless actual progress is tracked
    const physicalProgress = Math.min(100, timeProgress);

    // Estimated amount that should have been spent based on physical progress
    const estimatedSpent = (activeBudget.costTotalWithIndirects * physicalProgress) / 100;

    const variance = physicalProgress - financialProgress;
    const remainingBudget = activeBudget.costTotalWithIndirects - spentAmount;

    setMetrics({
      physicalProgress,
      financialProgress,
      variance,
      spentAmount,
      estimatedSpent,
      remainingBudget,
      daysElapsed,
      totalDays,
      timeProgress,
    });
  }, [activeBudget, transactions, selectedProject, projects]);

  const handleDelete = async (transaction: LocalFinancialTransaction) => {
    setDeleteConfirm(transaction);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await queueDelete('financial_transactions', deleteConfirm);
      await offlineDB.financialTransactions.delete(deleteConfirm.id);
      showToast('success', 'Transacción eliminada exitosamente del control de avance');
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('error', 'Error al eliminar la transacción');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data
  const chartData = metrics ? [
    {
      name: 'Avance Físico',
      value: metrics.physicalProgress,
      fill: '#10b981',
    },
    {
      name: 'Avance Financiero',
      value: metrics.financialProgress,
      fill: '#3b82f6',
    },
    {
      name: 'Tiempo Transcurrido',
      value: metrics.timeProgress,
      fill: '#f59e0b',
    },
  ] : [];

  const budgetBreakdownData = activeBudget ? [
    {
      name: 'Materiales',
      value: activeBudget.breakdown.materials,
      fill: '#3b82f6',
    },
    {
      name: 'Mano de Obra',
      value: activeBudget.breakdown.labor,
      fill: '#10b981',
    },
    {
      name: 'Maquinaria',
      value: activeBudget.breakdown.machinery,
      fill: '#f59e0b',
    },
  ] : [];

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['financial_transactions', 'projects', 'budgets'], () => {
    loadProjects();
    loadTransactions();
    loadBudgetState();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Control de Avance
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Monitoreo de avance físico vs financiero en tiempo real
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="">Seleccione un proyecto...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedProject ? (
        <EmptyState
          icon={<Target className="w-12 h-12 text-white/30" />}
          title="Seleccione un proyecto"
          description="Elija un proyecto en ejecución para ver su control de avance."
        />
      ) : !activeBudget ? (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <p>
              No hay presupuesto activo para este proyecto. 
              Cree un presupuesto en el módulo de Presupuestos.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tooltip content="Porcentaje de avance físico estimado del proyecto">
              <span className="block">
                <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/60 text-sm">Avance Físico</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {metrics?.physicalProgress.toFixed(1)}%
                  </p>
                </div>
              </span>
            </Tooltip>
            
            <Tooltip content="Porcentaje de avance financiero basado en gastos reales">
              <span className="block">
                <div className="glass-card p-4 rounded-xl border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    <span className="text-white/60 text-sm">Avance Financiero</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {metrics?.financialProgress.toFixed(1)}%
                  </p>
                </div>
              </span>
            </Tooltip>
            
            <Tooltip content="Porcentaje de tiempo transcurrido del proyecto">
              <span className="block">
                <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-white/60 text-sm">Tiempo Transcurrido</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">
                    {metrics?.timeProgress.toFixed(1)}%
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {metrics?.daysElapsed} / {metrics?.totalDays} días
                  </p>
                </div>
              </span>
            </Tooltip>
            
            <Tooltip content="Diferencia entre avance físico y financiero">
              <span className="block">
                <div className={`glass-card p-4 rounded-xl border-l-4 ${
                  metrics && metrics.variance >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {metrics && metrics.variance >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white/60 text-sm">Variación</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    metrics && metrics.variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {metrics?.variance.toFixed(1)}%
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {metrics && metrics.variance >= 0 ? 'Adelantado' : 'Atrasado'}
                  </p>
                </div>
              </span>
            </Tooltip>
          </div>

          {/* Budget Overview */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Resumen del Presupuesto
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-white/60 text-sm">Costo Directo (CD)</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(activeBudget.costDirectTotal)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Costo Total (CD + CI)</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(activeBudget.costTotalWithIndirects)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Presupuesto Restante</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(metrics?.remainingBudget || 0)}
                </p>
              </div>
            </div>

            {/* Budget Breakdown Chart */}
            <div className="h-64">
              <ChartComponents.ResponsiveContainer width="100%" height="100%">
                <ChartComponents.BarChart data={budgetBreakdownData}>
                  <ChartComponents.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <ChartComponents.XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
                  <ChartComponents.YAxis stroke="rgba(255,255,255,0.6)" tickFormatter={(value: any) => `Q${(value / 1000).toFixed(0)}k`} />
                  <ChartComponents.Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    formatter={(value: any) => value ? formatCurrency(value) : ''}
                  />
                  <ChartComponents.Bar dataKey="value" fill="#3b82f6" />
                </ChartComponents.BarChart>
              </ChartComponents.ResponsiveContainer>
            </div>
          </div>

          {/* Progress Comparison Chart */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Comparación de Avance
            </h2>
            
            <div className="h-64">
              <ChartComponents.ResponsiveContainer width="100%" height="100%">
                <ChartComponents.LineChart data={chartData}>
                  <ChartComponents.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <ChartComponents.XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
                  <ChartComponents.YAxis stroke="rgba(255,255,255,0.6)" domain={[0, 100]} tickFormatter={(value: any) => `${value}%`} />
                  <ChartComponents.Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    formatter={(value: any) => value ? `${value.toFixed(1)}%` : ''}
                  />
                  <ChartComponents.Legend />
                  <ChartComponents.Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </ChartComponents.LineChart>
              </ChartComponents.ResponsiveContainer>
            </div>
          </div>

          {/* Financial Details */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              Detalles Financieros
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white/60 text-sm mb-1">Monto Gastado Real</p>
                <p className="text-white font-medium text-xl">
                  {formatCurrency(metrics?.spentAmount || 0)}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white/60 text-sm mb-1">Monto Estimado Según Progreso</p>
                <p className="text-white font-medium text-xl">
                  {formatCurrency(metrics?.estimatedSpent || 0)}
                </p>
              </div>
            </div>

            {metrics && Math.abs(metrics.variance) > 10 && (
              <div className={`mt-4 p-4 rounded-lg ${
                metrics.variance > 0 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className={`text-sm ${
                  metrics.variance > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {metrics.variance > 0 
                    ? '✓ El proyecto está adelantado financieramente'
                    : '⚠ El proyecto está atrasado financieramente'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Topography Data */}
          {activeBudget.topographyData && (
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Datos de Topografía (Integración APU)
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Volumen Corte</p>
                  <p className="text-white font-medium">{activeBudget.topographyData.volumeCut} m³</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Volumen Relleno</p>
                  <p className="text-white font-medium">{activeBudget.topographyData.volumeFill} m³</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Área Terreno</p>
                  <p className="text-white font-medium">{activeBudget.topographyData.terrainArea} m²</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Tipo de Suelo</p>
                  <p className="text-white font-medium">{activeBudget.topographyData.soilType}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Eliminar Transacción"
        message={`¿Está seguro de eliminar esta transacción del control de avance? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}
