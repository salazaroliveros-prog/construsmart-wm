'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, TrendingUp, X, Save, ArrowDown, ArrowUp } from 'lucide-react';
import { offlineDB, LocalWarehouseStock } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';

interface StockFormData {
  item_code: string;
  description: string;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  unit_cost: number;
}

export default function WarehouseManager() {
  const [stockItems, setStockItems] = useState<LocalWarehouseStock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalWarehouseStock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const [formData, setFormData] = useState<StockFormData>({
    item_code: '',
    description: '',
    unit: 'unid',
    current_stock: 0,
    minimum_threshold: 10,
    unit_cost: 0,
  });

  useEffect(() => {
    loadStockItems();
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

  const handleOpenModal = (item?: LocalWarehouseStock) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_code: item.item_code,
        description: item.description,
        unit: item.unit,
        current_stock: item.current_stock,
        minimum_threshold: item.minimum_threshold,
        unit_cost: item.unit_cost,
      });
    } else {
      setEditingItem(null);
      setFormData({
        item_code: '',
        description: '',
        unit: 'unid',
        current_stock: 0,
        minimum_threshold: 10,
        unit_cost: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      item_code: '',
      description: '',
      unit: 'unid',
      current_stock: 0,
      minimum_threshold: 10,
      unit_cost: 0,
    });
  };

  const handleSaveItem = async () => {
    try {
      const itemData: LocalWarehouseStock = {
        ...formData,
        sync_status: isOnline ? 'synced' : 'created_offline',
      };

      if (editingItem) {
        await offlineDB.warehouseStock.update(editingItem.id!, {
          ...itemData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });
        
        if (isOnline && editingItem.id && supabase) {
          await supabase
            .from('warehouse_stock')
            .update(itemData)
            .eq('id', editingItem.id);
        }
      } else {
        const id = await offlineDB.warehouseStock.add(itemData);
        
        if (isOnline && supabase) {
          const { data } = await supabase
            .from('warehouse_stock')
            .insert(itemData)
            .select()
            .single();
          
          if (data) {
            await offlineDB.warehouseStock.update(id, { id: data.id, sync_status: 'synced' });
          }
        }
      }

      await loadStockItems();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving stock item:', error);
    }
  };

  const handleDeleteItem = async (item: LocalWarehouseStock) => {
    if (!confirm(`¿Está seguro de eliminar el item ${item.description}?`)) return;

    try {
      await offlineDB.warehouseStock.delete(item.id!);
      
      if (isOnline && item.id && supabase) {
        await supabase.from('warehouse_stock').delete().eq('id', item.id);
      }
      
      await loadStockItems();
    } catch (error) {
      console.error('Error deleting stock item:', error);
    }
  };

  const handleStockAdjustment = async (item: LocalWarehouseStock, adjustment: number) => {
    try {
      const newStock = item.current_stock + adjustment;
      if (newStock < 0) {
        alert('El stock no puede ser negativo');
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
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const filteredItems = stockItems.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = stockItems.filter(item => item.current_stock <= item.minimum_threshold);
  const totalInventoryValue = stockItems.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">📦</span>
          </span>
          <span>Gestión de Almacén</span>
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
            <span>Nuevo Material</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Total Items</span>
            <Package className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stockItems.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Stock Bajo</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{lowStockItems.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Valor Inventario</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Unidades Totales</span>
            <Package className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {stockItems.reduce((sum, item) => sum + item.current_stock, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
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

      {/* Search */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar materiales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm" style={{ minWidth: '600px' }}>
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
              <th className="text-left text-white/60 py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-cyan-400 font-mono text-xs">{item.item_code}</td>
                <td className="py-3 px-4 text-white font-medium">{item.description}</td>
                <td className="py-3 px-4 text-white/70">{item.unit}</td>
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
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStockAdjustment(item, -1)}
                      className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      title="Disminuir stock"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="text-red-400 hover:text-red-300"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingItem ? 'Editar Material' : 'Nuevo Material'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Código del Item</label>
                <input
                  type="text"
                  value={formData.item_code}
                  onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Unidad</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
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
                <label className="text-xs text-white/60 mb-1 block">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Stock Actual</label>
                <input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.minimum_threshold}
                  onChange={(e) => setFormData({ ...formData, minimum_threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block">Costo Unitario (GTQ)</label>
                <input
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
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
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm hover:opacity-90 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
