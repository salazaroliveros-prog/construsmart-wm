'use client';

import { useState } from 'react';
import { Calculator, Plus, Trash2, Save, FileText } from 'lucide-react';
import { calculateSlab, SlabDimensions, calculateSlabCost, SlabCostParams } from '@/lib/calculators/slabCalculators';
import { calculateRectangularVolume, DimensionalParams } from '@/lib/calculators/volumetricCalculators';
import PDFGenerator from '@/components/pdf/PDFGenerator';

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
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [indirectPercentage, setIndirectPercentage] = useState(15);
  const [contingencyPercentage, setContingencyPercentage] = useState(5);
  const [profitPercentage, setProfitPercentage] = useState(10);
  const [projectName, setProjectName] = useState('Proyecto Sample');
  const [clientName, setClientName] = useState('Cliente Sample');

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
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = Number(updated.quantity) * Number(updated.unitCost);
        }
        return updated;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const summary = calculateSummary();

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
          <Calculator className="w-5 h-5 text-cyan-400" />
          <span>Calculadora de Presupuestos APU</span>
        </h2>
        <div className="flex space-x-2">
          <PDFGenerator
            projectName={projectName}
            clientName={clientName}
            items={items}
            summary={summary}
            indirectPercentage={indirectPercentage}
            contingencyPercentage={contingencyPercentage}
            profitPercentage={profitPercentage}
          />
          <button className="glass-button px-4 py-2 rounded-lg text-sm text-emerald-300 flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* Project Information */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5">
        <h3 className="text-white font-medium mb-4">Información del Proyecto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Nombre del Proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Nombre del Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Slab Calculator Section */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5">
        <h3 className="text-white font-medium mb-4">Calculadora de Losas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Largo (m)</label>
            <input
              type="number"
              value={slabDimensions.length}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, length: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Ancho (m)</label>
            <input
              type="number"
              value={slabDimensions.width}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, width: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Tipo de Losa</label>
            <select
              value={slabDimensions.slabType}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, slabType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="solid">Losa Sólida</option>
              <option value="prefabricated">Vigueta y Bovedilla</option>
              <option value="metal_pergola">Pérgola Metálica</option>
              <option value="wood_pergola">Pérgola de Madera</option>
              <option value="clay_tile">Teja de Barro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Espesor (m)</label>
            <input
              type="number"
              step="0.01"
              value={slabDimensions.thickness}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, thickness: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
              disabled={slabDimensions.slabType !== 'solid'}
            />
          </div>
        </div>
        <button
          onClick={addSlabCalculation}
          className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 hover:text-cyan-200"
        >
          + Agregar Cálculo de Losa
        </button>
      </div>

      {/* Budget Items Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Items del Presupuesto</h3>
          <button
            onClick={addItem}
            className="glass-button px-3 py-1.5 rounded-lg text-xs text-cyan-300 flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Agregar Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 py-2 px-3">Código</th>
                <th className="text-left text-white/60 py-2 px-3">Descripción</th>
                <th className="text-left text-white/60 py-2 px-3">Unidad</th>
                <th className="text-left text-white/60 py-2 px-3">Cantidad</th>
                <th className="text-left text-white/60 py-2 px-3">Costo Unit.</th>
                <th className="text-left text-white/60 py-2 px-3">Total</th>
                <th className="text-left text-white/60 py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.code}
                      onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                      className="w-full bg-transparent border-none text-white/80 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full bg-transparent border-none text-white/80 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full bg-transparent border-none text-white/80 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-20 bg-white/10 border border-white/20 text-white/80 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => updateItem(item.id, 'unitCost', Number(e.target.value))}
                      className="w-24 bg-white/10 border border-white/20 text-white/80 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-white font-medium">
                    {formatCurrency(item.totalCost)}
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Costo Directo</span>
            <span className="text-white font-medium">{formatCurrency(summary.directCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Indirectos ({indirectPercentage}%)</span>
            <span className="text-white font-medium">{formatCurrency(summary.indirectCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Contingencia ({contingencyPercentage}%)</span>
            <span className="text-white font-medium">{formatCurrency(summary.contingency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Utilidad ({profitPercentage}%)</span>
            <span className="text-white font-medium">{formatCurrency(summary.profit)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Indirectos %</label>
            <input
              type="number"
              value={indirectPercentage}
              onChange={(e) => setIndirectPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Contingencia %</label>
            <input
              type="number"
              value={contingencyPercentage}
              onChange={(e) => setContingencyPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Utilidad %</label>
            <input
              type="number"
              value={profitPercentage}
              onChange={(e) => setProfitPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-white">Total del Presupuesto</span>
          <span className="text-2xl font-bold text-cyan-400">{formatCurrency(summary.total)}</span>
        </div>
      </div>
    </div>
  );
}
