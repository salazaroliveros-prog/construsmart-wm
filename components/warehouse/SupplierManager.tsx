'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, Building2, Search, Filter } from 'lucide-react';
import { offlineDB, LocalSupplier } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<LocalSupplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<LocalSupplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; supplier: LocalSupplier | null }>({ show: false, supplier: null });

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
      const now = new Date().toISOString();

      if (editingSupplier) {
        await offlineDB.suppliers.update(editingSupplier.id!, {
          ...formData,
          updated_at: now,
          sync_status: 'updated_offline',
        });
      } else {
        const newSupplier: LocalSupplier = {
          ...formData,
          code: formData.code || `SUP-${Date.now()}`,
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
        } as LocalSupplier;
        await offlineDB.suppliers.add(newSupplier);
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
      });
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
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
      setDeleteDialog({ show: false, supplier: null });
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const generateSupplierCode = () => {
    const count = suppliers.length + 1;
    return `SUP-${String(count).padStart(4, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Proveedores</h2>
          <p className="text-white/60 text-sm">Registro de proveedores de materiales y servicios</p>
        </div>
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
              });
              setShowForm(true);
            }}
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-white"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </button>
        </Tooltip>
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
              </div>

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
          <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" onClick={e => e.stopPropagation()}>
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
