'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowDownCircle, ArrowUpCircle, Calendar, X, Save, Inbox, Calculator } from 'lucide-react';
import { offlineDB, LocalFinancialTransaction, LocalProject, LocalBudget, LocalBudgetItem } from '@/lib/db/offlineStore';
import { budgetState } from '@/lib/state/budgetState';
import { supabase } from '@/lib/supabase/client';
import { queueDelete, PENDING_STATUSES, isServerId } from '@/lib/utils/offlineSync';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { generateId } from '@/lib/utils/generateId';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useIncrementalList } from '@/lib/hooks/useIncrementalList';
import { formatCurrency, useFinancialSettings } from '@/lib/hooks/useBusinessSettings';
import { calculateBudgetComparison, calculateFinanceSummary } from '@/lib/utils/summaryCalculations';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import OnboardingTooltip from '@/components/ui/OnboardingTooltip';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { financialTransactionSchema, validateSchema, formatValidationErrors } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth/userId';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';
import { FINANCIAL_CATEGORY_COLORS, getFinancialCategoryColor } from '@/lib/config/colorPalettes';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TransactionFormData {
  project_id?: string;
  budget_item_id?: string; // ✅ NUEVO: Vínculo a renglón presupuestario
  type: 'income' | 'expense';
  category: 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' | 'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra' | 'Gastos Operativos / Nómina de Mano de Obra';
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  date: string;
  receipt_url?: string;
  payment_method?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'anticipo';
  tax_amount?: number;
  related_supplier_id?: string;
  related_client_id?: string;
  related_purchase_order_id?: string;
  document_number?: string;
  is_reconciled?: boolean;
}

const categoryLabels: Record<string, string> = {
  materiales: 'Materiales',
  mano_de_obra: 'Mano de Obra',
  herramienta: 'Herramienta',
  sub_contrato: 'Sub Contrato',
  administrativo: 'Administrativo',
  personal: 'Personal',
  transporte: 'Transporte',
  fijos: 'Fijos',
  hogar: 'Hogar',
  aporte: 'Aporte',
  trabajos_extra: 'Trabajos Extra',
  'Gastos Operativos / Nómina de Mano de Obra': 'Nómina de Mano de Obra'
};

// Helper para convertir color hex a rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper para obtener color RGB más claro
const hexToLightRgb = (hex: string): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 80);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 80);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 80);
  return `rgb(${r}, ${g}, ${b})`;
};

// Colores de categorías basados en paleta centralizada
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  materiales: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.materiales, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.materiales), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.materiales, 0.3) },
  mano_de_obra: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.mano_de_obra, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.mano_de_obra), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.mano_de_obra, 0.3) },
  herramienta: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.herramienta, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.herramienta), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.herramienta, 0.3) },
  sub_contrato: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.sub_contrato, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.sub_contrato), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.sub_contrato, 0.3) },
  administrativo: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.administrativo, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.administrativo), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.administrativo, 0.3) },
  personal: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.personal, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.personal), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.personal, 0.3) },
  transporte: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.transporte, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.transporte), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.transporte, 0.3) },
  fijos: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.fijos, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.fijos), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.fijos, 0.3) },
  hogar: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.hogar, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.hogar), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.hogar, 0.3) },
  aporte: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.aporte, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.aporte), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.aporte, 0.3) },
  trabajos_extra: { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS.trabajos_extra, 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS.trabajos_extra), border: hexToRgba(FINANCIAL_CATEGORY_COLORS.trabajos_extra, 0.3) },
  'Gastos Operativos / Nómina de Mano de Obra': { bg: hexToRgba(FINANCIAL_CATEGORY_COLORS['Gastos Operativos / Nómina de Mano de Obra'], 0.2), text: hexToLightRgb(FINANCIAL_CATEGORY_COLORS['Gastos Operativos / Nómina de Mano de Obra']), border: hexToRgba(FINANCIAL_CATEGORY_COLORS['Gastos Operativos / Nómina de Mano de Obra'], 0.3) }
};

