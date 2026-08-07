'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, TrendingUp, X, Save, ArrowDown, ArrowUp, PackagePlus, Warehouse, FolderOpen, ShoppingCart, RefreshCw } from 'lucide-react';
import { offlineDB, LocalWarehouseStock, LocalProject, LocalSupplier } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { queueDelete, PENDING_STATUSES } from '@/lib/utils/offlineSync';
import { resolveSyncStatus, normalizeSyncStatus } from '@/lib/utils/syncState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useIncrementalList } from '@/lib/hooks/useIncrementalList';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import OnboardingTooltip from '@/components/ui/OnboardingTooltip';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { warehouseStockSchema, validateSchema, formatValidationErrors } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth/userId';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';
import { useMaterialAlertContext } from '@/context/MaterialAlertContext';
import { useAutoPurchaseOrder } from '@/hooks/useAutoPurchaseOrder';
import { WAREHOUSE_UNIT_COLORS, getWarehouseUnitColor } from '@/lib/config/colorPalettes';
import { BUSINESS_CONFIG } from '@/lib/config/app.config';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  preferred_supplier_id?: string;
  auto_generate_po?: boolean;
  category?: string;
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

// Colores de unidades basados en paleta centralizada
const unitColors: Record<string, { bg: string; text: string; border: string }> = {
  unid: { bg: hexToRgba(getWarehouseUnitColor('unidad'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('unidad')), border: hexToRgba(getWarehouseUnitColor('unidad'), 0.3) },
  kg: { bg: hexToRgba(getWarehouseUnitColor('kg'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('kg')), border: hexToRgba(getWarehouseUnitColor('kg'), 0.3) },
  m: { bg: hexToRgba(getWarehouseUnitColor('m'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('m')), border: hexToRgba(getWarehouseUnitColor('m'), 0.3) },
  m2: { bg: hexToRgba(getWarehouseUnitColor('m2'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('m2')), border: hexToRgba(getWarehouseUnitColor('m2'), 0.3) },
  m3: { bg: hexToRgba(getWarehouseUnitColor('m3'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('m3')), border: hexToRgba(getWarehouseUnitColor('m3'), 0.3) },
  litro: { bg: hexToRgba(getWarehouseUnitColor('litro'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('litro')), border: hexToRgba(getWarehouseUnitColor('litro'), 0.3) },
  bolsa: { bg: hexToRgba(getWarehouseUnitColor('bolsa'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('bolsa')), border: hexToRgba(getWarehouseUnitColor('bolsa'), 0.3) },
  rollo: { bg: hexToRgba(getWarehouseUnitColor('rollo'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('rollo')), border: hexToRgba(getWarehouseUnitColor('rollo'), 0.3) },
  galón: { bg: hexToRgba(getWarehouseUnitColor('galón'), 0.2), text: hexToLightRgb(getWarehouseUnitColor('galón')), border: hexToRgba(getWarehouseUnitColor('galón'), 0.3) }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WarehouseManager() {
  const { showToast } = useToast();
  const { financial } = useFinancialSettings();
  const { alerts, clearAlerts } = useMaterialAlertContext();
  const { 
    depletionAlerts, 
    isProcessing, 
    checkStockDepletion, 
    generateDraftPO, 
    generateAllDepletedPOs 
  } = useAutoPurchaseOrder();

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------

  const [stockItems, setStockItems] = useState<LocalWarehouseStock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalWarehouseStock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    item: LocalWarehouseStock;
    action?: 'delete' | 'adjust';
    adjustment?: number;
    newStock?: number;
  } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [availableProjects, setAvailableProjects] = useState<LocalProject[]>([]);
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);

  const [formData, setFormData] = useState<StockFormData>({
    project_id: undefined,
    item_code: '',
    description: '',
    unit: 'unid',
    current_stock: 0,
    minimum_threshold: 10,
    unit_cost: 0,
    preferred_supplier_id: undefined,
    auto_generate_po: false,
    category: '',
  });

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadStockItems();
    loadProjects();
    loadSuppliers();
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

  const loadSuppliers = async () => {
    try {
      const userId = await getUserScope();
      setSuppliers(scopeLocalRows(await offlineDB.suppliers.toArray(), userId));
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Check for stock depletion on load and when stock changes
  useEffect(() => {
    checkStockDepletion();
  }, [stockItems]);

  // ---------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // ---------------------------------------------------------------------------

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
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
      const userId = await getUserScope();
      const localItems = scopeLocalRows(await offlineDB.warehouseStock.toArray(), userId);
      setStockItems(localItems);


} catch (error) {
      console.error('Error loading stock items:', error);
      showToast('error', 'Error al cargar items del inventario');
    }
  };

  const loadProjects = async () => {
    try {
      const userId = await getUserScope();
      const projects = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('error', 'Error al cargar proyectos');
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
      preferred_supplier_id: undefined,
      auto_generate_po: false,
      category: '',
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
        preferred_supplier_id: item.preferred_supplier_id,
        auto_generate_po: item.auto_generate_po,
        category: item.category,
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
      // Validar con Zod schema
      const validation = validateSchema(warehouseStockSchema, formData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        setSaveLoading(false);
        return;
      }

      // Validar unicidad global de item_code (evita duplicados entre proyectos)
      if (!editingItem) {
        const existingItem = await offlineDB.warehouseStock
          .where('item_code')
          .equals(formData.item_code)
          .first();
        if (existingItem) {
          showToast('error', 'El código de item ya existe en el sistema. Use un código único global.');
          setSaveLoading(false);
          return;
        }
      }

      // Obtener user_id para tenencia
      const userId = await getCurrentUserId();

      // Validar stock mínimo al asignar a un proyecto
      if (formData.project_id && formData.current_stock !== undefined && formData.minimum_threshold !== undefined) {
        if (formData.current_stock <= formData.minimum_threshold) {
          showToast('warning', `Advertencia: stock actual (${formData.current_stock}) está en o por debajo del mínimo (${formData.minimum_threshold}). Considere reabastecer antes de asignar a proyecto.`);
        }
      }

      const itemData: LocalWarehouseStock = {
        user_id: userId || undefined,
        ...formData,
        sync_status: resolveSyncStatus({ isNewRecord: !editingItem, isOnline, previousStatus: editingItem?.sync_status }),
      };

      if (editingItem) {
        const wasSynced = normalizeSyncStatus(editingItem.sync_status) === 'synced';

        // Update in localStorage
        await offlineDB.warehouseStock.update(editingItem.id!, {
          ...itemData,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingItem.sync_status, isOnline }),
        });

        // Update in Supabase if online
        if (isOnline && wasSynced && supabase) {
          const { error } = await supabase
            .from('warehouse_stock')
            .update({
              project_id: itemData.project_id,
              item_code: itemData.item_code,
              description: itemData.description,
              unit: itemData.unit,
              current_stock: itemData.current_stock,
              minimum_threshold: itemData.minimum_threshold,
              unit_cost: itemData.unit_cost,
              preferred_supplier_id: itemData.preferred_supplier_id,
              auto_generate_po: itemData.auto_generate_po,
              category: itemData.category,
            })
            .eq('id', editingItem.id);

          if (error) {
            console.error('Error updating stock in Supabase:', error);
            await offlineDB.warehouseStock.update(editingItem.id!, {
              sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingItem?.sync_status ?? 'synced', isOnline }),
            });
            showToast('warning', 'Material actualizado localmente; pendiente de sync');
          } else {
            await offlineDB.warehouseStock.update(editingItem.id!, { sync_status: 'synced' });
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
              project_id: itemData.project_id,
              item_code: itemData.item_code,
              description: itemData.description,
              unit: itemData.unit,
              current_stock: itemData.current_stock,
              minimum_threshold: itemData.minimum_threshold,
              unit_cost: itemData.unit_cost,
              preferred_supplier_id: itemData.preferred_supplier_id,
              auto_generate_po: itemData.auto_generate_po,
              category: itemData.category,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating stock in Supabase:', error);
            await offlineDB.warehouseStock.update(id, {
              sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }),
            });
            showToast('warning', 'Material creado localmente; pendiente de sync');
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
    setDeleteConfirm({
      show: true,
      item,
      action: 'delete'
    });
  };

  const confirmDeleteItem = async () => {
    if (!deleteConfirm) return;
    
    try {
      await queueDelete('warehouse_stock', deleteConfirm.item);
      await offlineDB.warehouseStock.delete(deleteConfirm.item.id!);

      await loadStockItems();
      showToast('info', `Material "${deleteConfirm.item.description}" eliminado del inventario`);
    } catch (error) {
      console.error('Error deleting stock item:', error);
      showToast('error', 'Error al eliminar el material');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmStockAdjustment = async () => {
    if (!deleteConfirm || !deleteConfirm.adjustment || deleteConfirm.newStock === undefined) return;

    try {
      const item = deleteConfirm.item;
      const newStock = deleteConfirm.newStock;
      const wasSynced = normalizeSyncStatus(item.sync_status) === 'synced';

      await offlineDB.warehouseStock.update(item.id!, {
        current_stock: newStock,
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: item.sync_status, isOnline }),
      });

      if (isOnline && wasSynced && supabase) {
        await supabase
          .from('warehouse_stock')
          .update({ current_stock: newStock })
          .eq('id', item.id);
      }

      await loadStockItems();
      showToast(
        'success',
        `Stock de "${item.description}" ${deleteConfirm.adjustment > 0 ? 'aumentado' : 'disminuido'} en ${Math.abs(deleteConfirm.adjustment)}`
      );
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showToast('error', 'Error al ajustar el stock');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleStockAdjustment = async (item: LocalWarehouseStock, adjustment: number) => {
    try {
      const newStock = item.current_stock + adjustment;
      if (newStock < 0) {
        showToast('warning', 'El stock no puede ser negativo');
        return;
      }

      // Confirmación para ajustes significativos (> 10% del stock actual)
      const percentageChange = Math.abs(adjustment) / (item.current_stock || 1) * 100;
      if (percentageChange > 10) {
        setDeleteConfirm({
          show: true,
          item,
          action: 'adjust',
          adjustment,
          newStock
        });
        return;
      }

      const wasSynced = normalizeSyncStatus(item.sync_status) === 'synced';

      await offlineDB.warehouseStock.update(item.id!, {
        current_stock: newStock,
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: item.sync_status, isOnline }),
      });

      if (isOnline && wasSynced && supabase) {
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

  // Renderizado incremental: evita saturar el DOM con miles de materiales.
  const {
    visibleItems: visibleItems,
    hasMore: hasMoreItems,
    remaining: remainingItems,
    showMore: showMoreItems,
  } = useIncrementalList({
    items: filteredItems,
    increment: 30,
    resetOnItemsChange: true,
  });

  const lowStockItems = stockItems.filter(item => item.current_stock <= item.minimum_threshold);
  const summary = calculateSummary();

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['warehouse_stock', 'projects'], loadStockItems);

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
            <Tooltip content={isOnline ? 'Conectado a internet' : 'Trabajando sin conexión'}>
              <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isOnline ? '🟢 En línea' : '🟡 Sin conexión'}
              </div>
            </Tooltip>
            <OnboardingTooltip
              id="warehouse-new-button"
              title="Agregar materiales al inventario"
              description="Registre materiales con su stock mínimo para activar alertas y generación automática de OC."
            >
              <Tooltip content="Agregar nuevo material al inventario">
                <PrimaryButton onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>
                  <span className="hidden sm:inline">Nuevo Material</span>
                  <span className="sm:hidden">Nuevo</span>
                </PrimaryButton>
              </Tooltip>
            </OnboardingTooltip>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white/60 text-xs sm:text-sm">Total Items</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{summary.totalItems}</p>
          </div>
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-white/60 text-xs sm:text-sm">Stock Bajo</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-400">{summary.lowStockCount}</p>
          </div>
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-white/60 text-xs sm:text-sm">Valor Inventario</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(summary.totalInventoryValue, financial)}</p>
          </div>
          <div className="glass-card p-4 sm:p-6 rounded-xl border-l-4 border-l-violet-500">
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

      {/* Material Alerts from Budget Integration */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Alertas de Stock por Proyectos
          </h3>
          {alerts.map((alert, index) => (
            <div key={`${alert.projectId}-${alert.materialCode}-${index}`} 
                 className={`glass-card p-4 rounded-xl border-l-4 ${
                   alert.priority === 'high' ? 'border-l-red-500' : 'border-l-amber-500'
                 }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{alert.projectName}</p>
                  <p className="text-white/70 text-sm">{alert.materialDescription}</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-white/50">Requerido</p>
                      <p className="text-white font-medium">{alert.requiredQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Disponible</p>
                      <p className="text-white font-medium">{alert.availableQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Déficit</p>
                      <p className={alert.priority === 'high' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                        {alert.shortage.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => clearAlerts(alert.projectId)}
                  className="text-white/60 hover:text-white p-1"
                  aria-label="Cerrar alerta de stock"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Depletion & Auto-PO Alerts */}
      {depletionAlerts.length > 0 && (
        <div className="mt-4 glass-panel rounded-2xl p-4 sm:p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              Alertas de Agotamiento - {depletionAlerts.length} Materiales
            </h3>
            <button
              onClick={async () => {
                const results = await generateAllDepletedPOs();
                if (results.length > 0) {
                  const successCount = results.filter(r => r.success).length;
                  showToast('success', `${successCount} órdenes de compra generadas automáticamente`);
                }
              }}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-600 text-white text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              aria-label="Generar órdenes de compra automáticas para materiales agotados"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Generando POs...' : 'Generar POs Automáticas'}
            </button>
          </div>
          
          <div className="space-y-3">
            {depletionAlerts.map((alert, index) => (
              <div key={index} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-white font-medium">{alert.stockItem.description}</span>
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                        {alert.stockItem.item_code}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <p className="text-white/50">Stock Actual</p>
                        <p className="text-red-400 font-medium">{alert.currentStock.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Mínimo</p>
                        <p className="text-white">{alert.minimumThreshold.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Recomendado</p>
                        <p className="text-cyan-400 font-medium">{alert.recommendedOrderQuantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Costo Estimado</p>
                        <p className="text-emerald-400 font-medium">{formatCurrency(alert.estimatedCost, financial)}</p>
                      </div>
                    </div>
                    {alert.supplier && (
                      <div className="mt-2 text-xs text-white/60">
                        Proveedor: {alert.supplier.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      const result = await generateDraftPO(alert.stockItem);
                      if (result.success) {
                        showToast('success', `PO generada: ${result.purchaseOrderId}`);
                      } else {
                        showToast('error', result.message);
                      }
                    }}
                    disabled={isProcessing}
                    className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs border border-cyan-500/30 disabled:opacity-50"
                    aria-label={`Generar orden de compra para ${alert.stockItem.description}`}
                  >
                    Generar PO
                  </button>
                </div>
              </div>
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
              <PrimaryButton onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />} aria-label="Agregar nuevo material al inventario">
                <span>Nuevo Material</span>
              </PrimaryButton>
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
                {visibleItems.map((item) => (
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
                    <td className="py-3 px-4 text-white/70">{formatCurrency(item.unit_cost, financial)}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(item.current_stock * item.unit_cost, financial)}</td>
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
                        <Tooltip content="Aumentar stock en 1 unidad">
                          <button
                            onClick={() => handleStockAdjustment(item, 1)}
                            className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            aria-label={`Aumentar stock de ${item.description}`}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Disminuir stock en 1 unidad">
                          <button
                            onClick={() => handleStockAdjustment(item, -1)}
                            className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            aria-label={`Disminuir stock de ${item.description}`}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionButton
                          onClick={() => handleOpenModal(item)}
                          icon={<Edit className="w-4 h-4" />}
                          label="Editar material"
                          tooltip="Editar información del material"
                          variant="primary"
                        />
                        <ActionButton
                          onClick={() => setDeleteConfirm({ show: true, item, action: 'delete' })}
                          icon={<Trash2 className="w-4 h-4" />}
                          label="Eliminar material"
                          tooltip="Eliminar material del inventario"
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMoreItems && (
              <div className="text-center py-3 border-t border-white/10">
                <button
                  onClick={showMoreItems}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
                  aria-label={`Ver más materiales, ${remainingItems} restantes`}
                >
                  Ver más materiales ({remainingItems} restantes)
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
                {editingItem ? 'Editar Material' : 'Nuevo Material'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white p-1"
                aria-label="Cerrar formulario de material"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
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

            {/* Auto-PO and Category Section */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyan-400" />
                Configuración de Compras Automáticas
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Categoría de Material</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: cemento, acero, madera"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Proveedor Preferido</label>
                  <select
                    value={formData.preferred_supplier_id}
                    onChange={(e) => setFormData({ ...formData, preferred_supplier_id: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Seleccione un proveedor...</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.is_preferred ? '⭐' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate_po || false}
                    onChange={(e) => setFormData({ ...formData, auto_generate_po: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-500"
                  />
                  <span className="text-white/70 text-sm flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    Generar PO Automática
                  </span>
                </label>
                {BUSINESS_CONFIG.stockManagement.auto_po_enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AutoPO global activo
                  </span>
                )}
              </div>
            </div>

             <div className="flex justify-end gap-3 mt-6">
               <SecondaryButton
                 type="button"
                 onClick={handleCloseModal}
                 disabled={saveLoading}
                 aria-label="Cancelar y cerrar formulario de material"
               >
                 Cancelar
               </SecondaryButton>
               <PrimaryButton
                 type="submit"
                 disabled={saveLoading}
                 aria-label={editingItem ? 'Actualizar material existente' : 'Guardar nuevo material'}
                 icon={<Save className="w-4 h-4" />}
               >
                 {saveLoading ? <LoadingSpinner size={16} /> : 'Guardar'}
               </PrimaryButton>
             </div>
             </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm?.show}
        title={deleteConfirm?.action === 'adjust' ? 'Ajustar stock' : 'Eliminar material'}
        message={deleteConfirm?.action === 'adjust' 
          ? `¿Está seguro de ajustar el stock de "${deleteConfirm.item.description}" en ${Math.abs(deleteConfirm.adjustment || 0)} unidades?` 
          : `¿Está seguro de eliminar "${deleteConfirm?.item.description}" del inventario? Esta acción no se puede deshacer.`
        }
        variant="danger"
        confirmLabel={deleteConfirm?.action === 'adjust' ? 'Ajustar' : 'Eliminar'}
        onConfirm={() => {
          if (deleteConfirm?.action === 'adjust') {
            confirmStockAdjustment();
          } else {
            confirmDeleteItem();
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
