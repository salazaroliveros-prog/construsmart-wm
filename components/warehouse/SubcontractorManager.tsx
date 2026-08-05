'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, DollarSign, Percent, Calendar, FileText, X, CheckCircle, Clock, Save } from 'lucide-react';
import { offlineDB, LocalSubcontractor, LocalSupplier, LocalProject } from '@/lib/db/offlineStore';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import OnboardingTooltip from '@/components/ui/OnboardingTooltip';
import { formatCurrency, useFinancialSettings } from '@/lib/hooks/useBusinessSettings';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { subcontractorSchema, validateSchema, formatValidationErrors } from '@/lib/validation/schemas';

const statusLabels: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  completed: 'Completado',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  suspended: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  completed: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const emptyForm = {
  supplier_id: '',
  code: '',
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  contract_start_date: '',
  contract_end_date: '',
  contract_value: 0,
  retention_rate: 0.1,
  advance_amount: 0,
  advance_balance: 0,
  retention_balance: 0,
  status: 'active',
  notes: '',
};

export default function SubcontractorManager() {
  const { showToast } = useToast();
  const { financial } = useFinancialSettings();
  const [subcontractors, setSubcontractors] = useState<LocalSubcontractor[]>([]);
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<LocalSubcontractor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalSubcontractor | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = async () => {
    try {
      const [localSubs, localSuppliers, localProjects] = await Promise.all([
        offlineDB.subcontractors.toArray(),
        offlineDB.suppliers.toArray(),
        offlineDB.projects.toArray(),
      ]);
      setSubcontractors(localSubs);
      setSuppliers(localSuppliers);
      setProjects(localProjects);
    } catch (error) {
      console.error('Error loading subcontractors:', error);
      showToast('error', 'Error al cargar subcontratos');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useRealtimeRefresh(['subcontractors', 'suppliers'], loadData);

  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openModal = (subcontractor?: LocalSubcontractor) => {
    if (subcontractor) {
      setEditingSubcontractor(subcontractor);
      setFormData({
        supplier_id: subcontractor.supplier_id || '',
        code: subcontractor.code,
        name: subcontractor.name,
        contact_person: subcontractor.contact_person || '',
        phone: subcontractor.phone || '',
        email: subcontractor.email || '',
        contract_start_date: subcontractor.contract_start_date || '',
        contract_end_date: subcontractor.contract_end_date || '',
        contract_value: subcontractor.contract_value,
        retention_rate: subcontractor.retention_rate,
        advance_amount: subcontractor.advance_amount,
        advance_balance: subcontractor.advance_balance || 0,
        retention_balance: subcontractor.retention_balance || 0,
        status: subcontractor.status,
        notes: subcontractor.notes || '',
      });
    } else {
      setEditingSubcontractor(null);
      setFormData({
        ...emptyForm,
        code: `SUB-${Date.now()}`,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubcontractor(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const validation = validateSchema(subcontractorSchema, formData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        setSaveLoading(false);
        return;
      }

      const userId = await (await import('@/lib/auth/userId')).getCurrentUserId();
      const now = new Date().toISOString();

      const subcontractorData: LocalSubcontractor = {
        id: editingSubcontractor?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        user_id: userId || undefined,
        supplier_id: formData.supplier_id || undefined,
        code: formData.code,
        name: formData.name,
        contact_person: formData.contact_person || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        contract_start_date: formData.contract_start_date || undefined,
        contract_end_date: formData.contract_end_date || undefined,
        contract_value: formData.contract_value,
        retention_rate: formData.retention_rate,
        advance_amount: formData.advance_amount,
        advance_balance: formData.advance_balance,
        retention_balance: formData.retention_balance,
        status: formData.status as 'active' | 'suspended' | 'completed',
        notes: formData.notes || undefined,
        sync_status: editingSubcontractor
          ? resolveSyncStatus({ isNewRecord: false, previousStatus: editingSubcontractor.sync_status, isOnline })
          : resolveSyncStatus({ isNewRecord: true, isOnline }),
        created_at: editingSubcontractor?.created_at || now,
        updated_at: now,
      };

      if (editingSubcontractor) {
        await offlineDB.subcontractors.update(editingSubcontractor.id!, subcontractorData);
        showToast('success', 'Subcontrato actualizado');
      } else {
        await offlineDB.subcontractors.add(subcontractorData);
        showToast('success', 'Subcontrato creado');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving subcontractor:', error);
      showToast('error', 'Error al guardar el subcontrato');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await offlineDB.subcontractors.delete(deleteConfirm.id!);
      showToast('success', 'Subcontrato eliminado');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Error deleting subcontractor:', error);
      showToast('error', 'Error al eliminar el subcontrato');
    }
  };

  const totalAdvance = subcontractors.reduce((sum, s) => sum + s.advance_amount, 0);
  const totalRetention = subcontractors.reduce((sum, s) => sum + (s.contract_value * s.retention_rate), 0);
  const activeCount = subcontractors.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Subcontratos</h2>
          <p className="text-white/60 text-sm">Control de retenciones y anticipos a subcontratistas</p>
        </div>
        <OnboardingTooltip
          id="subcontractor-new-button"
          title="Registrar su primer subcontrato"
          description="Cree un subcontrato para controlar anticipos, retenciones y valores de contrato."
        >
          <Tooltip content="Crear nuevo subcontrato">
            <button
              onClick={() => openModal()}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-white"
            >
              <Plus className="w-4 h-4" />
              Nuevo Subcontrato
            </button>
          </Tooltip>
        </OnboardingTooltip>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Total Subcontratos</p>
              <p className="text-white text-xl font-bold">{subcontractors.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Activos</p>
              <p className="text-white text-xl font-bold">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Anticipos Entregados</p>
              <p className="text-white text-xl font-bold">{formatCurrency(totalAdvance, financial)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Retenciones Totales</p>
              <p className="text-white text-xl font-bold">{formatCurrency(totalRetention, financial)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <label className="block text-white/60 text-sm mb-2">Buscar</label>
            <Search className="absolute left-3 top-9 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="completed">Completado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subcontractor List */}
      {subcontractors.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="Sin subcontratos registrados"
          description="Comience creando su primer subcontrato para controlar anticipos y retenciones."
        />
      ) : (
        <div className="space-y-4">
          {filteredSubcontractors.map((sub) => (
            <div key={sub.id} className="glass-card p-4 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${statusColors[sub.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{sub.name}</h3>
                      <span className="text-white/40 text-sm">{sub.code}</span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[sub.status]}`}>
                        {statusLabels[sub.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Valor: {formatCurrency(sub.contract_value, financial)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        <span>Retención: {(sub.retention_rate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Anticipo: {formatCurrency(sub.advance_amount, financial)}</span>
                      </div>
                      {sub.contract_end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Fin: {new Date(sub.contract_end_date).toLocaleDateString('es-GT')}</span>
                        </div>
                      )}
                    </div>
                    {(sub.advance_balance > 0 || sub.retention_balance > 0) && (
                      <div className="flex gap-4 mt-2 text-xs text-white/50">
                        {sub.advance_balance > 0 && (
                          <span>Saldo anticipo: {formatCurrency(sub.advance_balance, financial)}</span>
                        )}
                        {sub.retention_balance > 0 && (
                          <span>Saldo retención: {formatCurrency(sub.retention_balance, financial)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tooltip content="Editar subcontrato">
                    <button
                      onClick={() => openModal(sub)}
                      className="glass-button px-3 py-2 rounded-lg text-white text-sm flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  </Tooltip>
                  <Tooltip content="Eliminar subcontrato">
                    <button
                      onClick={() => setDeleteConfirm(sub)}
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={closeModal}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingSubcontractor ? 'Editar Subcontrato' : 'Nuevo Subcontrato'}
              </h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white p-1" aria-label="Cerrar formulario">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Nombre / Empresa</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Proveedor Asociado</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Valor de Contrato (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Retención (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retention_rate * 100}
                    onChange={(e) => setFormData({ ...formData, retention_rate: Number(e.target.value) / 100 })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Anticipo (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Saldo Anticipo (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.advance_balance}
                    onChange={(e) => setFormData({ ...formData, advance_balance: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Saldo Retención (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retention_balance}
                    onChange={(e) => setFormData({ ...formData, retention_balance: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Inicio de Contrato</label>
                  <input
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Fin de Contrato</label>
                  <input
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 glass-button px-4 py-2 rounded-lg text-white">
                  Cancelar
                </button>
                <button type="submit" disabled={saveLoading} className="flex-1 glass-button px-4 py-2 rounded-lg text-white bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {saveLoading ? <LoadingSpinner size={16} /> : (editingSubcontractor ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar subcontrato"
        message={`¿Está seguro de eliminar "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
