'use client';

import { calculateUtilityMargin, FinancialSettings } from '@/lib/calculators/utilityMargin';
import { 
  LocalProject, 
  LocalFinancialTransaction, 
  LocalPayrollEmployee, 
  LocalWarehouseStock,
  LocalProjectLog,
  LocalBudgetItem,
  LocalBudget,
  LocalPurchaseOrder,
  LocalPayrollRecord,
  LocalClient,
  LocalSupplier,
  LocalPurchaseOrderItem
} from '@/lib/db/offlineStore';
import { UISettings } from '@/lib/types/uiSettings';

export interface DashboardStatsInput {
  projects: LocalProject[];
  transactions: LocalFinancialTransaction[];
  employees: LocalPayrollEmployee[];
  stockItems: LocalWarehouseStock[];
  settings: UISettings;
  selectedProject?: string;
}

export interface DashboardStatsResult {
  visibleProjects: LocalProject[];
  visibleTransactions: LocalFinancialTransaction[];
  activeProjects: LocalProject[];
  totalBudget: number;
  totalSpent: number;
  activeEmployees: number;
  lowStockItems: number;
  utilityMargin: { marginPercentage: number; targetMargin: number; isOnTarget: boolean; variance: number };
}

export interface DashboardChartsMetricsInput {
  projects: LocalProject[];
  transactions: LocalFinancialTransaction[];
  projectLogs: LocalProjectLog[];
  settings: UISettings;
  evmMetrics?: {
    schedulePerformanceIndex?: number;
    costPerformanceIndex?: number;
    scheduleVariance?: number;
    costVariance?: number;
  };
}

export interface SummaryMetrics {
  totalProjects: number;
  activeProjects: number;
  avgPhysicalAdvance: number;
  avgFinancialAdvance: number;
  totalBudget: number;
  totalExecuted: number;
  budgetVariance: number;
  utilityMarginPercentage: number;
  utilityMarginTarget: number;
  evmSPI: number;
  evmCPI: number;
  evmSV: number;
  evmCV: number;
}

export interface BudgetComparisonInput {
  budget: LocalBudget;
  items: LocalBudgetItem[];
  transactions: LocalFinancialTransaction[];
}

export interface BudgetComparisonResult {
  estimatedTotal: number;
  actualTotal: number;
  variance: number;
  byCategory: {
    materiales: { estimated: number; actual: number };
    mano_de_obra: { estimated: number; actual: number };
    otros: { estimated: number; actual: number };
  };
}

export interface WarehouseSummaryResult {
  totalItems: number;
  lowStockCount: number;
  totalInventoryValue: number;
  totalUnits: number;
}

export interface PayrollSummaryResult {
  totalEmployees: number;
  totalMonthlyPayroll: number;
  totalBenefits: number;
  total_cost: number;
}

export interface ProgressMetrics {
  physicalProgress: number;
  financialProgress: number;
  variance: number;
  spentAmount: number;
  estimatedSpent: number;
  remainingBudget: number;
  daysElapsed: number;
  totalDays: number;
  timeProgress: number;
}

export const calculateSummaryMetrics = (input: DashboardChartsMetricsInput): SummaryMetrics => {
  const { projects, transactions, projectLogs, settings, evmMetrics } = input;

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

  // CORRECCIÓN: Usar calculateUtilityMargin directamente (fuente única de verdad)
  const financialSettings: FinancialSettings = {
    indirectPercentage: settings.financial.indirectPercentage,
    contingencyPercentage: settings.financial.contingencyPercentage,
    profitPercentage: settings.financial.profitPercentage,
  };
  const utilityMargin = calculateUtilityMargin(totalBudget, totalExpenses, financialSettings);

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
    evmSPI: evmMetrics?.schedulePerformanceIndex || 1,
    evmCPI: evmMetrics?.costPerformanceIndex || 1,
    evmSV: evmMetrics?.scheduleVariance || 0,
    evmCV: evmMetrics?.costVariance || 0,
  };
};