export default function FinanceManager() {
  const { showToast } = useToast();
  const { financial } = useFinancialSettings();
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LocalFinancialTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<LocalFinancialTransaction | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Budget Integration State
  const [activeBudget, setActiveBudget] = useState<LocalBudget | null>(null);
  const [budgetItems, setBudgetItems] = useState<LocalBudgetItem[]>([]);
  const [budgetComparison, setBudgetComparison] = useState<{
    estimatedTotal: number;
    actualTotal: number;
    variance: number;
    byCategory: {
      materiales: { estimated: number; actual: number };
      mano_de_obra: { estimated: number; actual: number };
      otros: { estimated: number; actual: number };
    };
  } | null>(null);

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    category: 'materiales',
    description: '',
    quantity: 1,
    unit: 'unid',
    unit_cost: 0,
    date: new Date().toISOString().split('T')[0],
    receipt_url: '',
    payment_method: 'transferencia',
    tax_amount: 0,
    is_reconciled: false,
    budget_item_id: undefined, // ✅ NUEVO
  });

  const [availableProjects, setAvailableProjects] = useState<LocalProject[]>([]);

  useEffect(() => {
    loadTransactions();
    loadProjects();
    checkOnlineStatus();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load budget when project changes
  useEffect(() => {
    loadBudgetForProject(selectedProject);
  }, [selectedProject, transactions]);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const loadTransactions = async () => {
    try {
      const userId = await getUserScope();
      const localTransactions = scopeLocalRows(await offlineDB.financialTransactions.toArray(), userId);
      setTransactions(localTransactions);


} catch (error) {
      console.error('Error loading transactions:', error);
      showToast('error', 'Error al cargar transacciones financieras');
    }
  };

  const loadProjects = async () => {
    try {
      const userId = await getUserScope();
      const projects = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      const executionProjects = projects.filter(p => p.status === 'execution');
      setAvailableProjects(executionProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('error', 'Error al cargar proyectos');
    }
  };

  // Load active budget for selected project
  const loadBudgetForProject = async (projectId: string) => {
    if (projectId === 'all') {
      setActiveBudget(null);
      setBudgetItems([]);
      setBudgetComparison(null);
      return;
    }

    try {
      // Validar propiedad del proyecto antes de exponer su presupuesto
      const userId = await getUserScope();
      const userProjects = scopeLocalRows(
        await offlineDB.projects.where('id').equals(projectId).toArray(),
        userId
      );
      if (userProjects.length === 0) {
        setActiveBudget(null);
        setBudgetItems([]);
        showToast('error', 'Proyecto no válido o sin permisos');
        return;
      }

      // Get the latest budget for the project
      const budgets = scopeLocalRows(
        await offlineDB.budgets.where('project_id').equals(projectId).toArray(),
        userId
      );

      if (budgets.length > 0) {
        const budget = budgets[budgets.length - 1];
        setActiveBudget(budget);

        // Load budget items with APU data
        const items = scopeLocalRows(
          await offlineDB.budgetItems.where('budget_id').equals(budget.id as string).toArray(),
          userId
        );
        setBudgetItems(items);

        // Calculate budget vs actual comparison using centralized calculator
        const projectTransactions = transactions.filter(t => t.project_id === projectId);
        const budgetComparison = calculateBudgetComparison({
          budget,
          items,
          transactions: projectTransactions,
        });
        setBudgetComparison(budgetComparison);
      } else {
        setActiveBudget(null);
        setBudgetItems([]);
        setBudgetComparison(null);
      }
} catch (error) {
      console.error('Error loading budget:', error);
      showToast('error', 'Error al cargar presupuesto del proyecto');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: 'materiales',
      description: '',
      quantity: 1,
      unit: 'unid',
      unit_cost: 0,
      date: new Date().toISOString().split('T')[0],
      receipt_url: '',
      budget_item_id: undefined, // ✅ NUEVO
    });
    setEditingTransaction(null);
  };

  const openModal = (transaction?: LocalFinancialTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        project_id: transaction.project_id,
        budget_item_id: (transaction as any).budget_item_id, // ✅ NUEVO
        type: transaction.type as 'income' | 'expense',
        category: transaction.category as any,
        description: transaction.description,
        quantity: transaction.quantity,
        unit: transaction.unit,
        unit_cost: transaction.unit_cost,
        date: transaction.date,
        receipt_url: transaction.receipt_url,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      // Validar con Zod schema
      const validation = validateSchema(financialTransactionSchema, formData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        setSaveLoading(false);
        return;
      }

      const total_cost = formData.quantity * formData.unit_cost;

      // Obtener user_id para tenencia
      const userId = await getCurrentUserId();

      const transactionData: any = {
        id: editingTransaction?.id || generateId(),
        user_id: userId || undefined,
        project_id: formData.project_id,
        budget_item_id: formData.budget_item_id, // ✅ NUEVO
        type: formData.type,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        unit_cost: formData.unit_cost,
        total_cost: total_cost,
        date: formData.date,
        receipt_url: formData.receipt_url,
        payment_method: formData.payment_method,
        tax_amount: formData.tax_amount,
        related_supplier_id: formData.related_supplier_id,
        related_client_id: formData.related_client_id,
        related_purchase_order_id: formData.related_purchase_order_id,
        document_number: formData.document_number,
        is_reconciled: formData.is_reconciled,
        sync_status: editingTransaction
          ? resolveSyncStatus({ isNewRecord: false, previousStatus: editingTransaction.sync_status, isOnline })
          : resolveSyncStatus({ isNewRecord: true, isOnline }),
        created_at: editingTransaction?.created_at || new Date().toISOString()
      };

      if (editingTransaction) {
        await offlineDB.financialTransactions.update(editingTransaction.id, transactionData);
        showToast('success', 'Transacción actualizada exitosamente');
      } else {
        await offlineDB.financialTransactions.add(transactionData);
        showToast('success', 'Transacción creada exitosamente');
      }

      closeModal();
      loadTransactions();

      if (isOnline && supabase && isServerId(transactionData.id)) {
        const { error } = await supabase.from('financial_transactions').upsert([transactionData]);
        if (error) {
          await offlineDB.financialTransactions.update(transactionData.id!, { sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }) });
          showToast('warning', 'Transacción guardada localmente; pendiente de sync');
        } else {
          await offlineDB.financialTransactions.update(transactionData.id!, { sync_status: 'synced' });
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      showToast('error', 'Error al guardar la transacción');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (transaction: LocalFinancialTransaction) => {
    setDeleteConfirm(transaction);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await queueDelete('financial_transactions', deleteConfirm);
      await offlineDB.financialTransactions.delete(deleteConfirm.id);
      showToast('success', 'Transacción eliminada exitosamente');
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('error', 'Error al eliminar la transacción');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesProject = selectedProject === 'all' || transaction.project_id === selectedProject;
    return matchesSearch && matchesType && matchesCategory && matchesProject;
  });

  // Renderizado incremental: evita saturar el DOM con miles de filas.
  const {
    visibleItems: visibleTransactions,
    hasMore: hasMoreTransactions,
    remaining: remainingTransactions,
    showMore: showMoreTransactions,
  } = useIncrementalList({
    items: filteredTransactions,
    increment: 30,
    resetOnItemsChange: true,
  });

  const { totalIncome, totalExpense, balance } = calculateFinanceSummary(filteredTransactions);

  useRealtimeRefresh(['financial_transactions', 'projects'], loadTransactions);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Gestión Financiera
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Controle ingresos, gastos y flujo de caja
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={isOnline ? 'Conectado a internet' : 'Trabajando sin conexión'}>
              <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isOnline ? '🟢 En línea' : '🟡 Sin conexión'}
              </div>
            </Tooltip>
            <OnboardingTooltip
              id="finance-new-button"
              title="Registrar su primera transacción"
              description="Registre ingresos o gastos para mantener el flujo de caja actualizado."
            >
              <Tooltip content="Registrar nueva transacción financiera">
                <button
                  onClick={() => openModal()}
                  className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Transacción
                </button>
              </Tooltip>
            </OnboardingTooltip>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-white/60 text-xs sm:text-sm">Ingresos Totales</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-white/60 text-xs sm:text-sm">Gastos Totales</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white/60 text-xs sm:text-sm">Balance</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Budget Comparison Panel */}
        {budgetComparison && activeBudget && (
          <Tooltip content="Ver comparación de presupuesto vs gastos reales">
            <span className="block">
              <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-cyan-400 font-medium">Comparación Presupuesto vs. Gastos Reales</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-white/60 text-xs">Presupuesto Estimado</p>
                    <p className="text-white font-medium">{formatCurrency(budgetComparison.estimatedTotal)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Gastos Reales</p>
                    <p className="text-white font-medium">{formatCurrency(budgetComparison.actualTotal)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Variación</p>
                    <p className={`font-medium ${budgetComparison.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(budgetComparison.variance)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-white/60 mb-1">Materiales</p>
                    <div className="flex justify-between">
                      <span className="text-white/40">Est:</span>
                      <span className="text-white">{formatCurrency(budgetComparison.byCategory.materiales.estimated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Real:</span>
                      <span className="text-white">{formatCurrency(budgetComparison.byCategory.materiales.actual)}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-white/60 mb-1">Mano de Obra</p>
                    <div className="flex justify-between">
                      <span className="text-white/40">Est:</span>
                      <span className="text-white">{formatCurrency(budgetComparison.byCategory.mano_de_obra.estimated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Real:</span>
                      <span className="text-white">{formatCurrency(budgetComparison.byCategory.mano_de_obra.actual)}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-white/60 mb-1">Otros</p>
                    <div className="flex justify-between">
                      <span className="text-white/40">Est:</span>
                      <span className="text-white">{formatCurrency(budgetComparison.byCategory.otros.estimated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Real:</span>
                      <span className="text-white">{formatCurrency(budgetComparison.byCategory.otros.actual)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </span>
          </Tooltip>
        )}
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar transacciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">Todos los proyectos</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-8 h-8 text-white/30" />}
            title="No hay transacciones"
            description={searchTerm || filterType !== 'all' || filterCategory !== 'all' || selectedProject !== 'all'
              ? 'No se encontraron transacciones con los filtros actuales.'
              : 'Comience registrando transacciones para controlar sus finanzas.'}
          />
        ) : (
          <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-3 px-4">Fecha</th>
                  <th className="text-left text-white/60 py-3 px-4">Descripción</th>
                  <th className="text-left text-white/60 py-3 px-4">Categoría</th>
                  <th className="text-left text-white/60 py-3 px-4">Tipo</th>
                  <th className="text-left text-white/60 py-3 px-4">Cantidad</th>
                  <th className="text-left text-white/60 py-3 px-4">Costo Unitario</th>
                  <th className="text-left text-white/60 py-3 px-4">Costo Total</th>
                  <th className="text-right text-white/60 py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">{transaction.date}</td>
                    <td className="py-3 px-4 text-white">{transaction.description}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: categoryColors[transaction.category]?.bg || 'rgba(255,255,255,0.1)',
                          color: categoryColors[transaction.category]?.text || 'white',
                          border: `1px solid ${categoryColors[transaction.category]?.border || 'rgba(255,255,255,0.2)'}`
                        }}
                      >
                        {categoryLabels[transaction.category] || transaction.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">{transaction.quantity} {transaction.unit}</td>
                    <td className="py-3 px-4 text-white">{formatCurrency(transaction.unit_cost)}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(transaction.total_cost)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(transaction)}
                          className="text-cyan-400 hover:text-cyan-300 p-1"
                          title="Editar"
                          aria-label="Editar transacción"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Eliminar"
                          aria-label="Eliminar transacción"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMoreTransactions && (
              <div className="text-center py-3 border-t border-white/10">
                <button
                  onClick={showMoreTransactions}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
                  aria-label={`Ver más transacciones, ${remainingTransactions} restantes`}
                >
                  Ver más transacciones ({remainingTransactions} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/60 hover:text-white p-1"
                aria-label="Cerrar formulario de transacción"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Proyecto</label>
                  <select
                    value={formData.project_id || ''}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value || undefined })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Sin proyecto</option>
                    {availableProjects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Renglón Presupuestario (Opcional) ✅</label>
                  <select
                    value={formData.budget_item_id || ''}
                    onChange={(e) => setFormData({ ...formData, budget_item_id: e.target.value || undefined })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Sin asociar a presupuesto</option>
                    {budgetItems.map(item => (
                      <option key={item.id} value={item.id as string}>
                        {item.code} - {item.description} ({formatCurrency(item.unit_cost)}/un)
                      </option>
                    ))}
                  </select>
                  <p className="text-white/40 text-xs mt-1">Vincula esta transacción a un renglón presupuestario para análisis de varianza</p>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Descripción</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Unidad</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Costo Unitario (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">URL de Recibo (opcional)</label>
                  <input
                    type="url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Método de Pago</label>
                  <select
                    value={formData.payment_method || ''}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Seleccione...</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="anticipo">Anticipo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Impuesto / IVA (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">No. Documento / Factura</label>
                  <input
                    type="text"
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="reconciled"
                    type="checkbox"
                    checked={formData.is_reconciled || false}
                    onChange={(e) => setFormData({ ...formData, is_reconciled: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-500"
                  />
                  <label htmlFor="reconciled" className="text-white/70 text-sm">Conciliado</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <SecondaryButton
                  type="button"
                  onClick={closeModal} aria-label="Cancelar y cerrar formulario de transacción">
                  Cancelar
                </SecondaryButton>
                <PrimaryButton
                  type="submit" disabled={saveLoading} aria-label={editingTransaction ? 'Actualizar transacción existente' : 'Crear nueva transacción'} icon={<Save className="w-4 h-4" />}>
                  {saveLoading ? <LoadingSpinner size={16} /> : (editingTransaction ? 'Actualizar' : 'Crear')}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Eliminar Transacción"
        message={`¿Está seguro de eliminar la transacción "${deleteConfirm?.description}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}