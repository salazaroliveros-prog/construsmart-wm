'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  Loader2, 
  Filter,
  Calendar as CalendarIcon,
  Clock,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ComposedChart, 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalWarehouseStock, LocalProjectLog, LocalBudgetItem, LocalBudget } from '@/lib/db/offlineStore';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useBusinessSettings, calculateUtilityMarginHelper } from '@/lib/hooks/useBusinessSettings';
import { useFinancialDataRealtime } from '@/hooks/useFinancialDataRealtime';
import { useEarnedValueManagement } from '@/hooks/useEarnedValueManagement';
import EmptyState from '@/components/ui/EmptyState';

// ==================== TYPES & INTERFACES ====================

interface SCurveData {
  period: string;
  avancePlanificado: number;
  avanceReal: number;
}

interface CashFlowData {
  period: string;
  ingresos: number;
  egresos: number;
  saldoNeto: number;
}

interface BudgetDeviationData {
  capitulo: string;
  presupuestoOriginal: number;
  costoRealDevengado: number;
}

interface GanttTaskData {
  tarea: string;
  start: number;
  end: number;
  progress: number;
  esRutaCritica: boolean;
  color: string;
}

interface MaterialBurnRateData {
  material: string;
  nivelActual: number;
  puntoReorden: number;
  total: number;
}

interface SummaryMetrics {
  totalProjects: number;
  activeProjects: number;
  avgPhysicalAdvance: number;
  avgFinancialAdvance: number;
  totalBudget: number;
  totalExecuted: number;
  budgetVariance: number;
  utilityMarginPercentage?: number;
  utilityMarginTarget?: number;
  evmSPI?: number; // Schedule Performance Index
  evmCPI?: number; // Cost Performance Index
  evmSV?: number; // Schedule Variance
  evmCV?: number; // Cost Variance
}

// ==================== COLORS ====================

const COLORS = {
  cyan: '#06b6d4',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
};

// ==================== MAIN COMPONENT ====================