export const calculateDashboardStats = (input: DashboardStatsInput): DashboardStatsResult => {
  const { projects, transactions, employees, stockItems, settings, selectedProject = 'all' } = input;

  const visibleProjects = selectedProject === 'all'
    ? projects.filter(p => p.status === 'execution' || p.status === 'planning')
    : projects.filter(p => p.id === selectedProject);

  const visibleProjectIds = new Set(visibleProjects.map(p => p.id));
  const visibleTransactions = selectedProject === 'all'
    ? transactions
    : transactions.filter(t => (t.project_id || '').trim() !== '' && visibleProjectIds.has(t.project_id || ''));

  const activeProjects = visibleProjects.filter(p => p.status === 'execution' || p.status === 'planning');
  const totalBudget = visibleProjects.reduce((sum, p) => sum + (p.total_budget || p.budget_total || 0), 0);
  const totalSpent = visibleTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.total_cost || 0), 0);
  const activeEmployees = employees.filter(e => e.active).length;
  const lowStockItems = stockItems.filter(s => s.current_stock <= s.minimum_threshold).length;

  // CORRECCIÓN: Usar calculateUtilityMargin directamente (fuente única de verdad)
  const financialSettings: FinancialSettings = {
    indirectPercentage: settings.financial.indirectPercentage,
    contingencyPercentage: settings.financial.contingencyPercentage,
    profitPercentage: settings.financial.profitPercentage,
  };
  const utilityMargin = calculateUtilityMargin(totalBudget, totalSpent, financialSettings);

  return {
    visibleProjects,
    visibleTransactions,
    activeProjects,
    totalBudget,
    totalSpent,
    activeEmployees,
    lowStockItems,
    utilityMargin,
  };
};


export const calculateBudgetComparison = (input: BudgetComparisonInput): BudgetComparisonResult => {
  const { budget, items, transactions } = input;

  const actualTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const estimatedMaterials = items.reduce((sum, item) => {
    if (item.apu_result?.breakdown) {
      return sum + (item.apu_result.breakdown.materials || 0);
    }
    return sum;
  }, 0);

  const estimatedLabor = items.reduce((sum, item) => {
    if (item.apu_result?.breakdown) {
      return sum + (item.apu_result.breakdown.labor || 0);
    }
    return sum;
  }, 0);

  const estimatedOthers = items.reduce((sum, item) => {
    if (item.apu_result?.breakdown) {
      return sum + (item.apu_result.breakdown.machinery || 0);
    }
    return sum + item.total_cost;
  }, 0);

  const actualMaterials = transactions
    .filter(t => t.category === 'materiales')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const actualLabor = transactions
    .filter(t => t.category === 'mano_de_obra')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const actualOthers = transactions
    .filter(t => !['materiales', 'mano_de_obra'].includes(t.category))
    .reduce((sum, t) => sum + t.total_cost, 0);

  return {
    estimatedTotal: budget.total_amount,
    actualTotal,
    variance: budget.total_amount - actualTotal,
    byCategory: {
      materiales: { estimated: estimatedMaterials, actual: actualMaterials },
      mano_de_obra: { estimated: estimatedLabor, actual: actualLabor },
      otros: { estimated: estimatedOthers, actual: actualOthers },
    },
  };
};

export const calculateWarehouseSummary = (stockItems: LocalWarehouseStock[]): WarehouseSummaryResult => {
  const totalItems = stockItems.length;
  const lowStockItems = stockItems.filter(item => item.current_stock <= item.minimum_threshold);
  const totalInventoryValue = stockItems.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);
  const totalUnits = stockItems.reduce((sum, item) => sum + item.current_stock, 0);

  return {
    totalItems,
    lowStockCount: lowStockItems.length,
    totalInventoryValue,
    totalUnits,
  };
};


export const calculateFinanceSummary = (transactions: LocalFinancialTransaction[]) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const balance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    balance,
  };
};


