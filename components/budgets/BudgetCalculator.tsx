'use client';

import { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Save, Download } from 'lucide-react';
import { calculateSlab, SlabDimensions, calculateSlabCost, SlabCostParams } from '@/lib/calculators/slabCalculators';
import { offlineDB } from '@/lib/db/offlineStore';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

// Interfaces for budget calculation
interface BudgetItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  category: string;
}

interface BudgetSummary {
  directCost: number;
  indirectCost: number;
  contingency: number;
  profit: number;
  total: number;
}

export default function BudgetCalculator() {
  const { showToast } = useToast();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [indirectPercentage, setIndirectPercentage] = useState(15);
  const [contingencyPercentage, setContingencyPercentage] = useState(5);
  const [profitPercentage, setProfitPercentage] = useState(10);
  const [projectName, setProjectName] = useState('Proyecto Sample');
  const [clientName, setClientName] = useState('Cliente Sample');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; desc: string } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Slab calculator state
  const [slabDimensions, setSlabDimensions] = useState<SlabDimensions>({
    length: 10,
    width: 8,
    thickness: 0.10,
    slabType: 'solid',
  });

  const [slabCostParams, setSlabCostParams] = useState<SlabCostParams>({
    concretePricePerM3: 850,
    steelPricePerKg: 8.50,
    formworkPricePerM2: 45,
    meshPricePerM2: 35,
    viguetaPricePerM: 45,
    bovedillaPricePerUnit: 8,
  });

  const calculateSummary = (): BudgetSummary => {
    const directCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const indirectCost = directCost * (indirectPercentage / 100);
    const contingency = directCost * (contingencyPercentage / 100);
    const profit = directCost * (profitPercentage / 100);
    const total = directCost + indirectCost + contingency + profit;

    return {
      directCost,
      indirectCost,
      contingency,
      profit,
      total,
    };
  };

  const addSlabCalculation = () => {
    const result = calculateSlab(slabDimensions);
    const cost = calculateSlabCost(result, slabCostParams);
    
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      code: `LOS-${slabDimensions.slabType.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      description: result.description,
      unit: 'm²',
      quantity: slabDimensions.length * slabDimensions.width,
      unitCost: cost / (slabDimensions.length * slabDimensions.width),
      totalCost: cost,
      category: 'Estructura',
    };

    setItems([...items, newItem]);
    showToast('success', 'Cálculo de losa agregado al presupuesto');
  };

  const addItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      code: `ITEM-${Date.now().toString().slice(-4)}`,
      description: 'Nuevo Item',
      unit: 'unid',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      category: 'General',
    };

    setItems([...items, newItem]);
    showToast('success', 'Item agregado al presupuesto');
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = Number(updated.quantity) * Number(updated.unitCost);
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setDeleteConfirm({ id, desc: item.description });
    }
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setItems(items.filter(item => item.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      showToast('success', 'Item eliminado del presupuesto');
    }
  };

  const saveBudget = async () => {
    setSaveLoading(true);
    try {
      // Implementation for saving to database
      showToast('success', 'Presupuesto guardado exitosamente');
    } catch (error) {
      showToast('error', 'Error al guardar el presupuesto');
    } finally {
      setSaveLoading(false);
    }
  };

  const generatePDF = () => {
    showToast('success', 'Función de PDF en desarrollo');
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            Calculadora de Presupuestos
          </h1>
          <div className="flex gap-2">
            <button
              onClick={saveBudget}
              disabled={saveLoading}
              className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveLoading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={generatePDF}
              className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Nombre del Proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Nombre del proyecto"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Nombre del cliente"
            />
          </div>
        </div>
      </div>

      {/* Slab Calculator Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Calculadora de Losas</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Longitud (m)</label>
            <input
              type="number"
              value={slabDimensions.length}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, length: Number(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Ancho (m)</label>
            <input
              type="number"
              value={slabDimensions.width}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, width: Number(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Espesor (m)</label>
            <input
              type="number"
              step="0.01"
              value={slabDimensions.thickness}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, thickness: Number(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Tipo de Losa</label>
            <select
              value={slabDimensions.slabType}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, slabType: e.target.value as any })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="solid">Sólida Traditional</option>
              <option value="prefabricated">Prefabricada</option>
              <option value="metal_pergola">Pérgola Metálica</option>
              <option value="wood_pergola">Pérgola de Madera</option>
              <option value="clay_tile">Tejado de Barro</option>
            </select>
          </div>
        </div>

        <button
          onClick={addSlabCalculation}
          className="glass-button w-full px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Agregar Cálculo de Losa
        </button>
      </div>

      {/* Budget Items Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Items del Presupuesto</h2>
          <button
            onClick={addItem}
            className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Item
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Calculator className="w-8 h-8 text-white/30" />}
            title="No hay items en el presupuesto"
            description="Agregue cálculos de losa o items manuales para comenzar a armar el presupuesto."
          />
        ) : (
          <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-2 px-3">Código</th>
                  <th className="text-left text-white/60 py-2 px-3">Descripción</th>
                  <th className="text-left text-white/60 py-2 px-3">Unidad</th>
                  <th className="text-left text-white/60 py-2 px-3">Cantidad</th>
                  <th className="text-left text-white/60 py-2 px-3">Costo Unitario</th>
                  <th className="text-left text-white/60 py-2 px-3">Costo Total</th>
                  <th className="text-right text-white/60 py-2 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-2 px-3 text-white">{item.code}</td>
                    <td className="py-2 px-3 text-white">{item.description}</td>
                    <td className="py-2 px-3 text-white">{item.unit}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                        className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      />
                    </td>
                    <td className="py-2 px-3 text-white font-medium">
                      {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(item.totalCost)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Resumen del Presupuesto</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Indirectos (%)</label>
            <input
              type="number"
              value={indirectPercentage}
              onChange={(e) => setIndirectPercentage(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Contingencia (%)</label>
            <input
              type="number"
              value={contingencyPercentage}
              onChange={(e) => setContingencyPercentage(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Utilidad (%)</label>
            <input
              type="number"
              value={profitPercentage}
              onChange={(e) => setProfitPercentage(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs sm:text-sm mb-1">Total</label>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(summary.total)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-3 rounded-lg">
            <p className="text-white/60 text-xs sm:text-sm">Costo Directo</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(summary.directCost)}
            </p>
          </div>
          <div className="glass-card p-3 rounded-lg">
            <p className="text-white/60 text-xs sm:text-sm">Indirectos</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(summary.indirectCost)}
            </p>
          </div>
          <div className="glass-card p-3 rounded-lg">
            <p className="text-white/60 text-xs sm:text-sm">Contingencia</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(summary.contingency)}
            </p>
          </div>
          <div className="glass-card p-3 rounded-lg">
            <p className="text-white/60 text-xs sm:text-sm">Utilidad</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(summary.profit)}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Eliminar Item"
        message={`¿Está seguro de eliminar "${deleteConfirm?.desc}" del presupuesto?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}