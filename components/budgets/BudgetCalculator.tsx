'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calculator, Plus, Trash2, Save, Download, FolderOpen } from 'lucide-react';
import { calculateSlab, SlabDimensions, calculateSlabCost, SlabCostParams } from '@/lib/calculators/slabCalculators';
import { offlineDB, LocalProject } from '@/lib/db/offlineStore';
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
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [durationDays, setDurationDays] = useState(180);

  // Load projects in planning status
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await offlineDB.projects.toArray();
      const planningProjects = allProjects.filter(p => p.status === 'planning');
      setProjects(planningProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectName(project.name);
      setClientName(project.client_name);
    }
  };

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
    if (!selectedProject) {
      showToast('error', 'Seleccione un proyecto para calcular el presupuesto');
      return;
    }

    setSaveLoading(true);
    try {
      const summary = calculateSummary();

      // Save budget to database
      const budgetId = await offlineDB.budgets.add({
        project_id: selectedProject,
        version: 1,
        direct_cost: summary.directCost,
        indirect_percentage: indirectPercentage,
        contingency_percentage: contingencyPercentage,
        profit_percentage: profitPercentage,
        total_amount: summary.total,
        duration_days: durationDays,
        sync_status: 'created_offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Save budget items
      for (const item of items) {
        await offlineDB.budgetItems.add({
          budget_id: budgetId as string,
          code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.totalCost,
          item_order: 0,
          is_custom: true,
          sync_status: 'created_offline',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Add material to warehouse if it doesn't exist
        const existingStock = await offlineDB.warehouseStock
          .where('item_code')
          .equals(item.code)
          .and(stock => stock.project_id === selectedProject)
          .first();

        if (!existingStock) {
          await offlineDB.warehouseStock.add({
            project_id: selectedProject,
            item_code: item.code,
            description: item.description,
            unit: item.unit,
            current_stock: 0,
            minimum_threshold: Math.max(1, Math.floor(item.quantity * 0.1)),
            unit_cost: item.unitCost,
            sync_status: 'created_offline',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      // Update project with budget data
      await offlineDB.projects.update(selectedProject, {
        budget_total: summary.total,
        calculated_duration: durationDays,
        sync_status: 'updated_offline',
        updated_at: new Date().toISOString(),
      });

      showToast('success', 'Presupuesto guardado, proyecto actualizado y materiales agregados al almacén');
    } catch (error) {
      console.error('Error saving budget:', error);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Calculadora de Presupuestos
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Seleccione un proyecto en planificación para calcular su presupuesto
            </p>
          </div>
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

        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          <select
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Seleccione un proyecto en planificación...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </div>

        {projects.length === 0 && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">
              No hay proyectos en planificación. Cree un proyecto en el módulo de Proyectos y seleccione el estado "Planificación".
            </p>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
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
        <div>
          <label className="block text-white/60 text-xs sm:text-sm mb-1">Duración Estimada (días)</label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            placeholder="Duración en días"
          />
          <p className="text-white/40 text-xs mt-1">Este valor se usará para calcular la fecha fin del proyecto</p>
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