const calculateGuatemalanBenefits = (baseSalary: number) => {
  const igssRate = 0.0483;
  const aguinaldoRate = 0.0833;
  const vacacionesRate = 0.0417;
  const igssDeduction = baseSalary * igssRate;
  const aguinaldo = baseSalary * aguinaldoRate;
  const vacaciones = baseSalary * vacacionesRate;
  return {
    igss: igssDeduction,
    aguinaldo,
    vacaciones,
    totalBenefits: aguinaldo + vacaciones,
    netSalary: baseSalary - igssDeduction,
  };
};

export const calculatePayrollSummary = (employees: LocalPayrollEmployee[]): PayrollSummaryResult => {
  const activeEmployees = employees.filter(e => e.active);
  const totalMonthlyPayroll = activeEmployees.reduce((sum, e) => sum + (e.daily_rate * 30), 0);
  const totalBenefits = activeEmployees.reduce((sum, e) => {
    const benefits = calculateGuatemalanBenefits(e.daily_rate * 30);
    return sum + benefits.totalBenefits;
  }, 0);

  return {
    totalEmployees: activeEmployees.length,
    totalMonthlyPayroll,
    totalBenefits,
    total_cost: totalMonthlyPayroll + totalBenefits,
  };
};

export const calculateProgressMetrics = (input: {
  project: LocalProject;
  transactions: LocalFinancialTransaction[];
  activeBudget: LocalBudget;
  projectLogs: LocalProjectLog[];
}): ProgressMetrics => {
  const { project, transactions, activeBudget, projectLogs } = input;

  const spentAmount = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const budgetTotal = activeBudget.total_amount || activeBudget.direct_cost * (1 + activeBudget.indirect_percentage / 100);
  const financialProgress = budgetTotal > 0 ? (spentAmount / budgetTotal) * 100 : 0;

  const startDate = project.start_date ? new Date(project.start_date) : new Date();
  const endDate = project.estimated_end_date
    ? new Date(project.estimated_end_date)
    : new Date(startDate.getTime() + (project.duration_days * 24 * 60 * 60 * 1000));

  const now = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeProgress = (daysElapsed / totalDays) * 100;

  let physicalProgress: number;
  if (projectLogs.length > 0) {
    const latestLog = projectLogs
      .filter(log => log.physical_progress !== undefined && log.physical_progress !== null)
      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())[0];

    if (latestLog && latestLog.physical_progress !== undefined) {
      physicalProgress = latestLog.physical_progress;
    } else {
      physicalProgress = Math.min(100, timeProgress);
    }
  } else {
    physicalProgress = Math.min(100, timeProgress);
  }

  const estimatedSpent = (budgetTotal * physicalProgress) / 100;
  const variance = physicalProgress - financialProgress;
  const remainingBudget = budgetTotal - spentAmount;

  return {
    physicalProgress,
    financialProgress,
    variance,
    spentAmount,
    estimatedSpent,
    remainingBudget,
    daysElapsed,
    totalDays,
    timeProgress,
  };
};

export const calculatePurchaseOrderSummary = (orders: LocalPurchaseOrder[], financial: unknown) => ({
  totalOrders: orders.length,
  pending: orders.filter((o) => o.status === 'pending').length,
  pendingApproval: orders.filter((o) => o.status === 'pending_approval').length,
  approved: orders.filter((o) => o.status === 'approved').length,
  received: orders.filter((o) => o.status === 'received').length,
  totalAmount: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
});

export const calculateSupplierSummary = (suppliers: LocalSupplier[]) => ({
  totalSuppliers: suppliers.length,
  active: suppliers.length,
  contacts: suppliers.length,
});

export const calculateClientSummary = (clients: LocalClient[]) => ({
  totalClients: clients.length,
  corporate: clients.filter((c) => c.client_type === 'corporate').length,
  individual: clients.filter((c) => c.client_type === 'individual').length,
});

export const calculateProjectLogSummary = (logs: LocalProjectLog[]) => ({
  totalEntries: logs.length,
  advances: logs.filter((l) => l.activity_type === 'progress').length,
  issues: logs.filter((l) => l.activity_type === 'issue').length,
  milestones: logs.filter((l) => l.activity_type === 'milestone').length,
});
