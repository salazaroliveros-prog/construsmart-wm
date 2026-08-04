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
  Zap,
  Users,
  FolderOpen
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
  Pie,
  PieChart,
  Cell,
  ReferenceLine
} from 'recharts';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalWarehouseStock, LocalProjectLog, LocalBudgetItem, LocalBudget, LocalPurchaseOrder, LocalPayrollRecord, LocalClient, LocalSupplier, LocalPurchaseOrderItem, LocalPayrollEmployee } from '@/lib/db/offlineStore';
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

interface PurchaseOrderData {
  periodo: string;
  pendientes: number;
  aprobadas: number;
  ordenadas: number;
  recibidas: number;
  totalAmount: number;
}

interface PayrollData {
  periodo: string;
  totalNomina: number;
  empleadosActivos: number;
  horasExtra: number;
}

interface ClientData {
  periodo: string;
  nuevosClientes: number;
  clientesActivos: number;
  saldoPendiente: number;
}

interface SupplierData {
  periodo: string;
  ordenesPorProveedor: number;
  montoTotalCompras: number;
  proveedoresActivos: number;
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
  evmSPI?: number;
  evmCPI?: number;
  evmSV?: number;
  evmCV?: number;
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

export default function DashboardCharts() {
  // ==================== STATE ====================
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<LocalWarehouseStock[]>([]);
  const [projectLogs, setProjectLogs] = useState<LocalProjectLog[]>([]);
  const [budgetItems, setBudgetItems] = useState<LocalBudgetItem[]>([]);
  const [budgets, setBudgets] = useState<LocalBudget[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<LocalPurchaseOrder[]>([]);
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<LocalPurchaseOrderItem[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<LocalPayrollRecord[]>([]);
  const [payrollEmployees, setPayrollEmployees] = useState<LocalPayrollEmployee[]>([]);
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
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
  const [purchaseOrderData, setPurchaseOrderData] = useState<PurchaseOrderData[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
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
    loadPurchaseOrders();
    loadPurchaseOrderItems();
    loadPayrollRecords();
    loadPayrollEmployees();
    loadClients();
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedProject]);

  useEffect(() => {
    loadAnalyticsData();
  }, [settings]);

  useEffect(() => {
    if (selectedProject && selectedProject !== 'all') {
      analyzeProject(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject === 'all' && cumulativeCosts.size > 0) {
      const filteredProjects = projects;
      setSCurveData(generateSCurveData(filteredProjects));
    }
  }, [cumulativeCosts, selectedProject, projects]);

  useRealtimeRefresh(['projects', 'financial_transactions', 'warehouse_stock', 'project_logs', 'budget_items', 'budgets', 'purchase_orders', 'purchase_order_items', 'payroll_records', 'payroll_employees', 'clients', 'suppliers'], () => {
    loadProjects();
    loadTransactions();
    loadWarehouseStock();
    loadProjectLogs();
    loadBudgetItems();
    loadBudgets();
    loadPurchaseOrders();
    loadPurchaseOrderItems();
    loadPayrollRecords();
    loadPayrollEmployees();
    loadClients();
    loadSuppliers();
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

  const loadPurchaseOrders = async () => {
    try {
      const data = await offlineDB.purchaseOrders.toArray();
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const loadPurchaseOrderItems = async () => {
    try {
      const data = await offlineDB.purchaseOrderItems.toArray();
      setPurchaseOrderItems(data);
    } catch (error) {
      console.error('Error loading purchase order items:', error);
    }
  };

  const loadPayrollRecords = async () => {
    try {
      const data = await offlineDB.payrollRecords.toArray();
      setPayrollRecords(data);
    } catch (error) {
      console.error('Error loading payroll records:', error);
    }
  };

  const loadPayrollEmployees = async () => {
    try {
      const data = await offlineDB.payrollEmployees.toArray();
      setPayrollEmployees(data);
    } catch (error) {
      console.error('Error loading payroll employees:', error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await offlineDB.clients.toArray();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await offlineDB.suppliers.toArray();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
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
      setPurchaseOrderData(generatePurchaseOrderData(filteredProjects));
      setPayrollData(generatePayrollData(filteredProjects));
      setClientData(generateClientData(filteredProjects));
      setSupplierData(generateSupplierData(filteredProjects));
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
    setPurchaseOrderData([]);
    setPayrollData([]);
    setClientData([]);
    setSupplierData([]);
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

  // GRÁFICO 1: Curva S (Avance Físico vs Financiero Acumulado)
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

  // GRÁFICO 2: Flujo de Caja
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

  // GRÁFICO 3: Desviación de Presupuesto por Capítulos
  const generateBudgetDeviationData = (projects: LocalProject[]): BudgetDeviationData[] => {
    if (projects.length === 0) return [];

    const capitulos = ['Cimentación', 'Estructura', 'Acabados', 'Instalaciones', 'Otros'];
    return capitulos.map(capitulo => {
      let totalPresupuesto = 0;
      let totalReal = 0;

      projects.forEach(project => {
        const projectBudget = budgets.find(b => b.project_id === project.id);
        if (!projectBudget) return;

        const projectBudgetItems = budgetItems.filter(bi => bi.budget_id === projectBudget.id);

        const capituloKeywords: Record<string, string[]> = {
          'Cimentación': ['cimentación', 'fundación', 'cemento', 'zapata', 'losa', 'concreto'],
          'Estructura': ['estructura', 'acero', 'varilla', 'columna', 'viga', 'hierro'],
          'Acabados': ['acabado', 'piso', 'muro', 'yeso', 'pintura', 'revestimiento'],
          'Instalaciones': ['instalación', 'eléctrico', 'sanitario', 'plomería', 'tubería'],
          'Otros': []
        };

        projectBudgetItems.forEach(item => {
          const description = item.description?.toLowerCase() || '';
          const keywords = capituloKeywords[capitulo] || [];
          if (keywords.some(kw => description.includes(kw))) {
            totalPresupuesto += item.total_cost || 0;
          }
        });

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

  // GRÁFICO 4: Diagrama de Gantt
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

    return tasks.slice(0, 12);
  };

  // GRÁFICO 5: Burn Rate
  const generateBurnRateData = (projects: LocalProject[]): MaterialBurnRateData[] => {
    if (projects.length === 0) return [];

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

      const materialStock = warehouseStock.filter(s => {
        const description = s.description?.toLowerCase() || '';
        return keywords.some(kw => description.includes(kw));
      });

      const totalQuantity = materialStock.reduce((sum, s) => sum + (s.current_stock || 0), 0);
      const minThreshold = materialStock.reduce((sum, s) => sum + (s.minimum_threshold || 0), 0);
      const maxStock = materialStock.reduce((sum, s) => sum + (s.minimum_threshold || 0) * 5, 0);

      return {
        material,
        nivelActual: totalQuantity,
        puntoReorden: minThreshold || (totalQuantity * 0.2),
        total: maxStock || (totalQuantity * 1.25),
      };
    });
  };

  // GRÁFICO 6: Estado de Órdenes de Compra
  const generatePurchaseOrderData = (projects: LocalProject[]): PurchaseOrderData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: currentMonth + 1 }, (_, index) => {
      let pendientes = 0;
      let aprobadas = 0;
      let ordenadas = 0;
      let recibidas = 0;
      let totalAmount = 0;

      projects.forEach(project => {
        const projectOrders = purchaseOrders.filter(po => po.project_id === project.id);
        const monthOrders = projectOrders.filter(po => {
          const orderDate = new Date(po.order_date);
          return orderDate.getMonth() === index && orderDate.getFullYear() === currentDate.getFullYear();
        });

        monthOrders.forEach(order => {
          totalAmount += order.total_amount || 0;
          if (order.status === 'pending') pendientes++;
          else if (order.status === 'approved') aprobadas++;
          else if (order.status === 'ordered') ordenadas++;
          else if (order.status === 'received') recibidas++;
        });
      });

      return {
        periodo: months[index],
        pendientes,
        aprobadas,
        ordenadas,
        recibidas,
        totalAmount,
      };
    });
  };

  // GRÁFICO 7: Nómina por Periodo
  const generatePayrollData = (projects: LocalProject[]): PayrollData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: currentMonth + 1 }, (_, index) => {
      let totalNomina = 0;
      let empleadosActivos = 0;
      let horasExtra = 0;

      projects.forEach(project => {
        const projectPayroll = payrollRecords.filter(pr => pr.project_id === project.id);
        const monthPayroll = projectPayroll.filter(pr => {
          const periodStart = new Date(pr.period_start);
          return periodStart.getMonth() === index && periodStart.getFullYear() === currentDate.getFullYear();
        });

        monthPayroll.forEach(record => {
          totalNomina += record.net_salary || 0;
          empleadosActivos += 1;
          horasExtra += record.overtime_hours || 0;
        });
      });

      return {
        periodo: months[index],
        totalNomina,
        empleadosActivos,
        horasExtra,
      };
    });
  };

  // GRÁFICO 8: Clientes por Periodo
  const generateClientData = (projects: LocalProject[]): ClientData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: currentMonth + 1 }, (_, index) => {
      let nuevosClientes = 0;
      let clientesActivos = 0;
      let saldoPendiente = 0;

      const monthClients = clients.filter(c => {
        const createdAt = new Date(c.created_at || '');
        return createdAt.getMonth() === index && createdAt.getFullYear() === currentDate.getFullYear();
      });
      nuevosClientes = monthClients.length;

      clientesActivos = clients.filter(c => !c.is_delinquent).length;

      saldoPendiente = clients.reduce((sum, c) => sum + (c.account_balance || 0), 0);

      return {
        periodo: months[index],
        nuevosClientes,
        clientesActivos,
        saldoPendiente,
      };
    });
  };

  // GRÁFICO 9: Proveedores por Periodo
  const generateSupplierData = (projects: LocalProject[]): SupplierData[] => {
    if (projects.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: currentMonth + 1 }, (_, index) => {
      let ordenesPorProveedor = 0;
      let montoTotalCompras = 0;
      let proveedoresActivos = 0;

      projects.forEach(project => {
        const projectOrders = purchaseOrders.filter(po => po.project_id === project.id);
        const monthOrders = projectOrders.filter(po => {
          const orderDate = new Date(po.order_date);
          return orderDate.getMonth() === index && orderDate.getFullYear() === currentDate.getFullYear();
        });

        monthOrders.forEach(order => {
          ordenesPorProveedor += 1;
          montoTotalCompras += order.total_amount || 0;
        });
      });

      proveedoresActivos = suppliers.filter(s => s.is_preferred).length;

      return {
        periodo: months[index],
        ordenesPorProveedor,
        montoTotalCompras,
        proveedoresActivos,
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

    const utilityMargin = calculateUtilityMarginHelper(totalBudget, totalExpenses, settings);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64">
        <EmptyState
          icon={<Filter className="w-12 h-12 text-white/30" />}
          title="No hay datos para mostrar"
          description="Para ver las gráficas, primero cree proyectos en el módulo de Gestión de Proyectos."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Project Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-500" />
          Dashboard de Control de Obras
        </h2>
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
        <div className="glass-panel rounded-lg p-2">
          <div className="text-zinc-400 text-[10px] mb-1">Total Proyectos</div>
          <div className="text-lg font-bold text-white">{summaryMetrics.totalProjects}</div>
        </div>
        <div className="glass-panel rounded-lg p-2">
          <div className="text-zinc-400 text-[10px] mb-1">Activos</div>
          <div className="text-lg font-bold text-white">{summaryMetrics.activeProjects}</div>
        </div>
        <div className="glass-panel rounded-lg p-2">
          <div className="text-zinc-400 text-[10px] mb-1">Avance Físico</div>
          <div className="text-lg font-bold text-white">{formatPercent(summaryMetrics.avgPhysicalAdvance)}</div>
        </div>
        <div className="glass-panel rounded-lg p-2">
          <div className="text-zinc-400 text-[10px] mb-1">Avance Financiero</div>
          <div className="text-lg font-bold text-white">{formatPercent(summaryMetrics.avgFinancialAdvance)}</div>
        </div>
        <div className="glass-panel rounded-lg p-2">
          <div className="text-zinc-400 text-[10px] mb-1">Presupuesto Total</div>
          <div className="text-lg font-bold text-white">{formatCurrency(summaryMetrics.totalBudget)}</div>
        </div>
        <div className="glass-panel rounded-lg p-2">
          <div className="text-zinc-400 text-[10px] mb-1">Varianza</div>
          <div className={`text-lg font-bold ${summaryMetrics.budgetVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(summaryMetrics.budgetVariance)}
          </div>
        </div>
        <div className={`glass-panel rounded-lg p-2 ${summaryMetrics.evmSPI && summaryMetrics.evmSPI < 0.9 ? 'border-amber-500/30' : ''}`}>
          <div className="text-zinc-400 text-[10px] mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" />
            SPI
          </div>
          <div className={`text-lg font-bold ${summaryMetrics.evmSPI && summaryMetrics.evmSPI >= 1 ? 'text-emerald-400' : summaryMetrics.evmSPI && summaryMetrics.evmSPI < 0.9 ? 'text-amber-400' : 'text-white'}`}>
            {summaryMetrics.evmSPI?.toFixed(2) || '1.00'}
          </div>
        </div>
        <div className={`glass-panel rounded-lg p-2 ${summaryMetrics.evmCPI && summaryMetrics.evmCPI < 0.9 ? 'border-amber-500/30' : ''}`}>
          <div className="text-zinc-400 text-[10px] mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            CPI
          </div>
          <div className={`text-lg font-bold ${summaryMetrics.evmCPI && summaryMetrics.evmCPI >= 1 ? 'text-emerald-400' : summaryMetrics.evmCPI && summaryMetrics.evmCPI < 0.9 ? 'text-amber-400' : 'text-white'}`}>
            {summaryMetrics.evmCPI?.toFixed(2) || '1.00'}
          </div>
        </div>
      </div>

      {/* Charts Grid with Scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 custom-scrollbar">
        
        {/* GRÁFICO 1: CURVA S */}
        <div className="glass-panel rounded-xl p-4 col-span-2">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            Curva S de Avance Acumulado
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(value) => `${value}%`} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Area type="monotone" dataKey="avancePlanificado" stroke={COLORS.violet} strokeWidth={2} strokeDasharray="5 5" fill={COLORS.violet} fillOpacity={0.3} name="Avance Planificado %" />
                <Area type="monotone" dataKey="avanceReal" stroke={COLORS.cyan} strokeWidth={2} fill={COLORS.cyan} fillOpacity={0.3} name="Avance Real %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: FLUJO DE CAJA */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Flujo de Caja
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value, name) => name === 'saldoNeto' ? formatCurrency(Number(value)) : value} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Bar dataKey="ingresos" fill={COLORS.emerald} name="Ingresos" />
                <Bar dataKey="egresos" fill={COLORS.red} name="Egresos" />
                <Line type="monotone" dataKey="saldoNeto" stroke={COLORS.cyan} strokeWidth={2} name="Saldo Neto" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: DESVIACIÓN DE PRESUPUESTO */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            Desviación de Presupuesto
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetDeviationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`} className="text-white" />
                <YAxis type="category" dataKey="capitulo" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={100} interval={0} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Bar dataKey="presupuestoOriginal" fill={COLORS.cyan} name="Presupuesto Original" />
                <Bar dataKey="costoRealDevengado" fill={COLORS.amber} name="Costo Real Devengado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 4: GANTT */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            Diagrama de Gantt
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganttData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} className="text-white" />
                <YAxis type="category" dataKey="tarea" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={120} interval={0} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value) => `${(value as number).toFixed(1)}%`} />
                <Bar dataKey="progress" fill={COLORS.cyan} name="Progreso" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 5: BURN RATE */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Consumo de Materiales
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={burnRateData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="nivelActual" name="Nivel Actual">
                  {burnRateData.map((entry, index) => {
                    const isBelowReorder = entry.nivelActual < entry.puntoReorden;
                    const color = isBelowReorder ? COLORS.red : COLORS.emerald;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value, name, props) => {
                  const material = burnRateData[props.payload?.index]?.material || '';
                  return `${material}: ${value} unidades`;
                }} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 6: ÓRDENES DE COMPRA */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-500" />
            Órdenes de Compra
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchaseOrderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="periodo" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Bar dataKey="pendientes" fill={COLORS.amber} name="Pendientes" />
                <Bar dataKey="aprobadas" fill={COLORS.cyan} name="Aprobadas" />
                <Bar dataKey="ordenadas" fill={COLORS.violet} name="Ordenadas" />
                <Bar dataKey="recibidas" fill={COLORS.emerald} name="Recibidas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 7: NÓMINA */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            Nómina por Periodo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={payrollData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="periodo" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis yAxisId="left" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`} className="text-white" />
                <YAxis yAxisId="right" orientation="right" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value, name) => {
                  if (name === 'totalNomina') return formatCurrency(value as number);
                  return value;
                }} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="totalNomina" fill={COLORS.emerald} name="Total Nómina" />
                <Line yAxisId="right" type="monotone" dataKey="empleadosActivos" stroke={COLORS.cyan} strokeWidth={2} name="Empleados Activos" />
                <Line yAxisId="right" type="monotone" dataKey="horasExtra" stroke={COLORS.amber} strokeWidth={2} name="Horas Extra" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 8: CLIENTES */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-500" />
            Clientes por Periodo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="periodo" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis yAxisId="left" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis yAxisId="right" orientation="right" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value, name) => {
                  if (name === 'saldoPendiente') return formatCurrency(value as number);
                  return value;
                }} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="nuevosClientes" fill={COLORS.cyan} name="Nuevos Clientes" />
                <Line yAxisId="left" type="monotone" dataKey="clientesActivos" stroke={COLORS.emerald} strokeWidth={2} name="Clientes Activos" />
                <Line yAxisId="right" type="monotone" dataKey="saldoPendiente" stroke={COLORS.amber} strokeWidth={2} name="Saldo Pendiente" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 9: PROVEEDORES */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-500" />
            Proveedores por Periodo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={supplierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="periodo" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis yAxisId="left" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} className="text-white" />
                <YAxis yAxisId="right" orientation="right" stroke="currentColor" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`} className="text-white" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} formatter={(value, name) => {
                  if (name === 'montoTotalCompras') return formatCurrency(value as number);
                  return value;
                }} />
                <Legend wrapperStyle={{ color: '#fff', fontWeight: '500' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="ordenesPorProveedor" fill={COLORS.violet} name="Órdenes por Proveedor" />
                <Line yAxisId="right" type="monotone" dataKey="montoTotalCompras" stroke={COLORS.emerald} strokeWidth={2} name="Monto Total Compras" />
                <Line yAxisId="left" type="monotone" dataKey="proveedoresActivos" stroke={COLORS.cyan} strokeWidth={2} name="Proveedores Activos" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
