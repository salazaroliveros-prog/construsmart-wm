'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, Building2, Search, Filter, Star, Tag } from 'lucide-react';
import { offlineDB, LocalSupplier } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import OnboardingTooltip from '@/components/ui/OnboardingTooltip';
import { supplierSchema, validateSchema, formatValidationErrors } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth/userId';

export default function SupplierManager() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<LocalSupplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<LocalSupplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; supplier: LocalSupplier | null }>({ show: false, supplier: null });
  const [isOnline, setIsOnline] = useState(true);

  const [formData, setFormData] = useState<Partial<LocalSupplier>>({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    payment_terms: '',
    notes: '',
    categories: [],
    is_preferred: false,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm]);

  const loadSuppliers = async () => {
    try {
      const allSuppliers = await offlineDB.suppliers.toArray();
      setSuppliers(allSuppliers);
} catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('error', 'Error al cargar proveedores');
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone.includes(searchTerm) ||
          supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSuppliers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar con Zod schema
      const validation = validateSchema(supplierSchema, formData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        return;
      }

      // Validar unicidad de código (solo para nuevos proveedores)
      if (!editingSupplier) {
        if (!formData.code) {
          showToast('error', 'El código de proveedor es requerido');
          return;
        }
        const existingSupplier = await offlineDB.suppliers
          .where('code')
          .equals(formData.code)
          .first();
        if (existingSupplier) {
          showToast('error', 'El código de proveedor ya existe');
          return;
        }
      }

      const now = new Date().toISOString();
      
      // Obtener user_id para tenencia
      const userId = await getCurrentUserId();

      if (editingSupplier) {
        await offlineDB.suppliers.update(editingSupplier.id!, {
          user_id: userId || undefined,
          ...formData,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingSupplier?.sync_status ?? 'synced', isOnline }),
        });
        showToast('success', 'Proveedor actualizado exitosamente');
      } else {
        const newSupplier: LocalSupplier = {
          user_id: userId || undefined,
          ...formData,
          code: formData.code || `SUP-${Date.now()}`,
          created_at: now,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }),
        } as LocalSupplier;
        await offlineDB.suppliers.add(newSupplier);
        showToast('success', 'Proveedor creado exitosamente');
      }

      setShowForm(false);
      setEditingSupplier(null);
      setFormData({
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        payment_terms: '',
        notes: '',
        categories: [],
        is_preferred: false,
      });
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      showToast('error', 'Error al guardar proveedor');
    }
  };

  const handleEdit = (supplier: LocalSupplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowForm(true);
  };

  const handleDelete = async (supplier: LocalSupplier) => {
    try {
      await queueDelete('suppliers', supplier);
      await offlineDB.suppliers.delete(supplier.id!);

      // Cascada local: el servidor usa RESTRICT, así que el motor borra primero las OC;
      // aquí limpiamos localmente las OC del proveedor y sus items.
      const orderIds = (await offlineDB.purchaseOrders.where('supplier_id').equals(supplier.id!).toArray())
        .map((o) => o.id as string);
      if (orderIds.length > 0) {
        await offlineDB.purchaseOrderItems.where('purchase_order_id').anyOf(orderIds).delete();
        await offlineDB.purchaseOrders.where('supplier_id').equals(supplier.id!).delete();
      }

      setDeleteDialog({ show: false, supplier: null });
      loadSuppliers();
} catch (error) {
      console.error('Error deleting supplier:', error);
      showToast('error', 'Error al eliminar proveedor');
    }
  };

  const generateSupplierCode = () => {
    const all = suppliers;
    const maxNum = all.reduce((max, s) => {
      const m = s.code.match(/^SUP-(\d+)$/);
      const n = m ? parseInt(m[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `SUP-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['suppliers', 'purchase_orders'], loadSuppliers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Gestión de Proveedores</h2>
          <p className="text-white/60 text-sm">Registro de proveedores de materiales y servicios</p>
        </div>
        <OnboardingTooltip
          id="supplier-new-button"
          title="Registrar su primer proveedor"
          description="Agregue proveedores de materiales y servicios para asociarlos a alertas de inventario."
        >
          <Tooltip content="Agregar nuevo proveedor al sistema">
            <button
              onClick={() => {
                setEditingSupplier(null);
                setFormData({
                  code: generateSupplierCode(),
                  name: '',
                  contact_person: '',
                  phone: '',
                  email: '',
                  address: '',
                  city: '',
                  payment_terms: '',
                  notes: '',
                  categories: [],
                  is_preferred: false,
                });
                setShowForm(true);
              }}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-white"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
          </Tooltip>
        </OnboardingTooltip>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Total Proveedores</p>
              <p className="text-white text-xl font-bold">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Activos</p>
              <p className="text-white text-xl font-bold">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Contactos</p>
              <p className="text-white text-xl font-bold">{suppliers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nombre, contacto, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white text-sm"
          />
        </div>
      </div>

      {/* Supplier List */}
      {filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-12 h-12" />}
          title="No hay proveedores registrados"
          description="Comienza agregando tu primer proveedor al sistema"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="glass-card p-4 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold">
                    {supplier.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{supplier.name}</h3>
                    <p className="text-white/60 text-xs">{supplier.code}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <Building2 className="w-4 h-4" />
                  <span>{supplier.contact_person}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.email && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Mail className="w-4 h-4" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.address}, {supplier.city}</span>
                </div>
                {supplier.payment_terms && (
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">
                      {supplier.payment_terms}
                    </span>
                  </div>
                )}
                {supplier.is_preferred && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <Star className="w-4 h-4" />
                    <span className="text-xs font-medium">Preferido</span>
                  </div>
                )}
              </div>

              {/* Categories Display */}
              {supplier.categories && supplier.categories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap gap-1">
                    {supplier.categories.map((category, index) => (
                      <span key={index} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="flex-1 glass-button px-3 py-2 rounded-lg text-white text-sm flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setDeleteDialog({ show: true, supplier })}
                  className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
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
              {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                  <label className="block text-white/70 text-sm mb-2">Nombre de Empresa</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Persona de Contacto</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

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
                <label className="block text-white/70 text-sm mb-2">Condiciones de Pago</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  placeholder="Ej: 30 días, 50% anticipo, etc."
                />
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

              {/* Category and Preferred Section */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Categorización
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Categorías de Materiales</label>
                    <input
                      type="text"
                      value={formData.categories?.join(', ') || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        categories: e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0)
                      })}
                      placeholder="Ej: cemento, acero, madera, pintura"
                      className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    />
                    <p className="text-white/50 text-xs mt-1">Separar categorías con comas</p>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_preferred || false}
                        onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-white/70 text-sm flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        Proveedor Preferido
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
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  {editingSupplier ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.show}
        onCancel={() => setDeleteDialog({ show: false, supplier: null })}
        onConfirm={() => deleteDialog.supplier && handleDelete(deleteDialog.supplier)}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar al proveedor "${deleteDialog.supplier?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
