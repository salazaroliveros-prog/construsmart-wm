'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, TrendingUp, X, Save, ArrowDown, ArrowUp, PackagePlus, Warehouse, FolderOpen } from 'lucide-react';
import { offlineDB, LocalWarehouseStock, LocalProject } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StockFormData {
  project_id?: string;
  item_code: string;
  description: string;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  unit_cost: number;
}

// ============================================================================
// UNIT LABELS AND COLORS
// ============================================================================

const unitLabels: Record<string, string> = {
  unid: 'Unidad',
  kg: 'Kilogramo',
  m: 'Metro',
  m2: 'Metro Cuadrado',
  m3: 'Metro Cúbico',
  litro: 'Litro',
  bolsa: 'Bolsa',
  rollo: 'Rollo',
  galón: 'Galón'
};

const unitColors: Record<string, { bg: string; text: string; border: string }> = {
  unid: { bg: 'rgba(59, 130, 246, 0.2)', text: 'rgb(147, 197, 253)', border: 'rgba(59, 130, 246, 0.3)' },
  kg: { bg: 'rgba(16, 185, 129, 0.2)', text: 'rgb(134, 239, 172)', border: 'rgba(16, 185, 129, 0.3)' },
  m: { bg: 'rgba(245, 158, 11, 0.2)', text: 'rgb(253, 186, 116)', border: 'rgba(245, 158, 11, 0.3)' },
  m2: { bg: 'rgba(139, 92, 246, 0.2)', text: 'rgb(196, 181, 253)', border: 'rgba(139, 92, 246, 0.3)' },
  m3: { bg: 'rgba(236, 72, 153, 0.2)', text: 'rgb(244, 114, 182)', border: 'rgba(236, 72, 153, 0.3)' },
  litro: { bg: 'rgba(20, 184, 166, 0.2)', text: 'rgb(45, 212, 191)', border: 'rgba(20, 184, 166, 0.3)' },
  bolsa: { bg: 'rgba(99, 102, 241, 0.2)', text: 'rgb(129, 140, 248)', border: 'rgba(99, 102, 241, 0.3)' },
  rollo: { bg: 'rgba(34, 197, 94, 0.2)', text: 'rgb(74, 222, 128)', border: 'rgba(34, 197, 94, 0.3)' },
  galón: { bg: 'rgba(168, 85, 247, 0.2)', text: 'rgb(192, 132, 252)', border: 'rgba(168, 85, 247, 0.3)' }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WarehouseManager() {
  const { showToast } = useToast();

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------

  const [stockItems, setStockItems] = useState<LocalWarehouseStock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalWarehouseStock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalWarehouseStock | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [availableProjects, setAvailableProjects] = useState<LocalProject[]>([]);

  const [formData, setFormData] = useState<StockFormData>({
    project_id: undefined,
    item_code: '',
    description: '',
    unit: 'unid',
    current_stock: 0,
    minimum_threshold: 10,
    unit_cost: 0,
  });

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadStockItems();
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

  // ---------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // ---------------------------------------------------------------------------

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateSummary = () => {
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

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadStockItems = async () => {
    try {
      const localItems = await offlineDB.warehouseStock.toArray();
      setStockItems(localItems);

      if (navigator.onLine && supabase) {
        const { data: supabaseItems } = await supabase
          .from('warehouse_stock')
          .select('*')
          .order('description', { ascending: true });

        if (supabaseItems) {
          for (const item of supabaseItems) {
            await offlineDB.warehouseStock.put({
              ...item,
              sync_status: 'synced',
            });
          }

          const updatedItems = await offlineDB.warehouseStock.toArray();
          setStockItems(updatedItems);
        }
      }
    } catch (error) {
      console.error('Error loading stock items:', error);
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

  // ---------------------------------------------------------------------------
  // FORM MANAGEMENT
  // ---------------------------------------------------------------------------

  const resetForm = () => {
    setFormData({
      project_id: selectedProject === 'all' ? undefined : selectedProject,
      item_code: '',
      description: '',
      unit: 'unid',
      current_stock: 0,
      minimum_threshold: 10,
      unit_cost: 0,
    });
    setEditingItem(null);
  };

  const handleOpenModal = (item?: LocalWarehouseStock) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        project_id: item.project_id,
        item_code: item.item_code,
        description: item.description,
        unit: item.unit,
        current_stock: item.current_stock,
        minimum_threshold: item.minimum_threshold,
        unit_cost: item.unit_cost,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // ---------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  const handleSaveItem = async () => {
    setSaveLoading(true);

    try {
      const itemData: LocalWarehouseStock = {
        ...formData,
        sync_status: isOnline ? 'synced' : 'created_offline',
      };

      if (editingItem) {
        // Update in localStorage
        await offlineDB.warehouseStock.update(editingItem.id!, {
          ...itemData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });

        // Update in Supabase if online
        if (isOnline && editingItem.id && supabase) {
          const { error } = await supabase
            .from('warehouse_stock')
            .update({
              item_code: itemData.item_code,
              description: itemData.description,
              unit: itemData.unit,
              current_stock: itemData.current_stock,
              minimum_threshold: itemData.minimum_threshold,
              unit_cost: itemData.unit_cost,
            })
            .eq('id', editingItem.id);

          if (error) {
            console.error('Error updating stock in Supabase:', error);
            await offlineDB.warehouseStock.update(editingItem.id!, {
              sync_status: 'updated_offline',
            });
          }
        }
      } else {
        // Create in localStorage
        const id = await offlineDB.warehouseStock.add(itemData);

        // Create in Supabase if online
        if (isOnline && supabase) {
          const { data, error } = await supabase
            .from('warehouse_stock')
            .insert({
              item_code: itemData.item_code,
              description: itemData.description,
              unit: itemData.unit,
              current_stock: itemData.current_stock,
              minimum_threshold: itemData.minimum_threshold,
              unit_cost: itemData.unit_cost,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating stock in Supabase:', error);
          } else if (data) {
            await offlineDB.warehouseStock.update(id, {
              id: data.id,
              sync_status: 'synced',
            });
          }
        }
      }

      await loadStockItems();
      handleCloseModal();
      showToast(
        'success',
        editingItem
          ? `Material "${formData.description}" actualizado`
          : `Material "${formData.description}" agregado al inventario`
      );
    } catch (error) {
      console.error('Error saving stock item:', error);
      showToast('error', 'Error al guardar el material');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteItem = async (item: LocalWarehouseStock) => {
    try {
      await offlineDB.warehouseStock.delete(item.id!);

      if (isOnline && item.id && supabase) {
        const { error } = await supabase.from('warehouse_stock').delete().eq('id', item.id);
        if (error) console.error('Error deleting stock from Supabase:', error);
      }

      await loadStockItems();
      showToast('info', `Material "${item.description}" eliminado del inventario`);
    } catch (error) {
      console.error('Error deleting stock item:', error);
      showToast('error', 'Error al eliminar el material');
    }
  };

  const handleStockAdjustment = async (item: LocalWarehouseStock, adjustment: number) => {
    try {
      const newStock = item.current_stock + adjustment;
      if (newStock < 0) {
        showToast('warning', 'El stock no puede ser negativo');
        return;
      }

      await offlineDB.warehouseStock.update(item.id!, {
        current_stock: newStock,
        sync_status: isOnline ? 'synced' : 'updated_offline',
      });

      if (isOnline && item.id && supabase) {
        await supabase
          .from('warehouse_stock')
          .update({ current_stock: newStock })
          .eq('id', item.id);
      }

      await loadStockItems();
      showToast(
        'success',
        `Stock de "${item.description}" ${adjustment > 0 ? 'aumentado' : 'disminuido'} en ${Math.abs(adjustment)}`
      );
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showToast('error', 'Error al ajustar el stock');
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERING
  // ---------------------------------------------------------------------------

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.item_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || item.project_id === selectedProject;
    return matchesSearch && matchesProject;
  });

  const lowStockItems = stockItems.filter(item => item.current_stock <= item.minimum_threshold);
  const summary = calculateSummary();

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Warehouse className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Gestión de Almacén
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Controle inventario y stock de materiales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
              isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isOnline ? '🟢 En línea' : '🟡 Sin conexión'}
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Material</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white/60 text-xs sm:text-sm">Total Items</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{summary.totalItems}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-white/60 text-xs sm:text-sm">Stock Bajo</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-400">{summary.lowStockCount}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-white/60 text-xs sm:text-sm">Valor Inventario</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(summary.totalInventoryValue)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-violet-500">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              <span className="text-white/60 text-xs sm:text-sm">Unidades Totales</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{summary.totalUnits.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-amber-500/30 bg-amber-500/10" role="alert">
          <h3 className="text-amber-400 font-medium mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Alerta de Stock Bajo ({lowStockItems.length} items)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.id} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm border border-amber-500/30">
                {item.description} ({item.current_stock} {item.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar materiales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
              />
            </div>
          </div>
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

      {/* Stock Items Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        {stockItems.length === 0 ? (
          <EmptyState
            icon={<PackagePlus className="w-8 h-8 text-white/30" />}
            title="Inventario vacío"
            description="Agregue materiales al inventario para comenzar a gestionar el almacén."
            action={
              <button
                onClick={() => handleOpenModal()}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Material</span>
              </button>
            }
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-white/30" />}
            title="Sin resultados"
            description="Intente con otros términos de búsqueda."
          />
        ) : (
          <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-3 px-4">Código</th>
                  <th className="text-left text-white/60 py-3 px-4">Descripción</th>
                  <th className="text-left text-white/60 py-3 px-4">Unidad</th>
                  <th className="text-left text-white/60 py-3 px-4">Stock Actual</th>
                  <th className="text-left text-white/60 py-3 px-4">Mínimo</th>
                  <th className="text-left text-white/60 py-3 px-4">Costo Unit.</th>
                  <th className="text-left text-white/60 py-3 px-4">Valor Total</th>
                  <th className="text-left text-white/60 py-3 px-4">Estado</th>
                  <th className="text-left text-white/60 py-3 px-4">Ajuste</th>
                  <th className="text-right text-white/60 py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4 text-cyan-400 font-mono text-xs">{item.item_code}</td>
                    <td className="py-3 px-4 text-white font-medium">{item.description}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: unitColors[item.unit]?.bg || 'rgba(255,255,255,0.1)',
                          color: unitColors[item.unit]?.text || 'white',
                          border: `1px solid ${unitColors[item.unit]?.border || 'rgba(255,255,255,0.2)'}`
                        }}
                      >
                        {unitLabels[item.unit] || item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{item.current_stock.toLocaleString()}</td>
                    <td className="py-3 px-4 text-white/70">{item.minimum_threshold}</td>
                    <td className="py-3 px-4 text-white/70">{formatCurrency(item.unit_cost)}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(item.current_stock * item.unit_cost)}</td>
                    <td className="py-3 px-4">
                      {item.current_stock <= item.minimum_threshold ? (
                        <span className="flex items-center space-x-1 text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Bajo</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-emerald-400">
                          <Package className="w-4 h-4" />
                          <span>OK</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStockAdjustment(item, 1)}
                          className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          title="Aumentar stock"
                          aria-label={`Aumentar stock de ${item.description}`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStockAdjustment(item, -1)}
                          className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          title="Disminuir stock"
                          aria-label={`Disminuir stock de ${item.description}`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="text-cyan-400 hover:text-cyan-300 p-1"
                          title="Editar"
                          aria-label={`Editar material ${item.description}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Eliminar"
                          aria-label={`Eliminar material ${item.description}`}
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
                {editingItem ? 'Editar Material' : 'Nuevo Material'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
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
                <label className="block text-white/60 text-sm mb-1">Código del Item</label>
                <input
                  type="text"
                  value={formData.item_code}
                  onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Unidad</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="unid">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="m">Metro</option>
                  <option value="m2">Metro Cuadrado</option>
                  <option value="m3">Metro Cúbico</option>
                  <option value="litro">Litro</option>
                  <option value="bolsa">Bolsa</option>
                  <option value="rollo">Rollo</option>
                  <option value="galón">Galón</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/60 text-sm mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Stock Actual</label>
                <input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.minimum_threshold}
                  onChange={(e) => setFormData({ ...formData, minimum_threshold: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/60 text-sm mb-1">Costo Unitario (GTQ)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
                disabled={saveLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                disabled={saveLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saveLoading ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar material"
        message={`¿Está seguro de eliminar "${deleteConfirm?.description}" del inventario? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteConfirm) handleDeleteItem(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
