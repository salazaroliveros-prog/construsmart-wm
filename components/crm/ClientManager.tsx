'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Phone, Mail, MapPin, Building2, Search, Filter, Wallet, CreditCard, AlertTriangle } from 'lucide-react';
import { offlineDB, LocalClient } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import OnboardingTooltip from '@/components/ui/OnboardingTooltip';
import { clientSchema, validateSchema, formatValidationErrors } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth/userId';
import { formatGTQ } from '@/lib/config/app.config';

export default function ClientManager() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<LocalClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<LocalClient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'corporate'>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; client: LocalClient | null }>({ show: false, client: null });
  const [isOnline, setIsOnline] = useState(true);

  const [formData, setFormData] = useState<Partial<LocalClient>>({
    code: '',
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    client_type: 'individual',
    notes: '',
    account_balance: 0,
    credit_limit: 0,
    payment_terms_days: 30,
    is_delinquent: false,
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterType]);

const loadClients = async () => {
    try {
      const allClients = await offlineDB.clients.toArray();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      showToast('error', 'Error al cargar clientes');
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((client) => client.client_type === filterType);
    }

    setFilteredClients(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar con Zod schema
      const validation = validateSchema(clientSchema, formData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        return;
      }

      // Validar unicidad de código (solo para nuevos clientes)
      if (!editingClient) {
        if (!formData.code) {
          showToast('error', 'El código de cliente es requerido');
          return;
        }
        const existingClient = await offlineDB.clients
          .where('code')
          .equals(formData.code)
          .first();
        if (existingClient) {
          showToast('error', 'El código de cliente ya existe');
          return;
        }
      }

      const now = new Date().toISOString();
      
      // Obtener user_id para tenencia
      const userId = await getCurrentUserId();

      if (editingClient) {
        await offlineDB.clients.update(editingClient.id!, {
          user_id: userId || undefined,
          ...formData,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingClient?.sync_status ?? 'synced', isOnline: navigator.onLine }),
        });
        showToast('success', 'Cliente actualizado exitosamente');
      } else {
        const newClient: LocalClient = {
          user_id: userId || undefined,
          ...formData,
          code: formData.code || `CLI-${Date.now()}`,
          created_at: now,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: navigator.onLine }),
        } as LocalClient;
        await offlineDB.clients.add(newClient);
        showToast('success', 'Cliente creado exitosamente');
      }

      setShowForm(false);
      setEditingClient(null);
      setFormData({
        code: '',
        name: '',
        company_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        client_type: 'individual',
        notes: '',
        account_balance: 0,
        credit_limit: 0,
        payment_terms_days: 30,
        is_delinquent: false,
      });
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      showToast('error', 'Error al guardar el cliente');
    }
  };

  const handleEdit = (client: LocalClient) => {
    setEditingClient(client);
    setFormData(client);
    setShowForm(true);
  };

  const handleDelete = async (client: LocalClient) => {
    try {
      await queueDelete('clients', client);
      await offlineDB.clients.delete(client.id!);
      setDeleteDialog({ show: false, client: null });
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const generateClientCode = () => {
    const all = clients;
    const maxNum = all.reduce((max, c) => {
      const m = c.code.match(/^CLI-(\d+)$/);
      const n = m ? parseInt(m[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `CLI-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['clients'], loadClients);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Gestión de Clientes</h2>
          <p className="text-white/60 text-sm">CRM - Registro de datos de clientes</p>
        </div>
        <OnboardingTooltip
          id="client-new-button"
          title="Registrar su primer cliente"
          description="Agregue clientes para asociarlos a proyectos y hacer seguimiento de créditos."
        >
          <Tooltip content="Agregar nuevo cliente al sistema">
            <button
              onClick={() => {
                setEditingClient(null);
                setFormData({
                  code: generateClientCode(),
                  name: '',
                  company_name: '',
                  phone: '',
                  email: '',
                  address: '',
                  city: '',
                  client_type: 'individual',
                  notes: '',
                });
                setShowForm(true);
              }}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-white"
            >
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </button>
          </Tooltip>
        </OnboardingTooltip>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Total Clientes</p>
              <p className="text-white text-xl font-bold">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Corporativos</p>
              <p className="text-white text-xl font-bold">
                {clients.filter((c) => c.client_type === 'corporate').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Individuales</p>
              <p className="text-white text-xl font-bold">
                {clients.filter((c) => c.client_type === 'individual').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterType === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
              aria-label="Filtrar todos los clientes"
              aria-pressed={filterType === 'all'}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterType === 'individual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
              aria-label="Filtrar clientes individuales"
              aria-pressed={filterType === 'individual'}
            >
              Individuales
            </button>
            <button
              onClick={() => setFilterType('corporate')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterType === 'corporate'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
              aria-label="Filtrar clientes corporativos"
              aria-pressed={filterType === 'corporate'}
            >
              Corporativos
            </button>
          </div>
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No hay clientes registrados"
          description="Comienza agregando tu primer cliente al sistema"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="glass-card p-4 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{client.name}</h3>
                    {client.company_name && (
                      <p className="text-white/60 text-xs">{client.company_name}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    client.client_type === 'corporate'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {client.client_type === 'corporate' ? 'Corporativo' : 'Individual'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span>{client.address}, {client.city}</span>
                </div>
              </div>

              {/* Financial Information Display */}
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <Wallet className="w-4 h-4" />
                    <span>Saldo:</span>
                  </div>
                  <span className={`font-medium ${client.account_balance && client.account_balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatGTQ(client.account_balance || 0)}
                  </span>
                </div>
                {client.credit_limit && client.credit_limit > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      <CreditCard className="w-4 h-4" />
                      <span>Crédito:</span>
                    </div>
                    <span className="font-medium text-cyan-400">
                      {formatGTQ(client.credit_limit)}
                    </span>
                  </div>
                )}
                {client.is_delinquent && (
                  <div className="flex items-center gap-2 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-lg">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Cliente Moroso</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleEdit(client)}
                  className="flex-1 glass-button px-3 py-2 rounded-lg text-white text-sm flex items-center justify-center gap-2"
                  aria-label={`Editar cliente ${client.name}`}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setDeleteDialog({ show: true, client })}
                  className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                  aria-label={`Eliminar cliente ${client.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Tipo de Cliente</label>
                  <select
                    value={formData.client_type}
                    onChange={(e) => setFormData({ ...formData, client_type: e.target.value as 'individual' | 'corporate' })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              {formData.client_type === 'corporate' && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Nombre de Empresa</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white min-h-[100px]"
                  rows={3}
                />
              </div>

              {/* Financial Information Section */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  Información Financiera
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Saldo de Cuenta (GTQ)</label>
                    <input
                      type="number"
                      value={formData.account_balance || 0}
                      onChange={(e) => setFormData({ ...formData, account_balance: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-4 py-2 rounded-lg text-white"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Límite de Crédito (GTQ)</label>
                    <input
                      type="number"
                      value={formData.credit_limit || 0}
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-4 py-2 rounded-lg text-white"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Plazo de Pago (días)</label>
                    <input
                      type="number"
                      value={formData.payment_terms_days || 30}
                      onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 30 })}
                      className="glass-input w-full px-4 py-2 rounded-lg text-white"
                      min="0"
                      max="365"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_delinquent || false}
                        onChange={(e) => setFormData({ ...formData, is_delinquent: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-white/70 text-sm flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Cliente Moroso
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white"
                  aria-label="Cancelar y cerrar formulario de cliente"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                  aria-label={editingClient ? 'Actualizar cliente existente' : 'Guardar nuevo cliente'}
                >
                  {editingClient ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.show}
        onCancel={() => setDeleteDialog({ show: false, client: null })}
        onConfirm={() => deleteDialog.client && handleDelete(deleteDialog.client)}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar al cliente "${deleteDialog.client?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
