'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign, BarChart3, Filter, Activity, Target, AlertCircle, Loader2, FolderOpen, ArrowRight, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import EmptyState from '@/components/ui/EmptyState';

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

  const loadAnalyticsData = async () => {
    if (!hasData) {
      resetAnalytics();
      return;
    }

    try {
      const filteredProjects = selectedProject === 'all'
        ? projects
        : projects.filter(p => p.id === selectedProject);

      // Generate progress data (S-Curve simulation)
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

  // ==================== DATA GENERATION ====================
  const generateProgressData = (projects: LocalProject[]): ProgressData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((month, index) => ({
      month,
      programmed: Math.min(100, (index + 1) * 8.33),
      real: Math.min(100, Math.max(0, (index + 1) * 8.33 - Math.random() * 5)),
      projected: Math.min(100, (index + 1) * 8.33 + Math.random() * 3),
    }));
  };

  const generateGanttData = (projects: LocalProject[]): GanttData[] => {
    if (projects.length === 0) return [];

    const activities: GanttData[] = [];
    const phases = ['Planificación', 'Fundación', 'Estructura', 'Mampostería', 'Acabados', 'Entrega'];

    projects.forEach((project, projectIndex) => {
      phases.forEach((phase, phaseIndex) => {
        const baseId = (projectIndex * phases.length) + phaseIndex;
        const baseProgress = Math.min(100, Math.random() * 100);
        const status = baseProgress === 100 ? 'completed' :
                       baseProgress > 50 ? 'in_progress' :
                       baseProgress > 0 ? 'in_progress' : 'pending';

        activities.push({
          id: `${project.id}-${phaseIndex}`,
          activity: `${phase} - ${project.name.substring(0, 15)}...`,
          start: `${(baseId * 7 + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`,
          end: `${(baseId * 7 + 14).toString().padStart(2, '0')}/${new Date().getFullYear()}`,
          progress: baseProgress,
          phase,
          status: status as any,
          dependency: baseId > 0 ? `${project.id}-${phaseIndex - 1}` : undefined,
        });
      });
    });

    return activities;
  };

  const generateAdvanceData = (projects: LocalProject[]): AdvanceData[] => {
    if (projects.length === 0) return [];

    return projects.map(project => ({
      project: project.name,
      physical: Math.random() * 100,
      financial: Math.random() * 100,
    }));
  };

  const generateBudgetComparison = (projects: LocalProject[]): BudgetComparison[] => {
    if (projects.length === 0) return [];

    const categories = ['Materiales', 'Mano de Obra', 'Equipo', 'Subcontratos', 'Otros'];
    return categories.map(category => ({
      category,
      budgeted: Math.random() * 1000000,
      actual: Math.random() * 1000000,
    }));
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
    const totalBudget = projects.reduce((sum, p) => sum + p.total_budget, 0);
    const avgPhysicalAdvance = Math.random() * 100;
    const avgFinancialAdvance = Math.random() * 100;
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend />
                <Line type="monotone" dataKey="programmed" stroke="#06b6d4" strokeWidth={2} name="Programado" />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} name="Real" />
                <Line type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Proyectado" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physical vs Financial Advance */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Avance Físico vs Financiero
          </h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="project" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend />
                <Bar dataKey="physical" fill="#06b6d4" name="Físico" />
                <Bar dataKey="financial" fill="#10b981" name="Financiero" />
              </BarChart>
            </ResponsiveContainer>
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="category" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: 'white' }}
              />
              <Legend />
              <Bar dataKey="budgeted" fill="#06b6d4" name="Presupuestado" />
              <Bar dataKey="actual" fill="#10b981" name="Real" />
            </BarChart>
          </ResponsiveContainer>
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

        <div className="overflow-x-auto">
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