export default function AnalyticsDashboard() {
  // ==================== STATE ====================
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<LocalWarehouseStock[]>([]);
  const [projectLogs, setProjectLogs] = useState<LocalProjectLog[]>([]);
  const [budgetItems, setBudgetItems] = useState<LocalBudgetItem[]>([]);
  const [budgets, setBudgets] = useState<LocalBudget[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // ==================== HOOKS ====================
  const { settings } = useBusinessSettings();
  const { cumulativeCosts, lastUpdate, isLoading: financialDataLoading } = useFinancialDataRealtime(selectedProject);
  const { 
    metrics: evmMetrics, 
    analysis: evmAnalysis, 
    isCalculating: evmCalculating, 
    analyzeProject 
  } = useEarnedValueManagement();
  const [sCurveData, setSCurveData] = useState<SCurveData[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [budgetDeviationData, setBudgetDeviationData] = useState<BudgetDeviationData[]>([]);
  const [ganttData, setGanttData] = useState<GanttTaskData[]>([]);
  const [burnRateData, setBurnRateData] = useState<MaterialBurnRateData[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    avgPhysicalAdvance: 0,
    avgFinancialAdvance: 0,
    totalBudget: 0,
    totalExecuted: 0,
    budgetVariance: 0,
    utilityMarginPercentage: 0,
    utilityMarginTarget: 0,
    evmSPI: 1,
    evmCPI: 1,
    evmSV: 0,
    evmCV: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [showEVM, setShowEVM] = useState(false);

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadProjects();
    loadTransactions();
    loadWarehouseStock();
    loadProjectLogs();
    loadBudgetItems();
    loadBudgets();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedProject]);

  // Recalculate analytics when financial settings change
  useEffect(() => {
    loadAnalyticsData();
  }, [settings]);

  // Trigger EVM analysis when project is selected
  useEffect(() => {
    if (selectedProject && selectedProject !== 'all') {
      analyzeProject(selectedProject);
    }
  }, [selectedProject]);

  // Recalculate S-Curve when real-time financial data changes
  useEffect(() => {
    if (selectedProject !== 'all' && cumulativeCosts.size > 0) {
      const filteredProjects = projects.filter(p => p.id === selectedProject);
      setSCurveData(generateSCurveData(filteredProjects));
    }
  }, [cumulativeCosts, selectedProject, projects]);

  useRealtimeRefresh(['projects', 'financial_transactions', 'warehouse_stock', 'project_logs', 'budget_items', 'budgets'], () => {
    loadProjects();
    loadTransactions();
    loadWarehouseStock();
    loadProjectLogs();
    loadBudgetItems();
    loadBudgets();
  });

  // ==================== HELPER FUNCTIONS ====================
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

  const loadWarehouseStock = async () => {
    try {
      const data = await offlineDB.warehouseStock.toArray();
      setWarehouseStock(data);
    } catch (error) {
      console.error('Error loading warehouse stock:', error);
    }
  };

  const loadProjectLogs = async () => {
    try {
      const data = await offlineDB.projectLogs.toArray();
      setProjectLogs(data);
    } catch (error) {
      console.error('Error loading project logs:', error);
    }
  };

  const loadBudgetItems = async () => {
    try {
      const data = await offlineDB.budgetItems.toArray();
      setBudgetItems(data);
    } catch (error) {
      console.error('Error loading budget items:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const data = await offlineDB.budgets.toArray();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
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

      setSCurveData(generateSCurveData(filteredProjects));
      setCashFlowData(generateCashFlowData(filteredProjects));
      setBudgetDeviationData(generateBudgetDeviationData(filteredProjects));
      setGanttData(generateGanttData(filteredProjects));
      setBurnRateData(generateBurnRateData(filteredProjects));
      setSummaryMetrics(calculateSummaryMetrics(filteredProjects));
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const resetAnalytics = () => {
    setSCurveData([]);
    setCashFlowData([]);
    setBudgetDeviationData([]);
    setGanttData([]);
    setBurnRateData([]);
    setSummaryMetrics({
      totalProjects: 0,
      activeProjects: 0,
      avgPhysicalAdvance: 0,
      avgFinancialAdvance: 0,
      totalBudget: 0,
      totalExecuted: 0,
      budgetVariance: 0,
      utilityMarginPercentage: 0,
      utilityMarginTarget: 0,
      evmSPI: 1,
      evmCPI: 1,
      evmSV: 0,
      evmCV: 0,
    });
  };

  // ==================== DATA GENERATION ====================
  
  // GRÁFICO 1: Curva S (Avance Físico vs Financiero Acumulado) - usando datos reales de transactions y project_logs
  const generateSCurveData = (projects: LocalProject[]): SCurveData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: currentMonth + 1 }, (_, index) => {
      let totalPlanificado = 0;
      let totalReal = 0;

      projects.forEach(project => {
        if (!project.start_date) return;
        const startDate = new Date(project.start_date);
        const endDate = project.estimated_end_date
          ? new Date(project.estimated_end_date)
          : new Date(startDate.getTime() + (project.duration_days || 0) * 86400000);
        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));

        const monthDate = new Date(currentDate.getFullYear(), index, 1);
        const elapsedDays = Math.ceil((monthDate.getTime() - startDate.getTime()) / 86400000);
        const programmedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

        if (project.status === 'completed') {
          totalPlanificado += 100;
          totalReal += 100;
        } else if (project.status === 'execution') {
          totalPlanificado += programmedProgress;

          // Usar physical_progress de project_logs para avance físico real
          const projectLogsData = projectLogs.filter(l => l.project_id === project.id);
          let physicalProgress = programmedProgress;
          if (projectLogsData.length > 0) {
            const latestLog = projectLogsData
              .filter(log => log.physical_progress !== undefined && log.physical_progress !== null)
              .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())[0];
            if (latestLog && latestLog.physical_progress !== undefined) {
              physicalProgress = latestLog.physical_progress;
            }
          }

          // Usar transactions para avance financiero real
          const budget = project.budget_total || project.total_budget || 0;
          const projectTransactions = transactions.filter(t => t.project_id === project.id);
          const totalExpenses = projectTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.total_cost || 0), 0);
          const financialReal = budget > 0 ? (totalExpenses / budget) * 100 : 0;

          totalReal += Math.min(100, (physicalProgress + financialReal) / 2);
        } else {
          totalPlanificado += programmedProgress;
          totalReal += 0;
        }
      });

      return {
        period: months[index],
        avancePlanificado: Math.min(100, projects.length > 0 ? totalPlanificado / projects.length : 0),
        avanceReal: Math.min(100, projects.length > 0 ? totalReal / projects.length : 0),
      };
    });
  };

  // GRÁFICO 2: Flujo de Caja y Proyección
  const generateCashFlowData = (projects: LocalProject[]): CashFlowData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: currentMonth + 1 }, (_, index) => {
      let totalIngresos = 0;
      let totalEgresos = 0;

      projects.forEach(project => {
        const projectTransactions = transactions.filter(t => t.project_id === project.id);
        const monthTransactions = projectTransactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate.getMonth() === index && txDate.getFullYear() === currentDate.getFullYear();
        });

        totalIngresos += monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.total_cost || 0), 0);
        
        totalEgresos += monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.total_cost || 0), 0);
      });

      return {
        period: months[index],
        ingresos: totalIngresos,
        egresos: totalEgresos,
        saldoNeto: totalIngresos - totalEgresos,
      };
    });
  };

  // GRÁFICO 3: Desviación de Presupuesto por Capítulos (usando budget_items reales)
  const generateBudgetDeviationData = (projects: LocalProject[]): BudgetDeviationData[] => {
    if (projects.length === 0) return [];

    // Agrupar budget_items por descripción/categoría
    const capitulos = ['Cimentación', 'Estructura', 'Acabados', 'Instalaciones', 'Otros'];
    return capitulos.map(capitulo => {
      let totalPresupuesto = 0;
      let totalReal = 0;

      projects.forEach(project => {
        // Obtener budget_items del proyecto
        const projectBudgetItems = budgetItems.filter(bi => {
          // Obtener budget_id del proyecto
          const projectBudget = budgets.find(b => b.project_id === project.id);
          return projectBudget && bi.budget_id === projectBudget.id;
        });

        // Mapear descripciones a capítulos
        const capituloKeywords: Record<string, string[]> = {
          'Cimentación': ['cimentación', 'fundación', 'cemento', 'zapata', 'losa', 'concreto'],
          'Estructura': ['estructura', 'acero', 'varilla', 'columna', 'viga', 'hierro'],
          'Acabados': ['acabado', 'piso', 'muro', 'yeso', 'pintura', 'revestimiento'],
          'Instalaciones': ['instalación', 'eléctrico', 'sanitario', 'plomería', 'tubería'],
          'Otros': []
        };

        // Sumar presupuesto de items que coinciden con el capítulo
        projectBudgetItems.forEach(item => {
          const description = item.description?.toLowerCase() || '';
          const keywords = capituloKeywords[capitulo] || [];
          if (keywords.some(kw => description.includes(kw))) {
            totalPresupuesto += item.total_cost || 0;
          }
        });

        // Sumar gastos reales por categoría de transacción
        const categoryMapping: Record<string, string> = {
          'Cimentación': 'materiales',
          'Estructura': 'materiales',
          'Acabados': 'materiales',
          'Instalaciones': 'materiales',
          'Otros': 'otros',
        };

        const projectTransactions = transactions.filter(t =>
          t.project_id === project.id &&
          t.type === 'expense' &&
          t.category === categoryMapping[capitulo]
        );
        const actualSpent = projectTransactions.reduce((sum, t) => sum + (t.total_cost || 0), 0);
        totalReal += actualSpent;
      });

      return {
        capitulo,
        presupuestoOriginal: totalPresupuesto || 0,
        costoRealDevengado: totalReal,
      };
    });
  };

  // GRÁFICO 4: Diagrama de Gantt Operativo (Ruta Crítica)
  const generateGanttData = (projects: LocalProject[]): GanttTaskData[] => {
    if (projects.length === 0) return [];

    const tasks: GanttTaskData[] = [];
    const phases = [
      { name: 'Planificación', weight: 0.10, critical: true },
      { name: 'Fundación', weight: 0.15, critical: true },
      { name: 'Estructura', weight: 0.30, critical: true },
      { name: 'Mampostería', weight: 0.20, critical: false },
      { name: 'Acabados', weight: 0.20, critical: false },
      { name: 'Entrega', weight: 0.05, critical: true },
    ];

    projects.forEach((project, projectIndex) => {
      if (!project.start_date) return;
      const startDate = new Date(project.start_date);
      const totalDuration = project.duration_days || project.calculated_duration || 90;
      const currentDate = new Date();
      const elapsedDays = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / 86400000));
      const timeProgress = Math.min(100, (elapsedDays / totalDuration) * 100);
      
      let cumStart = 0;
      phases.forEach((phase, phaseIndex) => {
        const phaseDuration = Math.max(1, Math.round(totalDuration * phase.weight));
        const phaseStart = cumStart;
        const phaseEnd = cumStart + phaseDuration;
        cumStart = phaseEnd;

        let phaseProgress = 0;
        if (project.status === 'completed') {
          phaseProgress = 100;
        } else if (project.status === 'execution') {
          if (timeProgress >= phaseEnd / totalDuration * 100) {
            phaseProgress = 100;
          } else if (timeProgress >= phaseStart / totalDuration * 100) {
            const phaseElapsed = (timeProgress - (phaseStart / totalDuration * 100)) / (phase.weight * 100) * 100;
            phaseProgress = Math.min(100, Math.max(0, phaseElapsed));
          }
        }

        tasks.push({
          tarea: `${phase.name} - ${project.name.substring(0, 12)}...`,
          start: phaseStart,
          end: phaseEnd,
          progress: phaseProgress,
          esRutaCritica: phase.critical,
          color: phase.critical ? COLORS.red : COLORS.cyan,
        });
      });
    });

    return tasks.slice(0, 12); // Limitar a 12 tareas para visualización
  };

  // GRÁFICO 5: Velocidad de Consumo de Materiales Críticos (Burn Rate) - usando datos reales de warehouse_stock
  const generateBurnRateData = (projects: LocalProject[]): MaterialBurnRateData[] => {
    if (projects.length === 0) return [];

    // Mapear descripciones de materiales reales en almacén
    const materialKeywords: Record<string, string[]> = {
      'Cemento': ['cemento', 'progreso', 'holcim'],
      'Varilla': ['varilla', 'acero', 'hierro', 'refuerzo'],
      'Agregados': ['arena', 'grava', 'piedra', 'agregado'],
      'Ladrillo': ['ladrillo', 'bloque', 'block'],
      'Acero': ['acero', 'perfil', 'estructura']
    };

    const materiales = Object.keys(materialKeywords);
    return materiales.map(material => {
      const keywords = materialKeywords[material] || [];
      
      // Filtrar stock por descripción que contenga keywords
      const materialStock = warehouseStock.filter(s => {
        const description = s.description?.toLowerCase() || '';
        return keywords.some(kw => description.includes(kw));
      });
      
      const totalQuantity = materialStock.reduce((sum, s) => sum + (s.current_stock || 0), 0);
      const minThreshold = materialStock.reduce((sum, s) => sum + (s.minimum_threshold || 0), 0);
      const maxStock = materialStock.reduce((sum, s) => sum + (s.minimum_threshold || 0) * 5, 0); // Estimado como 5x el mínimo
      
      return {
        material,
        nivelActual: totalQuantity,
        puntoReorden: minThreshold || (totalQuantity * 0.2),
        total: maxStock || (totalQuantity * 1.25),
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
        utilityMarginPercentage: 0,
        utilityMarginTarget: 0,
        evmSPI: 1,
        evmCPI: 1,
        evmSV: 0,
        evmCV: 0,
      };
    }

    const activeProjects = projects.filter(p => p.status === 'execution').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget_total || p.total_budget), 0);

    let totalPhysical = 0;
    let totalFinancial = 0;
    let totalExpenses = 0;

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

      // Calculate physical progress from project logs if available
      let physicalProgress = timeProgress;
      const projectLogsData = projectLogs.filter(l => l.project_id === project.id);
      if (projectLogsData.length > 0) {
        const latestLog = projectLogsData
          .filter(log => log.physical_progress !== undefined && log.physical_progress !== null)
          .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())[0];
        if (latestLog && latestLog.physical_progress !== undefined) {
          physicalProgress = latestLog.physical_progress;
        }
      }

      if (project.status === 'execution') {
        totalPhysical += physicalProgress;

        const projectTransactions = transactions.filter(t => t.project_id === project.id);
        const projectExpenses = projectTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.total_cost || 0), 0);
        totalExpenses += projectExpenses;
        const budget = project.budget_total || project.total_budget || 0;
        totalFinancial += budget > 0 ? Math.min(100, (projectExpenses / budget) * 100) : 0;
      }
    });

    const avgPhysicalAdvance = projects.length > 0 ? totalPhysical / projects.length : 0;
    const avgFinancialAdvance = projects.length > 0 ? totalFinancial / projects.length : 0;
    const totalExecuted = totalBudget * (avgFinancialAdvance / 100);
    const budgetVariance = totalBudget - totalExecuted;

    // Calculate utility margin using settings
    const utilityMargin = calculateUtilityMarginHelper(totalBudget, totalExpenses, settings);

    // Integrate EVM metrics if available
    const evmSPI = evmMetrics?.schedulePerformanceIndex || 1;
    const evmCPI = evmMetrics?.costPerformanceIndex || 1;
    const evmSV = evmMetrics?.scheduleVariance || 0;
    const evmCV = evmMetrics?.costVariance || 0;

    return {
      totalProjects: projects.length,
      activeProjects,
      avgPhysicalAdvance,
      avgFinancialAdvance,
      totalBudget,
      totalExecuted,
      budgetVariance,
      utilityMarginPercentage: utilityMargin.marginPercentage,
      utilityMarginTarget: utilityMargin.targetMargin,
      evmSPI,
      evmCPI,
      evmSV,
      evmCV,
    };
  };

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando analytics...</span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <EmptyState
          icon={<Filter className="w-12 h-12 text-white/30" />}
          title="No hay datos para mostrar"
          description="Para ver las gráficas de analytics, primero cree proyectos en el módulo de Gestión de Proyectos."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      {/* CONTENEDOR PRINCIPAL DEL DASHBOARD - Enterprise Glassmorphism 2.0 */}
      <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-500" />
              Dashboard de Control de Obras
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Análisis de alta densidad de datos
            </p>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-zinc-900 dark:text-white text-sm"
          >
            <option value="all">Todos los Proyectos</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        {/* Layout Grid Responsivo de Alta Densidad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* GRÁFICO 1: CURVA "S" (AVANCE FÍSICO VS. FINANCIERO ACUMULADO) */}
          <div className="bg-white/[var(--glass-opacity,0.1)] dark:bg-black/[var(--glass-opacity,0.15)] backdrop-blur-[var(--glass-blur,12px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_0_rgba(0,0,0,0.15)] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                Curva S de Avance Acumulado
              </h2>
              {selectedProject !== 'all' && (
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs">
                  <Clock className="w-3 h-3" />
                  Última actualización: {lastUpdate.toLocaleTimeString('es-GT')}
                </div>
              )}
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="period" 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    className="text-zinc-900 dark:text-white"
                  />
                  <YAxis 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    tickFormatter={(value) => `${value as number}%`}
                    className="text-zinc-900 dark:text-white"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: '500' }}
                    labelStyle={{ color: '#fff', fontWeight: '600' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff', fontWeight: '500' }}
                    iconType="circle"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avancePlanificado" 
                    stroke={COLORS.violet} 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    fill={COLORS.violet}
                    fillOpacity={0.3}
                    name="Avance Planificado %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avanceReal" 
                    stroke={COLORS.cyan} 
                    strokeWidth={3}
                    fill={COLORS.cyan}
                    fillOpacity={0.4}
                    name="Avance Real %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: FLUJO DE CAJA Y PROYECCIÓN (CASH FLOW) */}
          <div className="bg-white/[var(--glass-opacity,0.1)] dark:bg-black/[var(--glass-opacity,0.15)] backdrop-blur-[var(--glass-blur,12px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_0_rgba(0,0,0,0.15)] rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Flujo de Caja y Proyección
            </h2>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="period" 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    className="text-zinc-900 dark:text-white"
                  />
                  <YAxis 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    tickFormatter={(value) => `Q${((value as number) / 1000).toFixed(0)}k`}
                    className="text-zinc-900 dark:text-white"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: '500' }}
                    labelStyle={{ color: '#fff', fontWeight: '600' }}
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff', fontWeight: '500' }}
                    iconType="circle"
                  />
                  <Bar dataKey="ingresos" fill={COLORS.emerald} name="Ingresos" />
                  <Bar dataKey="egresos" fill={COLORS.red} name="Egresos" />
                  <Line 
                    type="monotone" 
                    dataKey="saldoNeto" 
                    stroke={COLORS.amber} 
                    strokeWidth={3}
                    dot={{ fill: COLORS.amber, r: 4 }}
                    name="Saldo Neto"
                  />
                  <ReferenceLine y={0} stroke="currentColor" strokeDasharray="3 3" className="text-zinc-900 dark:text-white" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 3: DESVIACIÓN DE PRESUPUESTO POR CAPÍTULOS (ANÁLISIS APU) */}
          <div className="bg-white/[var(--glass-opacity,0.1)] dark:bg-black/[var(--glass-opacity,0.15)] backdrop-blur-[var(--glass-blur,12px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_0_rgba(0,0,0,0.15)] rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" />
              Desviación de Presupuesto por Capítulos
            </h2>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetDeviationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    type="number" 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    tickFormatter={(value) => `Q${((value as number) / 1000).toFixed(0)}k`}
                    className="text-zinc-900 dark:text-white"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="capitulo" 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    width={100}
                    className="text-zinc-900 dark:text-white"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: '500' }}
                    labelStyle={{ color: '#fff', fontWeight: '600' }}
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff', fontWeight: '500' }}
                    iconType="circle"
                  />
                  <Bar dataKey="presupuestoOriginal" fill={COLORS.cyan} name="Presupuesto Original" />
                  <Bar dataKey="costoRealDevengado" fill={COLORS.amber} name="Costo Real Devengado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 4: DIAGRAMA DE GANTT OPERATIVO (RUTA CRÍTICA) */}
          <div className="bg-white/[var(--glass-opacity,0.1)] dark:bg-black/[var(--glass-opacity,0.15)] backdrop-blur-[var(--glass-blur,12px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_0_rgba(0,0,0,0.15)] rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-500" />
              Diagrama de Gantt Operativo (Ruta Crítica)
            </h2>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ganttData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    type="number" 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value as number}%`}
                    className="text-zinc-900 dark:text-white"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="tarea" 
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    width={120}
                    interval={0}
                    className="text-zinc-900 dark:text-white"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: '500' }}
                    labelStyle={{ color: '#fff', fontWeight: '600' }}
                    formatter={(value) => `${(value as number).toFixed(1)}%`}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill={COLORS.cyan}
                    name="Progreso"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Ruta Crítica</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-cyan-500 rounded" />
                <span>Tarea Normal</span>
              </div>
            </div>
          </div>

          {/* GRÁFICO 5: VELOCIDAD DE CONSUMO DE MATERIALES CRÍTICOS (BURN RATE) */}
          <div className="bg-white/[var(--glass-opacity,0.1)] dark:bg-black/[var(--glass-opacity,0.15)] backdrop-blur-[var(--glass-blur,12px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_0_rgba(0,0,0,0.15)] rounded-xl p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Velocidad de Consumo de Materiales (Burn Rate)
            </h2>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={burnRateData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="nivelActual"
                    name="Nivel Actual"
                  >
                    {burnRateData.map((entry, index) => {
                      const isBelowReorder = entry.nivelActual < entry.puntoReorden;
                      const color = isBelowReorder ? COLORS.red : COLORS.emerald;
                      return (
                        <Cell key={`cell-${index}`} fill={color} />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: '500' }}
                    labelStyle={{ color: '#fff', fontWeight: '600' }}
                    formatter={(value, name, props) => {
                      const material = burnRateData[props.payload?.index]?.material || '';
                      return `${material}: ${value} unidades`;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff', fontWeight: '500' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
              {burnRateData.map((item, index) => {
                const isBelowReorder = item.nivelActual < item.puntoReorden;
                return (
                  <div 
                    key={index}
                    className={`p-2 rounded-lg border ${
                      isBelowReorder 
                        ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <div className="font-medium">{item.material}</div>
                    <div className="text-[10px] mt-1">
                      {item.nivelActual.toFixed(0)} / {item.total.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Metrics Footer */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <div className="bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3">
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Total Proyectos</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{summaryMetrics.totalProjects}</div>
          </div>
          <div className="bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3">
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Activos</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{summaryMetrics.activeProjects}</div>
          </div>
          <div className="bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3">
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Avance Físico</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{formatPercent(summaryMetrics.avgPhysicalAdvance)}</div>
          </div>
          <div className="bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3">
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Avance Financiero</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{formatPercent(summaryMetrics.avgFinancialAdvance)}</div>
          </div>
          <div className="bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3">
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Presupuesto Total</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{formatCurrency(summaryMetrics.totalBudget)}</div>
          </div>
          <div className="bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3">
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Varianza</div>
            <div className={`text-xl font-bold ${summaryMetrics.budgetVariance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(summaryMetrics.budgetVariance)}
            </div>
          </div>
          {/* EVM Metrics */}
          <div className={`bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3 ${summaryMetrics.evmSPI && summaryMetrics.evmSPI < 0.9 ? 'border-amber-500/30' : ''}`}>
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              SPI
            </div>
            <div className={`text-xl font-bold ${summaryMetrics.evmSPI && summaryMetrics.evmSPI >= 1 ? 'text-emerald-500' : summaryMetrics.evmSPI && summaryMetrics.evmSPI < 0.9 ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
              {summaryMetrics.evmSPI?.toFixed(2) || '1.00'}
            </div>
          </div>
          <div className={`bg-white/[var(--glass-opacity,0.05)] dark:bg-black/[var(--glass-opacity,0.1)] border border-white/10 dark:border-zinc-700/20 rounded-lg p-3 ${summaryMetrics.evmCPI && summaryMetrics.evmCPI < 0.9 ? 'border-amber-500/30' : ''}`}>
            <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              CPI
            </div>
            <div className={`text-xl font-bold ${summaryMetrics.evmCPI && summaryMetrics.evmCPI >= 1 ? 'text-emerald-500' : summaryMetrics.evmCPI && summaryMetrics.evmCPI < 0.9 ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
              {summaryMetrics.evmCPI?.toFixed(2) || '1.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
