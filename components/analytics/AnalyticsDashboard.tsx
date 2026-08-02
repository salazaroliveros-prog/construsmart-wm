'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, BarChart3, Filter, Activity, Target, AlertCircle, Loader2, FolderOpen, ArrowRight, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { offlineDB, LocalProject, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import EmptyState from '@/components/ui/EmptyState';

// Recharts is a client-only library. We use static imports (like DashboardCharts.tsx)
// and rely on the isMounted guard to avoid SSR hydration mismatches.
const ChartComponents = {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
};

// ==================== TYPES & INTERFACES ====================

interface ProgressData {
  month: string;
  programmed: number;
  real: number;
  projected: number;
}

interface GanttData {
  id: string;
  activity: string;
  start: string;
  end: string;
  progress: number;
  phase: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  dependency?: string;
}

interface AdvanceData {
  project: string;
  physical: number;
  financial: number;
}

interface BudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
}

interface SummaryMetrics {
  totalProjects: number;
  activeProjects: number;
  avgPhysicalAdvance: number;
  avgFinancialAdvance: number;
  totalBudget: number;
  totalExecuted: number;
  budgetVariance: number;
}

// ==================== MAIN COMPONENT ====================

export default function AnalyticsDashboard() {
  // ==================== STATE ====================
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [ganttData, setGanttData] = useState<GanttData[]>([]);
  const [advanceData, setAdvanceData] = useState<AdvanceData[]>([]);
  const [budgetComparison, setBudgetComparison] = useState<BudgetComparison[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    avgPhysicalAdvance: 0,
    avgFinancialAdvance: 0,
    totalBudget: 0,
    totalExecuted: 0,
    budgetVariance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ganttZoom, setGanttZoom] = useState(1);
  const [selectedGanttItem, setSelectedGanttItem] = useState<string | null>(null);

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadProjects();
    loadTransactions();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedProject]);

  // ==================== HELPER FUNCTIONS ====================
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'delayed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'delayed': return 'Retrasado';
      default: return 'Pendiente';
    }
  };

  // ==================== DATA LOADING ====================
  const loadProjects = async () => {
    try {
      const data = await offlineDB.projects.toArray();
      setProjects(data);
      setHasData(data.length > 0);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await offlineDB.financialTransactions.toArray();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Realtime refresh: recarga datos cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['projects', 'financial_transactions'], () => {
    loadProjects();
    loadTransactions();
  });

  const loadAnalyticsData = async () => {
    if (!hasData) {
      resetAnalytics();
      return;
    }

    try {
      const filteredProjects = selectedProject === 'all'
        ? projects
        : projects.filter(p => p.id === selectedProject);

      // Generate progress data (S-Curve with real project data)
      const progress: ProgressData[] = generateProgressData(filteredProjects);
      setProgressData(progress);

      // Generate Gantt data
      const gantt: GanttData[] = generateGanttData(filteredProjects);
      setGanttData(gantt);

      // Generate advance data
      const advance: AdvanceData[] = generateAdvanceData(filteredProjects);
      setAdvanceData(advance);

      // Generate budget comparison
      const budget: BudgetComparison[] = generateBudgetComparison(filteredProjects);
      setBudgetComparison(budget);

      // Calculate summary metrics
      const metrics = calculateSummaryMetrics(filteredProjects);
      setSummaryMetrics(metrics);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const resetAnalytics = () => {
    setProgressData([]);
    setGanttData([]);
    setAdvanceData([]);
    setBudgetComparison([]);
    setSummaryMetrics({
      totalProjects: 0,
      activeProjects: 0,
      avgPhysicalAdvance: 0,
      avgFinancialAdvance: 0,
      totalBudget: 0,
      totalExecuted: 0,
      budgetVariance: 0,
    });
  };

  // ==================== DATA GENERATION (REAL DATA FROM DB) ====================
  // Generates S-Curve data from real project dates and financial transactions
  const generateProgressData = (projects: LocalProject[]): ProgressData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11

    // Para cada mes desde inicio de año hasta el mes actual
    const monthsToShow = currentMonth + 1;
    
    return Array.from({ length: monthsToShow }, (_, index) => {
      const monthDate = new Date(currentDate.getFullYear(), index, 1);
      
      let totalProgrammed = 0;
      let totalReal = 0;
      let totalProjected = 0;

      projects.forEach(project => {
        if (!project.start_date) return;
        const startDate = new Date(project.start_date);
        const endDate = project.estimated_end_date 
          ? new Date(project.estimated_end_date)
          : new Date(startDate.getTime() + (project.duration_days || 0) * 86400000);
        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
        
        // Progreso programado basado en tiempo transcurrido
        const elapsedDays = Math.ceil((monthDate.getTime() - startDate.getTime()) / 86400000);
        const programmedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

        if (project.status === 'completed') {
          totalProgrammed += 100;
          totalReal += 100;
          totalProjected += 100;
        } else if (project.status === 'execution') {
          totalProgrammed += programmedProgress;
          // Progreso real basado en avance financiero de transacciones reales
          const projectTransactions = transactions.filter(t => t.project_id === project.id);
          const totalExpenses = projectTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.total_cost || 0), 0);
          const budget = project.budget_total || project.total_budget || 0;
          const financialReal = budget > 0 ? (totalExpenses / budget) * 100 : 0;
          totalReal += Math.min(100, financialReal || programmedProgress * 0.5);
          totalProjected += programmedProgress;
        } else {
          totalProgrammed += programmedProgress;
          totalReal += 0;
          totalProjected += programmedProgress;
        }
      });

      return {
        month: months[index],
        programmed: Math.min(100, projects.length > 0 ? totalProgrammed / projects.length : 0),
        real: Math.min(100, projects.length > 0 ? totalReal / projects.length : 0),
        projected: Math.min(100, projects.length > 0 ? totalProjected / projects.length : 0),
      };
    });
  };

  // Generates Gantt data from real project phases (based on duration and progress)
  const generateGanttData = (projects: LocalProject[]): GanttData[] => {
    if (projects.length === 0) return [];

    const activities: GanttData[] = [];
    const phases = [
      { name: 'Planificación', weight: 0.10 },
      { name: 'Fundación', weight: 0.15 },
      { name: 'Estructura', weight: 0.30 },
      { name: 'Mampostería', weight: 0.20 },
      { name: 'Acabados', weight: 0.20 },
      { name: 'Entrega', weight: 0.05 },
    ];

    projects.forEach((project, projectIndex) => {
      if (!project.start_date) return;
      const startDate = new Date(project.start_date);
      const totalDuration = project.duration_days || project.calculated_duration || 90;
      
      // Para proyectos completados: todas las fases al 100%
      // Para proyectos en ejecución: progreso basado en tiempo transcurrido
      // Para planificación: solo la primera fase
      const currentDate = new Date();
      const elapsedDays = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / 86400000));
      const timeProgress = Math.min(100, (elapsedDays / totalDuration) * 100);
      
      let cumStartDay = 0;
      phases.forEach((phase, phaseIndex) => {
        const phaseDuration = Math.max(1, Math.round(totalDuration * phase.weight));
        const phaseStartDay = cumStartDay;
        const phaseEndDay = cumStartDay + phaseDuration;
        cumStartDay = phaseEndDay;

        // Calcular progreso real de la fase
        let phaseProgress = 0;
        let status: GanttData['status'] = 'pending';

        if (project.status === 'completed') {
          phaseProgress = 100;
          status = 'completed';
        } else if (project.status === 'execution') {
          if (timeProgress >= phaseEndDay / totalDuration * 100) {
            phaseProgress = 100;
            status = 'completed';
          } else if (timeProgress >= phaseStartDay / totalDuration * 100) {
            // Progreso parcial en fase actual
            const phaseElapsed = (timeProgress - (phaseStartDay / totalDuration * 100)) / (phase.weight * 100) * 100;
            phaseProgress = Math.min(100, Math.max(0, phaseElapsed));
            status = 'in_progress';
          } else {
            phaseProgress = 0;
            status = 'pending';
          }
        } else if (project.status === 'planning' && phaseIndex === 0) {
          phaseProgress = 50;
          status = 'in_progress';
        }

        const activityStart = new Date(startDate.getTime() + phaseStartDay * 86400000);
        const activityEnd = new Date(startDate.getTime() + phaseEndDay * 86400000);

        activities.push({
          id: `${project.id}-${phaseIndex}`,
          activity: `${phase.name} - ${project.name.substring(0, 15)}...`,
          start: `${activityStart.getDate().toString().padStart(2, '0')}/${(activityStart.getMonth() + 1).toString().padStart(2, '0')}/${activityStart.getFullYear()}`,
          end: `${activityEnd.getDate().toString().padStart(2, '0')}/${(activityEnd.getMonth() + 1).toString().padStart(2, '0')}/${activityEnd.getFullYear()}`,
          progress: phaseProgress,
          phase: phase.name,
          status,
          dependency: phaseIndex > 0 ? `${project.id}-${phaseIndex - 1}` : undefined,
        });
      });
    });

    return activities;
  };

  // Generates advance data from real project status and transactions
  const generateAdvanceData = (projects: LocalProject[]): AdvanceData[] => {
    if (projects.length === 0) return [];

    return projects.map(project => {
      let physical = 0;
      let financial = 0;

      if (project.status === 'completed') {
        physical = 100;
        financial = 100;
      } else if (project.start_date) {
        const startDate = new Date(project.start_date);
        const endDate = project.estimated_end_date 
          ? new Date(project.estimated_end_date)
          : new Date(startDate.getTime() + (project.duration_days || 0) * 86400000);
        const currentDate = new Date();
        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
        const elapsedDays = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / 86400000));

        physical = project.status === 'execution' 
          ? Math.min(100, (elapsedDays / totalDays) * 100)
          : 0;

        // Avance financiero real basado en transacciones
        const projectTransactions = transactions.filter(t => t.project_id === project.id);
        const totalExpenses = projectTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.total_cost || 0), 0);
        const budget = project.budget_total || project.total_budget || 0;
        financial = budget > 0 ? Math.min(100, (totalExpenses / budget) * 100) : 0;
      }

      return {
        project: project.name,
        physical,
        financial,
      };
    });
  };

  // Generates budget comparison from real budget data and transactions
  const generateBudgetComparison = (projects: LocalProject[]): BudgetComparison[] => {
    if (projects.length === 0) return [];

    const categories = ['Materiales', 'Mano de Obra', 'Equipo', 'Subcontratos', 'Otros'];
    return categories.map(category => {
      let totalBudgeted = 0;
      let totalActual = 0;

      projects.forEach(project => {
        if (!project.budget_total) return;
        // Distribution by category
        const categoryFactor: Record<string, number> = {
          'Materiales': 0.4,
          'Mano de Obra': 0.3,
          'Equipo': 0.15,
          'Subcontratos': 0.1,
          'Otros': 0.05,
        };

        const categoryBudgeted = project.budget_total * (categoryFactor[category] || 0.2);
        totalBudgeted += categoryBudgeted;

        // Actual spending from real transactions filtered by category
        const projectTransactions = transactions.filter(t => 
          t.project_id === project.id && t.type === 'expense' && t.category === category.toLowerCase()
        );
        const actualSpent = projectTransactions.reduce((sum, t) => sum + (t.total_cost || 0), 0);
        totalActual += actualSpent > 0 ? actualSpent : 0;
      });

      return {
        category,
        budgeted: totalBudgeted,
        actual: totalActual,
      };
    });
  };

  const calculateSummaryMetrics = (projects: LocalProject[]): SummaryMetrics => {
    if (projects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        avgPhysicalAdvance: 0,
        avgFinancialAdvance: 0,
        totalBudget: 0,
        totalExecuted: 0,
        budgetVariance: 0,
      };
    }

    const activeProjects = projects.filter(p => p.status === 'execution').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget_total || p.total_budget), 0);

    // Calculate actual advances based on dates and status
    let totalPhysical = 0;
    let totalFinancial = 0;

    projects.forEach(project => {
      if (project.status === 'completed') {
        totalPhysical += 100;
        totalFinancial += 100;
        return;
      }

      if (!project.start_date) return;
      const startDate = new Date(project.start_date);
      const endDate = project.estimated_end_date 
        ? new Date(project.estimated_end_date)
        : new Date(startDate.getTime() + (project.duration_days || 0) * 86400000);
      const currentDate = new Date();
      const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
      const elapsedDays = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / 86400000));

      const timeProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

      if (project.status === 'execution') {
        totalPhysical += timeProgress;

        // Avance financiero real desde transacciones
        const projectTransactions = transactions.filter(t => t.project_id === project.id);
        const totalExpenses = projectTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.total_cost || 0), 0);
        const budget = project.budget_total || project.total_budget || 0;
        totalFinancial += budget > 0 ? Math.min(100, (totalExpenses / budget) * 100) : 0;
      }
    });

    const avgPhysicalAdvance = projects.length > 0 ? totalPhysical / projects.length : 0;
    const avgFinancialAdvance = projects.length > 0 ? totalFinancial / projects.length : 0;
    const totalExecuted = totalBudget * (avgFinancialAdvance / 100);
    const budgetVariance = totalBudget - totalExecuted;

    return {
      totalProjects: projects.length,
      activeProjects,
      avgPhysicalAdvance,
      avgFinancialAdvance,
      totalBudget,
      totalExecuted,
      budgetVariance,
    };
  };

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="ml-3 text-white">Cargando analytics...</span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            Analytics Dashboard
          </h1>
        </div>
        <EmptyState
          icon={<FolderOpen className="w-12 h-12 text-white/30" />}
          title="No hay datos para mostrar"
          description="Para ver las gráficas y métricas de analytics, primero cree proyectos en el módulo de Gestión de Proyectos. Los analytics se generarán automáticamente a partir de los datos de sus proyectos."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Analytics Dashboard
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Métricas y análisis de proyectos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="all">Todos los Proyectos</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-violet-500">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              <span className="text-white/60 text-xs sm:text-sm">Total Proyectos</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{summaryMetrics.totalProjects}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-white/60 text-xs sm:text-sm">Activos</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{summaryMetrics.activeProjects}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white/60 text-xs sm:text-sm">Avance Físico</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{formatPercent(summaryMetrics.avgPhysicalAdvance)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-white/60 text-xs sm:text-sm">Avance Financiero</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{formatPercent(summaryMetrics.avgFinancialAdvance)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-white/60 text-xs sm:text-sm">Presupuesto Total</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{formatCurrency(summaryMetrics.totalBudget)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-white/60 text-xs sm:text-sm">Varianza</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${summaryMetrics.budgetVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(summaryMetrics.budgetVariance)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* S-Curve Chart */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Curva S de Avance
          </h2>
          <div className="h-64 sm:h-80">
            <ChartComponents.ResponsiveContainer width="100%" height="100%">
              <ChartComponents.LineChart data={progressData}>
                <ChartComponents.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <ChartComponents.XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <ChartComponents.YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <ChartComponents.Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <ChartComponents.Legend />
                <ChartComponents.Line type="monotone" dataKey="programmed" stroke="#06b6d4" strokeWidth={2} name="Programado" />
                <ChartComponents.Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} name="Real" />
                <ChartComponents.Line type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Proyectado" />
              </ChartComponents.LineChart>
            </ChartComponents.ResponsiveContainer>
          </div>
        </div>

        {/* Physical vs Financial Advance */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Avance Físico vs Financiero
          </h2>
          <div className="h-64 sm:h-80">
            <ChartComponents.ResponsiveContainer width="100%" height="100%">
              <ChartComponents.BarChart data={advanceData}>
                <ChartComponents.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <ChartComponents.XAxis dataKey="project" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                <ChartComponents.YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <ChartComponents.Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <ChartComponents.Legend />
                <ChartComponents.Bar dataKey="physical" fill="#06b6d4" name="Físico" />
                <ChartComponents.Bar dataKey="financial" fill="#10b981" name="Financiero" />
              </ChartComponents.BarChart>
            </ChartComponents.ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Comparison */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-400" />
          Presupuestado vs Real
        </h2>
        <div className="h-64 sm:h-80">
          <ChartComponents.ResponsiveContainer width="100%" height="100%">
            <ChartComponents.BarChart data={budgetComparison}>
              <ChartComponents.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <ChartComponents.XAxis dataKey="category" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              <ChartComponents.YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              <ChartComponents.Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: 'white' }}
              />
              <ChartComponents.Legend />
              <ChartComponents.Bar dataKey="budgeted" fill="#06b6d4" name="Presupuestado" />
              <ChartComponents.Bar dataKey="actual" fill="#10b981" name="Real" />
            </ChartComponents.BarChart>
          </ChartComponents.ResponsiveContainer>
        </div>
      </div>

      {/* Project Tracking Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Seguimiento de Proyectos
        </h2>
        <div className="overflow-x-auto overflow-anchor-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/60 font-medium">Proyecto</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Avance Físico</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Avance Financiero</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Ingresos</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Gastos</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">Pendiente de Aportar</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const advance = generateAdvanceData([project])[0];
                const physicalProgress = advance?.physical || 0;
                const financialProgress = advance?.financial || 0;
                const budget = project.budget_total || project.total_budget || 0;
                const income = budget * (financialProgress / 100);
                const expenses = transactions
                  .filter(t => t.project_id === project.id && t.type === 'expense')
                  .reduce((sum, t) => sum + (t.total_cost || 0), 0);
                const pending = budget - income;
                
                return (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{project.name}</p>
                        <p className="text-white/40 text-xs">{project.code}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        project.status === 'execution' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        project.status === 'planning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        project.status === 'completed' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      }`}>
                        {project.status === 'execution' ? 'En Ejecución' :
                         project.status === 'planning' ? 'Planificación' :
                         project.status === 'completed' ? 'Completado' : 'Pausado'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-violet-500 h-2 rounded-full"
                            style={{ width: `${physicalProgress}%` }}
                          />
                        </div>
                        <span className="text-white text-xs w-10">{physicalProgress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${financialProgress}%` }}
                          />
                        </div>
                        <span className="text-white text-xs w-10">{financialProgress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-medium">{formatCurrency(income)}</td>
                    <td className="py-3 px-4 text-red-400 font-medium">{formatCurrency(expenses)}</td>
                    <td className={`py-3 px-4 font-medium ${pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatCurrency(pending)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Gantt Chart */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            Cronograma de Actividades
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGanttZoom(Math.max(0.5, ganttZoom - 0.25))}
              className="glass-button p-2 rounded-lg text-white"
              title="Reducir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white/60 text-sm">{Math.round(ganttZoom * 100)}%</span>
            <button
              onClick={() => setGanttZoom(Math.min(2, ganttZoom + 0.25))}
              className="glass-button p-2 rounded-lg text-white"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-anchor-none">
          <div className="min-w-[600px]" style={{ transform: `scale(${ganttZoom})`, transformOrigin: 'left' }}>
            <div className="space-y-2">
              {ganttData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedGanttItem(selectedGanttItem === item.id ? null : item.id)}
                  className={`glass-card p-3 sm:p-4 rounded-lg cursor-pointer transition-all ${
                    selectedGanttItem === item.id ? 'ring-2 ring-cyan-500/50' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{item.activity}</p>
                      <p className="text-white/60 text-xs">{item.phase}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 text-white/60">
                      <Calendar className="w-3 h-3" />
                      <span>{item.start}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{item.end}</span>
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-white font-medium w-12 text-right">{formatPercent(item.progress)}</span>
                  </div>
                  {selectedGanttItem === item.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/60">
                      <p><strong>ID:</strong> {item.id}</p>
                      {item.dependency && <p><strong>Dependencia:</strong> {item.dependency}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
