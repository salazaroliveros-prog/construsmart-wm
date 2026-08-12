'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Target, Clock, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalProjectLog, LocalBudget } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import { formatCurrency, useFinancialSettings } from '@/lib/hooks/useBusinessSettings';
import { calculateProgressMetrics } from '@/lib/utils/summaryCalculations';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

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
  const { financial } = useFinancialSettings();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeBudget, setActiveBudget] = useState<LocalBudget | null>(null);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [projectLogs, setProjectLogs] = useState<LocalProjectLog[]>([]);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalFinancialTransaction | null>(null);

  // Load projects in execution status
  useEffect(() => {
    loadProjects();
  }, []);

  // Load budget state, transactions, and project logs when project changes
  useEffect(() => {
    if (selectedProject) {
      loadBudgetState();
      loadTransactions();
      loadProjectLogs();
    } else {
      setActiveBudget(null);
      setTransactions([]);
      setProjectLogs([]);
      setMetrics(null);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const userId = await getUserScope();
      const allProjects = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      const executionProjects = allProjects.filter(p => p.status === 'execution');
      setProjects(executionProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadBudgetState = async () => {
    // Fallback: read the latest budget from the local DB (e.g. created on another device)
    try {
      const userId = await getUserScope();
      const userProjects = scopeLocalRows(
        await offlineDB.projects.where('id').equals(selectedProject).toArray(),
        userId
      );
      if (userProjects.length === 0) {
        setActiveBudget(null);
        return;
      }

      const budgets = scopeLocalRows(
        await offlineDB.budgets.where('project_id').equals(selectedProject).toArray(),
        userId
      );

      if (budgets.length > 0) {
        const budget = budgets[budgets.length - 1];
        setActiveBudget(budget);
        return;
      }
    } catch (error) {
      console.error('Error loading budget from DB:', error);
    }

    setActiveBudget(null);
  };

  const loadTransactions = async () => {
    try {
      const userId = await getUserScope();
      const allTransactions = scopeLocalRows(await offlineDB.financialTransactions.toArray(), userId);
      const projectTransactions = allTransactions.filter(t => t.project_id === selectedProject);
      setTransactions(projectTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadProjectLogs = async () => {
    try {
      const userId = await getUserScope();
      const allLogs = scopeLocalRows(await offlineDB.projectLogs.toArray(), userId);
      const projectLogsData = allLogs.filter(l => l.project_id === selectedProject);
      setProjectLogs(projectLogsData);
    } catch (error) {
      console.error('Error loading project logs:', error);
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

    const metrics = calculateProgressMetrics({
      project,
      transactions,
      activeBudget,
      projectLogs,
    });

    setMetrics(metrics);
  }, [activeBudget, transactions, selectedProject, projects, projectLogs]);

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
      value: activeBudget.direct_cost * 0.6, // Estimado: 60% materiales
      fill: '#3b82f6',
    },
    {
      name: 'Mano de Obra',
      value: activeBudget.direct_cost * 0.3, // Estimado: 30% mano de obra
      fill: '#10b981',
    },
    {
      name: 'Maquinaria',
      value: activeBudget.direct_cost * 0.1, // Estimado: 10% maquinaria
      fill: '#f59e0b',
    },
  ] : [];

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['financial_transactions', 'projects', 'budgets', 'project_logs'], () => {
    loadProjects();
    loadTransactions();
    loadBudgetState();
    loadProjectLogs();
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
                  {formatCurrency(activeBudget.direct_cost, financial)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Costo Total (CD + CI)</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(activeBudget.total_amount, financial)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Presupuesto Restante</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(metrics?.remainingBudget || 0, financial)}
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
                    formatter={(value: any) => value ? formatCurrency(value, financial) : ''}
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
                  {formatCurrency(metrics?.spentAmount || 0, financial)}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white/60 text-sm mb-1">Monto Estimado Según Progreso</p>
                <p className="text-white font-medium text-xl">
                  {formatCurrency(metrics?.estimatedSpent || 0, financial)}
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
