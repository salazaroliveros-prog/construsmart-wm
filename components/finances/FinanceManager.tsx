'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowDownCircle, ArrowUpCircle, Calendar, X, Save, Inbox } from 'lucide-react';
import { offlineDB, LocalFinancialTransaction, LocalProject } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

interface TransactionFormData {
  project_id?: string;
  type: 'income' | 'expense';
  category: 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' | 'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra';
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  date: string;
  receipt_url?: string;
}

type TransactionType = 'income' | 'expense';
type TransactionCategory = 'materiales' | 'mano_de_obra' | 'herramienta' | 'sub_contrato' | 'administrativo' | 'personal' | 'transporte' | 'fijos' | 'hogar' | 'aporte' | 'trabajos_extra';

export default function FinanceManager() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LocalFinancialTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<LocalFinancialTransaction | null>(null);

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    category: 'materiales',
    description: '',
    quantity: 1,
    unit: 'unid',
    unit_cost: 0,
    date: new Date().toISOString().split('T')[0],
    receipt_url: '',
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

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const loadTransactions = async () => {
    try {
      const localTransactions = await offlineDB.financialTransactions.toArray();
      setTransactions(localTransactions);

      if (navigator.onLine && supabase) {
        const { data: supabaseTransactions } = await supabase
          .from('financial_transactions')
          .select('*')
          .order('date', { ascending: false });

        if (supabaseTransactions) {
          for (const transaction of supabaseTransactions) {
            await offlineDB.financialTransactions.put({
              ...transaction,
              sync_status: 'synced',
            });
          }

          const updatedTransactions = await offlineDB.financialTransactions.toArray();
          setTransactions(updatedTransactions);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const projects = await offlineDB.projects.toArray();
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleOpenModal = (transaction?: LocalFinancialTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        project_id: transaction.project_id,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        quantity: transaction.quantity,
        unit: transaction.unit,
        unit_cost: transaction.unit_cost,
        date: transaction.date,
        receipt_url: transaction.receipt_url || '',
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        category: 'materiales',
        description: '',
        quantity: 1,
        unit: 'unid',
        unit_cost: 0,
        date: new Date().toISOString().split('T')[0],
        receipt_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      category: 'materiales',
      description: '',
      quantity: 1,
      unit: 'unid',
      unit_cost: 0,
      date: new Date().toISOString().split('T')[0],
      receipt_url: '',
    });
  };

  const handleSaveTransaction = async () => {
    try {
      const totalCost = formData.quantity * formData.unit_cost;

      const transactionData: LocalFinancialTransaction = {
        ...formData,
        total_cost: totalCost,
        sync_status: isOnline ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
      };

      if (editingTransaction) {
        await offlineDB.financialTransactions.update(editingTransaction.id!, {
          ...transactionData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });

        if (isOnline && editingTransaction.id && supabase) {
          const { error } = await supabase
            .from('financial_transactions')
            .update({
              project_id: transactionData.project_id,
              type: transactionData.type,
              category: transactionData.category,
              description: transactionData.description,
              quantity: transactionData.quantity,
              unit: transactionData.unit,
              unit_cost: transactionData.unit_cost,
              total_cost: transactionData.total_cost,
              date: transactionData.date,
              receipt_url: transactionData.receipt_url,
            })
            .eq('id', editingTransaction.id);

          if (error) {
            console.error('Error updating transaction in Supabase:', error);
            await offlineDB.financialTransactions.update(editingTransaction.id!, {
              sync_status: 'updated_offline',
            });
          }
        }

        showToast('success', 'Transacción actualizada');
      } else {
        const id = await offlineDB.financialTransactions.add(transactionData);

        if (isOnline && supabase) {
          const { data, error } = await supabase
            .from('financial_transactions')
            .insert({
              project_id: transactionData.project_id,
              type: transactionData.type,
              category: transactionData.category,
              description: transactionData.description,
              quantity: transactionData.quantity,
              unit: transactionData.unit,
              unit_cost: transactionData.unit_cost,
              total_cost: transactionData.total_cost,
              date: transactionData.date,
              receipt_url: transactionData.receipt_url,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating transaction in Supabase:', error);
          } else if (data) {
            await offlineDB.financialTransactions.update(id, {
              id: data.id,
              sync_status: 'synced',
            });
          }
        }

        showToast('success', 'Transacción creada exitosamente');
      }

      await loadTransactions();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving transaction:', error);
      showToast('error', 'Error al guardar la transacción');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await offlineDB.financialTransactions.delete(deleteConfirm.id!);

      if (isOnline && deleteConfirm.id && supabase) {
        const { error } = await supabase.from('financial_transactions').delete().eq('id', deleteConfirm.id);
        if (error) console.error('Error deleting from Supabase:', error);
      }

      showToast('success', 'Transacción eliminada');
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('error', 'Error al eliminar la transacción');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const calculateSummary = () => {
    const filtered = selectedProject === 'all'
      ? transactions
      : transactions.filter(t => t.project_id === selectedProject);

    const income = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.total_cost, 0);

    const expenses = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.total_cost, 0);

    const balance = income - expenses;

    const expensesByCategory = filtered
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.total_cost;
        return acc;
      }, {} as Record<string, number>);

    return { income, expenses, balance, expensesByCategory };
  };

  const summary = calculateSummary();

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesProject = selectedProject === 'all' || transaction.project_id === selectedProject;

    return matchesSearch && matchesType && matchesCategory && matchesProject;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const categoryColors = {
    materiales: { bg: 'rgba(59, 130, 246, 0.2)', text: 'rgb(147, 197, 253)', border: 'rgba(59, 130, 246, 0.3)' },
    mano_de_obra: { bg: 'rgba(16, 185, 129, 0.2)', text: 'rgb(134, 239, 172)', border: 'rgba(16, 185, 129, 0.3)' },
    herramienta: { bg: 'rgba(245, 158, 11, 0.2)', text: 'rgb(253, 186, 116)', border: 'rgba(245, 158, 11, 0.3)' },
    sub_contrato: { bg: 'rgba(139, 92, 246, 0.2)', text: 'rgb(196, 181, 253)', border: 'rgba(139, 92, 246, 0.3)' },
    administrativo: { bg: 'rgba(236, 72, 153, 0.2)', text: 'rgb(209, 213, 219)', border: 'rgba(236, 72, 153, 0.3)' },
    personal: { bg: 'rgba(244, 63, 94, 0.2)', text: 'rgb(251, 146, 114)', border: 'rgba(244, 63, 94, 0.3)' },
    transporte: { 'bg': 'rgba(20, 184, 166, 0.2)', text: 'rgb(94, 234, 212)', border: 'rgba(20, 184, 166, 0.3)' },
    fijos: { bg: 'rgba(100, 116, 139, 0.2)', text: 'rgb(148, 163, 184)', border: 'rgba(100, 116, 139, 0.3)' },
    hogar: { bg: 'rgba(251, 191, 36, 0.2)', text: 'rgb(254, 202, 87)', border: 'rgba(251, 191, 36, 0.3)' },
    aporte: { bg: 'rgba(34, 197, 94, 0.2)', text: 'rgb(134, 239, 172)', border: 'rgba(34, 197, 94, 0.3)' },
    trabajos_extra: { bg: 'rgba(168, 85, 247, 0.2)', text: 'rgb(192, 132, 252)', border: 'rgba(168, 85, 247, 0.3)' },
  };

  const categoryLabels = {
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
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </span>
          <span>Gestión Financiera</span>
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${isOnline ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Ingresos</span>
            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.income)}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Gastos</span>
            <ArrowDownCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Balance</span>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Transacciones</span>
            <DollarSign className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
        </div>
      </div>

      {/* Expenses by Category */}
      {Object.keys(summary.expensesByCategory).length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-white font-medium mb-4">Gastos por Categoría</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(summary.expensesByCategory).map(([category, amount]) => (
              <div key={category} className="glass-card p-3 rounded-lg">
                <span className="text-xs text-white/60 mb-1">{categoryLabels[category as keyof typeof categoryLabels]}</span>
                <p className="text-lg font-bold text-white">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            aria-label="Buscar transacciones"
          />
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
          aria-label="Filtrar por proyecto"
        >
          <option value="all">Todos los Proyectos</option>
          {availableProjects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
          aria-label="Filtrar por tipo"
        >
          <option value="all">Todos los Tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
          aria-label="Filtrar por categoría"
        >
          <option value="all">Todas las Categorías</option>
          {Object.keys(categoryLabels).map((cat) => (
            <option key={cat} value={cat}>{categoryLabels[cat as keyof typeof categoryLabels]}</option>
          ))}
        </select>
      </div>

      {/* Transactions Table or Empty State */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-white/30" />}
          title="No hay transacciones"
          description={searchTerm || filterType !== 'all' || filterCategory !== 'all' ? 'No se encontraron transacciones con los filtros actuales.' : 'Agregue su primera transacción financiera usando el botón "Nueva Transacción".'}
          action={
            !searchTerm && filterType === 'all' && filterCategory === 'all' ? (
              <button
                onClick={() => handleOpenModal()}
                className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Transacción</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm" style={{ minWidth: '600px' }}>
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 py-3 px-4">Fecha</th>
                <th className="text-left text-white/60 py-3 px-4">Descripción</th>
                <th className="text-left text-white/60 py-3 px-4">Categoría</th>
                <th className="text-left text-white/60 py-3 px-4">Tipo</th>
                <th className="text-left text-white/60 py-3 px-4">Cantidad</th>
                <th className="text-left text-white/60 py-3 px-4">Unit. Costo</th>
                <th className="text-left text-white/60 py-3 px-4">Total</th>
                <th className="text-left text-white/60 py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white/70">{transaction.date}</td>
                  <td className="py-3 px-4 text-white font-medium">{transaction.description}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium border"
                      style={{
                        background: categoryColors[transaction.category as keyof typeof categoryColors].bg,
                        color: categoryColors[transaction.category as keyof typeof categoryColors].text,
                        borderColor: categoryColors[transaction.category as keyof typeof categoryColors].border
                      }}
                    >
                      {categoryLabels[transaction.category as keyof typeof categoryLabels]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center space-x-1 ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {transaction.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="capitalize">{transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/70">{transaction.quantity} {transaction.unit}</td>
                  <td className="py-3 px-4 text-white/70">{formatCurrency(transaction.unit_cost)}</td>
                  <td className="py-3 px-4 text-white font-medium">{formatCurrency(transaction.total_cost)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(transaction)}
                        className="text-cyan-400 hover:text-cyan-300"
                        aria-label={`Editar transacción ${transaction.description}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(transaction)}
                        className="text-red-400 hover:text-red-300"
                        aria-label={`Eliminar transacción ${transaction.description}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-modal-title"
        >
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="transaction-modal-title" className="text-lg font-semibold text-white">
                {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-type">Tipo</label>
                <select
                  id="transaction-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-category">Categoría</label>
                <select
                  id="transaction-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  {Object.keys(categoryLabels).map((cat) => (
                    <option key={cat} value={cat}>{categoryLabels[cat as keyof typeof categoryLabels]}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-description">Descripción</label>
                <input
                  id="transaction-description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-quantity">Cantidad</label>
                <input
                  id="transaction-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-unit">Unidad</label>
                <input
                  id="transaction-unit"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-unit-cost">Costo Unitario</label>
                <input
                  id="transaction-unit-cost"
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-date">Fecha</label>
                <input
                  id="transaction-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-project">Proyecto</label>
                <select
                  id="transaction-project"
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Sin proyecto asignado</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block" htmlFor="transaction-receipt">URL de Recibo (opcional)</label>
                <input
                  id="transaction-receipt"
                  type="text"
                  value={formData.receipt_url}
                  onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTransaction}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm hover:opacity-90 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Eliminar Transacción"
        message="¿Está seguro de eliminar esta transacción? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
