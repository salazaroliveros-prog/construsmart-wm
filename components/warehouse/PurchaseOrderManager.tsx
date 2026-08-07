'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, FileText, Search, Filter, Package, DollarSign, Calendar, CheckCircle, Clock, XCircle, Building2, X } from 'lucide-react';
import { offlineDB, LocalPurchaseOrder, LocalPurchaseOrderItem, LocalSupplier, LocalProject } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import OnboardingTooltip from '@/components/ui/OnboardingTooltip';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { formatCurrency, useFinancialSettings } from '@/lib/hooks/useBusinessSettings';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

export default function PurchaseOrderManager() {
  const { showToast } = useToast();
  const { financial } = useFinancialSettings();
  const [orders, setOrders] = useState<LocalPurchaseOrder[]>([]);
  const [orderItems, setOrderItems] = useState<LocalPurchaseOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<LocalPurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LocalPurchaseOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LocalPurchaseOrder | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; order: LocalPurchaseOrder | null }>({ show: false, order: null });
  const [isOnline, setIsOnline] = useState(true);

  const [formData, setFormData] = useState<Partial<LocalPurchaseOrder>>({
    code: '',
    supplier_id: '',
    project_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'pending_approval',
    total_amount: 0,
    notes: '',
  });

  const [itemFormData, setItemFormData] = useState<Partial<LocalPurchaseOrderItem>>({
    purchase_order_id: '',
    item_code: '',
    description: '',
    quantity: 0,
    unit: '',
    unit_price: 0,
    total_price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchTerm]);

  const loadData = async () => {
    try {
      const userId = await getUserScope();
      const [localOrders, localOrderItems, localSuppliers, localProjects] = await Promise.all([
        scopeLocalRows(await offlineDB.purchaseOrders.toArray(), userId),
        scopeLocalRows(await offlineDB.purchaseOrderItems.toArray(), userId),
        scopeLocalRows(await offlineDB.suppliers.toArray(), userId),
        scopeLocalRows(await offlineDB.projects.toArray(), userId),
      ]);

      setOrders(localOrders);
      setOrderItems(localOrderItems);
      setSuppliers(localSuppliers);
      setProjects(localProjects);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error al cargar datos');
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || 'Proveedor desconocido';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Sin proyecto';
  };

  const filterOrders = () => {
    let filtered = orders;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getSupplierName(order.supplier_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

    setFilteredOrders(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const now = new Date().toISOString();

      // Validar propiedad del proyecto antes de guardar
      const userId = await getUserScope();
      if (formData.project_id) {
        const userProjects = scopeLocalRows(
          await offlineDB.projects.where('id').equals(formData.project_id).toArray(),
          userId
        );
        if (userProjects.length === 0) {
          showToast('error', 'Proyecto no válido o sin permisos');
          return;
        }
      }

      if (editingOrder) {
        await offlineDB.purchaseOrders.update(editingOrder.id!, {
          ...formData,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingOrder.sync_status, isOnline }),
        });
      } else {
        const newOrder: LocalPurchaseOrder = {
          ...formData,
          code: formData.code || `OC-${Date.now()}`,
          created_at: now,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }),
        } as LocalPurchaseOrder;
        await offlineDB.purchaseOrders.add(newOrder);
      }

      setShowForm(false);
      setEditingOrder(null);
      setFormData({
        code: '',
        supplier_id: '',
        project_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'pending_approval',
        total_amount: 0,
        notes: '',
      });
      loadData();
} catch (error) {
      console.error('Error saving order:', error);
      showToast('error', 'Error al guardar la orden');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const now = new Date().toISOString();
      const total_price = (itemFormData.quantity || 0) * (itemFormData.unit_price || 0);

      const newItem: LocalPurchaseOrderItem = {
        ...itemFormData,
        purchase_order_id: selectedOrder?.id || '',
        total_price,
        created_at: now,
        updated_at: now,
        sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }),
      } as LocalPurchaseOrderItem;

      await offlineDB.purchaseOrderItems.add(newItem);

      // Update order total
      if (selectedOrder) {
        const currentItems = orderItems.filter((oi) => oi.purchase_order_id === selectedOrder.id);
        const newTotal = currentItems.reduce((sum, item) => sum + (item.total_price || 0), 0) + total_price;
        await offlineDB.purchaseOrders.update(selectedOrder.id, {
          total_amount: newTotal,
          updated_at: now,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: selectedOrder.sync_status, isOnline }),
        });
      }

      setShowItemForm(false);
      setItemFormData({
        purchase_order_id: '',
        item_code: '',
        description: '',
        quantity: 0,
        unit: '',
        unit_price: 0,
        total_price: 0,
      });
      loadData();
} catch (error) {
      console.error('Error adding item:', error);
      showToast('error', 'Error al agregar item');
    }
  };

  const handleEdit = (order: LocalPurchaseOrder) => {
    setEditingOrder(order);
    setFormData(order);
    setShowForm(true);
  };

  const handleDelete = async (order: LocalPurchaseOrder) => {
    try {
      await queueDelete('purchase_orders', order);
      await offlineDB.purchaseOrders.delete(order.id!);
      // Delete associated items (el DELETE del servidor hace cascade de los items)
      const itemsToDelete = orderItems.filter((oi) => oi.purchase_order_id === order.id);
      for (const item of itemsToDelete) {
        await offlineDB.purchaseOrderItems.delete(item.id!);
      }
      setDeleteDialog({ show: false, order: null });
      loadData();
} catch (error) {
      console.error('Error deleting order:', error);
      showToast('error', 'Error al eliminar la orden');
    }
  };

  const handleViewItems = (order: LocalPurchaseOrder) => {
    setSelectedOrder(order);
  };

  const handleApprove = async (order: LocalPurchaseOrder) => {
    try {
      const now = new Date().toISOString();
      await offlineDB.purchaseOrders.update(order.id!, {
        status: 'approved',
        updated_at: now,
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: order.sync_status, isOnline }),
      });
      showToast('success', 'Orden aprobada');
      loadData();
    } catch (error) {
      console.error('Error approving order:', error);
      showToast('error', 'Error al aprobar la orden');
    }
  };

  const handleReject = async (order: LocalPurchaseOrder) => {
    try {
      const now = new Date().toISOString();
      await offlineDB.purchaseOrders.update(order.id!, {
        status: 'cancelled',
        updated_at: now,
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: order.sync_status, isOnline }),
      });
      showToast('success', 'Orden rechazada');
      loadData();
    } catch (error) {
      console.error('Error rejecting order:', error);
      showToast('error', 'Error al rechazar la orden');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'pending_approval':
        return <FileText className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'ordered':
        return <FileText className="w-4 h-4" />;
      case 'received':
        return <Package className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'pending_approval':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ordered':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'received':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const currentOrderItems = selectedOrder
    ? orderItems.filter((oi) => oi.purchase_order_id === selectedOrder.id)
    : [];

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['purchase_orders', 'suppliers', 'purchase_order_items', 'projects'], () => {
    loadData();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Órdenes de Compra</h2>
          <p className="text-white/60 text-sm">Gestión de órdenes de compra a proveedores</p>
        </div>
        <OnboardingTooltip
          id="po-new-button"
          title="Crear su primera orden de compra"
          description="Cree una orden de compra para proveedores y vincúlela a un proyecto."
        >
          <Tooltip content="Crear nueva orden de compra">
            <button
              onClick={() => {
                setEditingOrder(null);
                setFormData({
                  code: `OC-${Date.now()}`,
                  supplier_id: '',
                  project_id: '',
                  order_date: new Date().toISOString().split('T')[0],
                  expected_delivery_date: '',
                  status: 'pending_approval',
                  total_amount: 0,
                  notes: '',
                });
                setShowForm(true);
              }}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-white"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden
            </button>
          </Tooltip>
        </OnboardingTooltip>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Total Órdenes</p>
              <p className="text-white text-xl font-bold">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Pendientes</p>
              <p className="text-white text-xl font-bold">{orders.filter((o) => o.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Por Aprobar</p>
              <p className="text-white text-xl font-bold">{orders.filter((o) => o.status === 'pending_approval').length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Aprobadas</p>
              <p className="text-white text-xl font-bold">{orders.filter((o) => o.status === 'approved').length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Recibidas</p>
              <p className="text-white text-xl font-bold">{orders.filter((o) => o.status === 'received').length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Total</p>
              <p className="text-white text-xl font-bold">{formatCurrency(orders.reduce((sum, o) => sum + (o.total_amount || 0), 0), financial)}</p>
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
              placeholder="Buscar por código o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterStatus === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterStatus === 'pending'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterStatus === 'approved'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
            >
              Aprobadas
            </button>
            <button
              onClick={() => setFilterStatus('received')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterStatus === 'received'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'glass-button text-white/60'
              }`}
            >
              Recibidas
            </button>
          </div>
        </div>
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-12 h-12" />}
          title="No hay órdenes de compra"
          description="Comienza creando tu primera orden de compra"
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="glass-card p-4 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{order.code}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{getSupplierName(order.supplier_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.order_date).toLocaleDateString('es-GT')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-emerald-400 font-medium">{formatCurrency(order.total_amount, financial)}</span>
                      </div>
                    </div>
                    {order.project_id && (
                      <p className="text-xs text-white/50 mt-2">Proyecto: {getProjectName(order.project_id)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tooltip content="Ver items de la orden">
                    <button
                      onClick={() => handleViewItems(order)}
                      className="glass-button px-3 py-2 rounded-lg text-white text-sm flex items-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Items
                    </button>
                  </Tooltip>
                  {(order.status === 'pending' || order.status === 'pending_approval') && (
                    <>
                      <Tooltip content="Aprobar orden">
                        <button
                          onClick={() => handleApprove(order)}
                          className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprobar
                        </button>
                      </Tooltip>
                      <Tooltip content="Rechazar orden">
                        <button
                          onClick={() => handleReject(order)}
                          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      </Tooltip>
                    </>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'received' && (
                    <Tooltip content="Editar información de la orden">
                      <button
                        onClick={() => handleEdit(order)}
                        className="glass-button px-3 py-2 rounded-lg text-white text-sm flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content="Eliminar orden permanentemente">
                    <button
                      onClick={() => setDeleteDialog({ show: true, order })}
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

      {/* Order Items Modal */}
      {selectedOrder && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="glass-panel relative w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-anchor-none rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Items de Orden {selectedOrder.code}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="glass-button p-2 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mb-6">
              <Tooltip content="Agregar nuevo item a la orden">
                <button
                  onClick={() => {
                    setItemFormData({
                      purchase_order_id: selectedOrder.id,
                      item_code: '',
                      description: '',
                      quantity: 0,
                      unit: '',
                      unit_price: 0,
                      total_price: 0,
                    });
                    setShowItemForm(true);
                  }}
                  className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Item
                </button>
              </Tooltip>
            </div>

            {currentOrderItems.length === 0 ? (
              <EmptyState
                icon={<Package className="w-12 h-12" />}
                title="No hay items"
                description="Agrega items a esta orden de compra"
              />
            ) : (
              <div className="space-y-3">
                {currentOrderItems.map((item) => (
                  <div key={item.id} className="glass-card p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.description}</p>
                        <p className="text-white/60 text-sm">{item.item_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{item.quantity} {item.unit}</p>
                        <p className="text-emerald-400 text-sm">{formatCurrency(item.total_price, financial)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingOrder ? 'Editar Orden' : 'Nueva Orden'}
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
                  <label className="block text-white/70 text-sm mb-2">Proveedor</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Proyecto (Opcional)</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                >
                  <option value="">Sin proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Fecha de Orden</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Fecha Esperada de Entrega</label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                >
                  <option value="pending">Pendiente</option>
                  <option value="pending_approval">Pendiente de Aprobación</option>
                  <option value="approved">Aprobada</option>
                  <option value="ordered">Ordenada</option>
                  <option value="received">Recibida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
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
                <SecondaryButton
                  type="button"
                  onClick={() => setShowForm(false)}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton
                  type="submit">
                  
                  {editingOrder ? 'Actualizar' : 'Guardar'}
                
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowItemForm(false)}>
          <div className="glass-panel relative w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">Agregar Item</h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Código</label>
                <input
                  type="text"
                  value={itemFormData.item_code}
                  onChange={(e) => setItemFormData({ ...itemFormData, item_code: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Descripción</label>
                <input
                  type="text"
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Cantidad</label>
                  <input
                    type="number"
                    value={itemFormData.quantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseFloat(e.target.value) })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Unidad</label>
                  <input
                    type="text"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Precio Unitario</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemFormData.unit_price}
                  onChange={(e) => setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <SecondaryButton
                  type="button"
                  onClick={() => setShowItemForm(false)}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton
                  type="submit">
                  
                  Agregar
                
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.show}
        onCancel={() => setDeleteDialog({ show: false, order: null })}
        onConfirm={() => deleteDialog.order && handleDelete(deleteDialog.order)}
        title="Eliminar Orden"
        message={`¿Estás seguro de que deseas eliminar la orden "${deleteDialog.order?.code}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
