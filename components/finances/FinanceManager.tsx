'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowDownCircle, ArrowUpCircle, Calendar, X, Save, Inbox } from 'lucide-react';
import { offlineDB, LocalFinancialTransaction, LocalProject } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';

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
  trabajos_extra: 'Trabajos Extra'
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  materiales: { bg: 'rgba(59, 130, 246, 0.2)', text: 'rgb(147, 197, 253)', border: 'rgba(59, 130, 246, 0.3)' },
  mano_de_obra: { bg: 'rgba(16, 185, 129, 0.2)', text: 'rgb(134, 239, 172)', border: 'rgba(16, 185, 129, 0.3)' },
  herramienta: { bg: 'rgba(245, 158, 11, 0.2)', text: 'rgb(253, 186, 116)', border: 'rgba(245, 158, 11, 0.3)' },
  sub_contrato: { bg: 'rgba(139, 92, 246, 0.2)', text: 'rgb(196, 181, 253)', border: 'rgba(139, 92, 246, 0.3)' },
  administrativo: { bg: 'rgba(236, 72, 153, 0.2)', text: 'rgb(244, 114, 182)', border: 'rgba(236, 72, 153, 0.3)' },
  personal: { bg: 'rgba(239, 68, 68, 0.2)', text: 'rgb(248, 113, 113)', border: 'rgba(239, 68, 68, 0.3)' },
  transporte: { bg: 'rgba(20, 184, 166, 0.2)', text: 'rgb(45, 212, 191)', border: 'rgba(20, 184, 166, 0.3)' },
  fijos: { bg: 'rgba(99, 102, 241, 0.2)', text: 'rgb(129, 140, 248)', border: 'rgba(99, 102, 241, 0.3)' },
  hogar: { bg: 'rgba(34, 197, 94, 0.2)', text: 'rgb(74, 222, 128)', border: 'rgba(34, 197, 94, 0.3)' },
  aporte: { bg: 'rgba(168, 85, 247, 0.2)', text: 'rgb(192, 132, 252)', border: 'rgba(168, 85, 247, 0.3)' },
  trabajos_extra: { bg: 'rgba(249, 115, 22, 0.2)', text: 'rgb(251, 146, 60)', border: 'rgba(249, 115, 22, 0.3)' }
};

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
  const [saveLoading, setSaveLoading] = useState(false);

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
      const executionProjects = projects.filter(p => p.status === 'execution');
      setAvailableProjects(executionProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
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
    });
    setEditingTransaction(null);
  };

  const openModal = (transaction?: LocalFinancialTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        project_id: transaction.project_id,
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
      const totalCost = formData.quantity * formData.unit_cost;
      const transactionData: LocalFinancialTransaction = {
        id: editingTransaction?.id || crypto.randomUUID(),
        project_id: formData.project_id,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        unit_cost: formData.unit_cost,
        total_cost: totalCost,
        date: formData.date,
        receipt_url: formData.receipt_url,
        sync_status: isOnline ? 'synced' : 'created_offline',
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

      if (isOnline && supabase) {
        const { error } = await supabase.from('financial_transactions').upsert([transactionData]);
        if (error) throw error;
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
      await offlineDB.financialTransactions.delete(deleteConfirm.id);
      showToast('success', 'Transacción eliminada exitosamente');
      loadTransactions();

      if (isOnline && supabase) {
        await supabase.from('financial_transactions').delete().eq('id', deleteConfirm.id);
      }
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.total_cost, 0);

  const balance = totalIncome - totalExpense;

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
            <Tooltip content="Registrar nueva transacción financiera">
              <button
                onClick={() => openModal()}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Transacción
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-white/60 text-xs sm:text-sm">Ingresos Totales</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-white/60 text-xs sm:text-sm">Gastos Totales</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white/60 text-xs sm:text-sm">Balance</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
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
                {filteredTransactions.map((transaction) => (
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
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Eliminar"
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/60 hover:text-white p-1"
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
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 disabled:opacity-50"
                >
                  {saveLoading ? 'Guardando...' : (editingTransaction ? 'Actualizar' : 'Crear')}
                </button>
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