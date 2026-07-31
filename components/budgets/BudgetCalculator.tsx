'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calculator, Plus, Trash2, Save, Download, FolderOpen, Building2, TrendingUp, Map } from 'lucide-react';
import { calculateSlab, SlabDimensions, calculateSlabCost, SlabCostParams } from '@/lib/calculators/slabCalculators';
import { 
  calculateAPU, 
  calculateBudgetSummary, 
  formatQuetzales, 
  getResidentialCostLevel,
  getCostLevelLabel,
  getVolumetricFactor,
  calculateEarthworkVolume
} from '@/lib/calculators/apuCalculator';
import { RENGLONES_BY_TYPOLOGY } from '@/lib/data/apuRenglones';
import { RENGLONES_BY_TYPOLOGY_DETAILED } from '@/lib/data/apuRenglonesDetailed';
import { ProjectTypology, APUFormulaParams, APUResult, TYPOLOGY_LABELS, MATERIAL_FACTORS } from '@/lib/types/apu';
import type { APURenglon } from '@/lib/types/apu';
import { offlineDB, LocalProject } from '@/lib/db/offlineStore';
import { budgetState, ActiveBudgetState } from '@/lib/state/budgetState';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import PDFGenerator from '@/components/pdf/PDFGenerator';
import CSVGenerator from '@/components/csv/CSVGenerator';
import RenglonAccordion from '@/components/budgets/RenglonAccordion';
import { RenglonCalculator, ProjectRenglon, ProjectTimeImpact } from '@/lib/calculators/renglonCalculator';

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
  apuResult?: APUResult; // Store APU calculation results
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
  const [showPDFModal, setShowPDFModal] = useState(false);
  
  // Topography Integration State
  const [topographyData, setTopographyData] = useState({
    volumeCut: 0,           // Volúmenes de corte (m³)
    volumeFill: 0,          // Volúmenes de relleno (m³)
    terrainArea: 0,         // Área de terreno (m²)
    soilType: 'arena' as keyof typeof MATERIAL_FACTORS,
  });
  
  // APU Integration State
  const [selectedTypology, setSelectedTypology] = useState<ProjectTypology>('residential');
  const [showAPUCalculator, setShowAPUCalculator] = useState(false);
  const [apuParams, setApuParams] = useState<APUFormulaParams>({
    theoreticalQuantity: 100,
    wastePercentage: 5,
    volumetricFactor: 1.05,
    crewDailySalary: 350,
    dailyPerformance: 25,
    indirectPercentage: 15,
    materialUnitCost: 45,
    machineryCost: 0,
  });

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

  // APU Calculation Function
  const addAPUCalculation = () => {
    const apuResult = calculateAPU(apuParams);
    
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      code: `APU-${selectedTypology.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      description: `APU ${TYPOLOGY_LABELS[selectedTypology]} - Renglón Personalizado`,
      unit: 'unid',
      quantity: apuParams.theoreticalQuantity,
      unitCost: apuResult.totalCost / apuParams.theoreticalQuantity,
      totalCost: apuResult.totalCost,
      category: 'APU',
      apuResult,
    };

    setItems([...items, newItem]);
    setShowAPUCalculator(false);
    showToast('success', 'Cálculo APU agregado al presupuesto');
  };

  // Add renglon from typology catalog
  const addRenglonFromCatalog = (renglon: APURenglon) => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      code: renglon.code,
      description: renglon.description,
      unit: renglon.unit,
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      category: renglon.category,
    };

    setItems([...items, newItem]);
    showToast('success', `Renglón "${renglon.description}" agregado al presupuesto`);
  };

  const [renglonConfirm, setRenglonConfirm] = useState<APURenglon | null>(null);

  const confirmAddRenglon = () => {
    if (renglonConfirm) {
      addRenglonFromCatalog(renglonConfirm);
      setRenglonConfirm(null);
    }
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
        const budgetItemData: any = {
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
        };

        // Add APU data if available
        if (item.apuResult) {
          budgetItemData.apu_result = item.apuResult;
          budgetItemData.apu_params = apuParams;
        }

        await offlineDB.budgetItems.add(budgetItemData);

        // Add detailed material breakdown to warehouse
        const catalogRenglon = RENGLONES_BY_TYPOLOGY_DETAILED[selectedTypology]?.find(
          r => r.code === item.code
        );

        if (catalogRenglon && catalogRenglon.materialFormula) {
          // Calculate material breakdown using RenglonCalculator
          const materialBreakdown = RenglonCalculator.calculateMaterialBreakdown({
            quantity: item.quantity,
            renglon: catalogRenglon,
            customMaterialCost: item.unitCost
          });

          // Add each material to warehouse stock
          for (const material of materialBreakdown) {
            const existingStock = await offlineDB.warehouseStock
              .where('item_code')
              .equals(material.code)
              .and(stock => stock.project_id === selectedProject)
              .first();

            if (existingStock) {
              // Update existing stock with new material quantity
              await offlineDB.warehouseStock.update(existingStock.id!, {
                current_stock: existingStock.current_stock + material.quantity,
                unit_cost: material.unitCost,
                sync_status: 'updated_offline',
                updated_at: new Date().toISOString(),
              });
            } else {
              // Create new stock item
              await offlineDB.warehouseStock.add({
                project_id: selectedProject,
                item_code: material.code,
                description: material.description,
                unit: material.unit,
                current_stock: material.quantity,
                minimum_threshold: Math.max(1, Math.floor(material.quantity * 0.1)),
                unit_cost: material.unitCost,
                sync_status: 'created_offline',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        } else {
          // Fallback for items without detailed breakdown
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
              current_stock: item.quantity,
              minimum_threshold: Math.max(1, Math.floor(item.quantity * 0.1)),
              unit_cost: item.unitCost,
              sync_status: 'created_offline',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      // Update project with budget data
      await offlineDB.projects.update(selectedProject, {
        budget_total: summary.total,
        calculated_duration: durationDays,
        sync_status: 'updated_offline',
        updated_at: new Date().toISOString(),
      });

      // Calculate and store time data for Gantt and progress tracking
      const projectRenglones: ProjectRenglon[] = items.map(item => {
        const catalogRenglon = RENGLONES_BY_TYPOLOGY_DETAILED[selectedTypology]?.find(
          r => r.code === item.code
        );
        return {
          id: item.id,
          quantity: item.quantity,
          renglon: catalogRenglon || {
            id: item.id,
            number: 0,
            code: item.code,
            description: item.description,
            unit: item.unit,
            formula: '',
            category: 'Custom',
            typology: selectedTypology
          },
          customCrewSize: apuParams.crewSize
        };
      });

      const timeImpact = RenglonCalculator.calculateProjectTimeImpact(projectRenglones);

      // Store time impact data in budget state for other modules
      const activeBudget: ActiveBudgetState = {
        projectId: selectedProject,
        budgetId: budgetId as string,
        typology: selectedTypology,
        costDirectTotal: summary.directCost,
        costTotalWithIndirects: summary.total,
        timeImpact: timeImpact,
        renglonTimeData: timeImpact.renglonDays,
        breakdown: {
          materials: items.reduce((sum, item) => 
            sum + (item.apuResult?.breakdown.materials || item.totalCost * 0.6), 0),
          labor: items.reduce((sum, item) => 
            sum + (item.apuResult?.breakdown.labor || item.totalCost * 0.3), 0),
          machinery: items.reduce((sum, item) => 
            sum + (item.apuResult?.breakdown.machinery || item.totalCost * 0.1), 0),
        },
        topographyData: topographyData,
        calculatedAt: new Date().toISOString(),
      };
      budgetState.set(activeBudget);

      showToast('success', 'Presupuesto guardado, proyecto actualizado y materiales agregados al almacén');
    } catch (error) {
      console.error('Error saving budget:', error);
      showToast('error', 'Error al guardar el presupuesto');
    } finally {
      setSaveLoading(false);
    }
  };

  const generatePDF = () => {
    if (items.length === 0) {
      showToast('error', 'No hay items en el presupuesto para exportar');
      return;
    }
    setShowPDFModal(true);
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
            <Tooltip content="Guardar presupuesto y actualizar proyecto">
              <button
                onClick={saveBudget}
                disabled={saveLoading}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </Tooltip>
            <Tooltip content="Exportar presupuesto a PDF con membrete corporativo">
              <button
                onClick={generatePDF}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </button>
            </Tooltip>
            <Tooltip content="Exportar presupuesto a CSV con resumen y desglose de materiales">
              <CSVGenerator
                projectName={projectName}
                clientName={clientName}
                items={items.map(item => ({
                  code: item.code,
                  description: item.description,
                  unit: item.unit,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  totalCost: item.totalCost,
                  timeRequired: item.apuResult ? 
                    (item.quantity / (apuParams.dailyPerformance * (apuParams.crewSize || 1))) : undefined,
                  materialBreakdown: item.apuResult ? [{
                    code: item.code,
                    description: item.description,
                    unit: item.unit,
                    quantity: item.quantity * (1 + apuParams.wastePercentage / 100),
                    unitCost: item.unitCost,
                    totalCost: item.totalCost
                  }] : undefined,
                }))}
                summary={summary}
                indirectPercentage={indirectPercentage}
                contingencyPercentage={contingencyPercentage}
                profitPercentage={profitPercentage}
                totalProjectTime={durationDays}
              />
            </Tooltip>
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

      {/* APU & Typology Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Análisis de Precios Unitarios (APU)
          </h2>
          <div className="flex gap-2">
            <select
              value={selectedTypology}
              onChange={(e) => setSelectedTypology(e.target.value as ProjectTypology)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              {Object.entries(TYPOLOGY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Tooltip content="Abrir calculadora de Análisis de Precios Unitarios">
              <button
                onClick={() => setShowAPUCalculator(!showAPUCalculator)}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculadora APU
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Topography Integration Panel */}
        <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-cyan-400 font-medium flex items-center gap-2">
              <Map className="w-4 h-4" />
              Datos de Topografía / CivilCAD
            </h4>
            <Tooltip content="Aplicar factores volumétricos a la calculadora APU">
              <button
                onClick={() => {
                  // Auto-calculate volumetric factors based on topography data
                  const cutFactor = getVolumetricFactor(topographyData.soilType, 'corte');
                  const fillFactor = getVolumetricFactor(topographyData.soilType, 'relleno');
                  setApuParams({ 
                    ...apuParams, 
                    volumetricFactor: cutFactor,
                    theoreticalQuantity: topographyData.terrainArea > 0 ? topographyData.terrainArea : apuParams.theoreticalQuantity,
                  });
                  showToast('success', `Factores aplicados: Corte ${cutFactor.toFixed(2)}x, Relleno ${fillFactor.toFixed(2)}x`);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-xs"
              >
                Aplicar a APU
              </button>
            </Tooltip>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Tooltip content="Volumen de corte del terreno en metros cúbicos">
                <label className="block text-white/60 text-xs mb-1">Volumen Corte (m³)</label>
                <input
                  type="number"
                  value={topographyData.volumeCut}
                  onChange={(e) => setTopographyData({ ...topographyData, volumeCut: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                />
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Volumen de relleno necesario en metros cúbicos">
                <label className="block text-white/60 text-xs mb-1">Volumen Relleno (m³)</label>
                <input
                  type="number"
                  value={topographyData.volumeFill}
                  onChange={(e) => setTopographyData({ ...topographyData, volumeFill: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                />
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Área total del terreno en metros cuadrados">
                <label className="block text-white/60 text-xs mb-1">Área Terreno (m²)</label>
                <input
                  type="number"
                  value={topographyData.terrainArea}
                  onChange={(e) => setTopographyData({ ...topographyData, terrainArea: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                />
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Tipo de suelo para calcular factores volumétricos">
                <label className="block text-white/60 text-xs mb-1">Tipo de Suelo</label>
                <select
                  value={topographyData.soilType}
                  onChange={(e) => setTopographyData({ ...topographyData, soilType: e.target.value as keyof typeof MATERIAL_FACTORS })}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                >
                  {Object.entries(MATERIAL_FACTORS).map(([key, factor]) => (
                    <option key={key} value={key}>
                      {factor.soilType}
                    </option>
                  ))}
                </select>
              </Tooltip>
            </div>
          </div>
          
          {/* Calculated factors display */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Factor Abundamiento:</span>
              <span className="text-cyan-400">
                {MATERIAL_FACTORS[topographyData.soilType]?.abundanceFactor.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Factor Contracción:</span>
              <span className="text-cyan-400">
                {MATERIAL_FACTORS[topographyData.soilType]?.contractionFactor.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>

        {/* APU Calculator */}
        {showAPUCalculator && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-white font-medium mb-4">🧮 Calculadora de Análisis de Precio Unitario</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">Cantidad Teórica</label>
                <input
                  type="number"
                  value={apuParams.theoreticalQuantity}
                  onChange={(e) => setApuParams({ ...apuParams, theoreticalQuantity: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">% Desperdicio</label>
                <input
                  type="number"
                  value={apuParams.wastePercentage}
                  onChange={(e) => setApuParams({ ...apuParams, wastePercentage: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">Factor Volumétrico</label>
                <input
                  type="number"
                  step="0.01"
                  value={apuParams.volumetricFactor}
                  onChange={(e) => setApuParams({ ...apuParams, volumetricFactor: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">Salario Cuadrilla (Q)</label>
                <input
                  type="number"
                  value={apuParams.crewDailySalary}
                  onChange={(e) => setApuParams({ ...apuParams, crewDailySalary: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">Rendimiento Diario</label>
                <input
                  type="number"
                  value={apuParams.dailyPerformance}
                  onChange={(e) => setApuParams({ ...apuParams, dailyPerformance: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">% Indirectos</label>
                <input
                  type="number"
                  value={apuParams.indirectPercentage}
                  onChange={(e) => setApuParams({ ...apuParams, indirectPercentage: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">Costo Material (Q)</label>
                <input
                  type="number"
                  value={apuParams.materialUnitCost}
                  onChange={(e) => setApuParams({ ...apuParams, materialUnitCost: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1">Costo Maquinaria (Q)</label>
                <input
                  type="number"
                  value={apuParams.machineryCost}
                  onChange={(e) => setApuParams({ ...apuParams, machineryCost: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            {/* APU Results Preview */}
            {(() => {
              const result = calculateAPU(apuParams);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white/40 text-xs">Material Total</p>
                    <p className="text-white font-medium">{result.totalMaterialQuantity.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Costo Directo</p>
                    <p className="text-white font-medium">{formatQuetzales(result.directCost)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Costo Indirecto</p>
                    <p className="text-white font-medium">{formatQuetzales(result.indirectCost)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Costo Total</p>
                    <p className="text-cyan-400 font-medium">{formatQuetzales(result.totalCost)}</p>
                  </div>
                </div>
              );
            })()}

            <Tooltip content="Agregar cálculo APU al presupuesto">
              <button
                onClick={addAPUCalculation}
                className="w-full glass-button px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Cálculo APU al Presupuesto
              </button>
            </Tooltip>
          </div>
        )}

        {/* Renglones Catalog */}
        {!showAPUCalculator && (
          <div className="mt-4">
            <h3 className="text-white font-medium mb-3">📋 Catálogo de Renglones - {TYPOLOGY_LABELS[selectedTypology]}</h3>
            <div className="data-table-container rounded-xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/10">
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 py-2 px-3">#</th>
                    <th className="text-left text-white/60 py-2 px-3">Código</th>
                    <th className="text-left text-white/60 py-2 px-3">Descripción</th>
                    <th className="text-left text-white/60 py-2 px-3">Unidad</th>
                    <th className="text-left text-white/60 py-2 px-3">Categoría</th>
                    <th className="text-right text-white/60 py-2 px-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const catalog = RENGLONES_BY_TYPOLOGY[selectedTypology];
                    return catalog.map((renglon) => (
                      <tr key={renglon.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-2 px-3 text-white/60">{renglon.number}</td>
                        <td className="py-2 px-3 text-white">{renglon.code}</td>
                        <td className="py-2 px-3 text-white">{renglon.description}</td>
                        <td className="py-2 px-3 text-white">{renglon.unit}</td>
                        <td className="py-2 px-3 text-white/60">{renglon.category}</td>
                        <td className="py-2 px-3 text-right">
                          <Tooltip content={`Agregar ${renglon.description} al presupuesto`}>
                            <button
                              onClick={() => setRenglonConfirm(renglon)}
                              className="text-cyan-400 hover:text-cyan-300 text-xs"
                            >
                              + Agregar
                            </button>
                          </Tooltip>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

        <Tooltip content="Calcular y agregar losa de concreto al presupuesto">
          <button
            onClick={addSlabCalculation}
            className="glass-button w-full px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Agregar Cálculo de Losa
          </button>
        </Tooltip>
      </div>

      {/* Budget Items Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Items del Presupuesto</h2>
          <Tooltip content="Agregar nuevo item al presupuesto">
            <button
              onClick={addItem}
              className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Item
            </button>
          </Tooltip>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Calculator className="w-8 h-8 text-white/30" />}
            title="No hay items en el presupuesto"
            description="Agregue cálculos de losa o items manuales para comenzar a armar el presupuesto."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              // Find matching renglon from catalog for detailed calculation
              const catalogRenglon = RENGLONES_BY_TYPOLOGY_DETAILED[selectedTypology]?.find(
                r => r.code === item.code
              );

              if (catalogRenglon) {
                return (
                  <RenglonAccordion
                    key={item.id}
                    renglon={catalogRenglon}
                    quantity={item.quantity}
                    onQuantityChange={(value) => updateItem(item.id, 'quantity', value)}
                    onCrewSizeChange={(value) => {
                      // Update renglon-specific crew size (stored in apu_params)
                      const updatedApuParams = {
                        ...apuParams,
                        crewSize: value
                      };
                      setApuParams(updatedApuParams);
                    }}
                    onMaterialCostChange={(value) => {
                      updateItem(item.id, 'unitCost', value);
                    }}
                    onPerformanceChange={(value) => {
                      const updatedApuParams = {
                        ...apuParams,
                        dailyPerformance: value
                      };
                      setApuParams(updatedApuParams);
                    }}
                    onEfficiencyChange={(value) => {
                      const updatedApuParams = {
                        ...apuParams,
                        efficiency: value
                      };
                      setApuParams(updatedApuParams);
                    }}
                    defaultExpanded={false}
                  />
                );
              }

              // Fallback to simple table row for items without catalog renglon
              return (
                <div key={item.id} className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-6 gap-4">
                      <div className="text-cyan-400 font-mono text-sm">{item.code}</div>
                      <div className="text-white col-span-2">{item.description}</div>
                      <div className="text-white/60">{item.unit}</div>
                      <div>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                          className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="text-white font-medium mr-4">
                      {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(item.totalCost)}
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Renglon Add Confirmation Dialog */}
      <ConfirmDialog
        isOpen={renglonConfirm !== null}
        title="Agregar Renglón"
        message={`¿Desea agregar el renglón "${renglonConfirm?.description}" al presupuesto?`}
        onConfirm={confirmAddRenglon}
        onCancel={() => setRenglonConfirm(null)}
        variant="info"
      />

      {/* PDF Export Modal */}
      {showPDFModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Exportar Presupuesto a PDF</h2>
              <button
                onClick={() => setShowPDFModal(false)}
                className="text-white/60 hover:text-white"
              >
                <Download className="w-6 h-6" />
              </button>
            </div>
            
            <PDFGenerator
              projectName={projectName}
              clientName={clientName}
              items={items.map(item => ({
                code: item.code,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.totalCost,
                timeRequired: item.apuResult ? 
                  (item.quantity / (apuParams.dailyPerformance * (apuParams.crewSize || 1))) : undefined,
                materialBreakdown: item.apuResult ? [{
                  code: item.code,
                  description: item.description,
                  unit: item.unit,
                  quantity: item.quantity * (1 + apuParams.wastePercentage / 100),
                  unitCost: item.unitCost,
                  totalCost: item.totalCost
                }] : undefined,
              }))}
              summary={summary}
              indirectPercentage={indirectPercentage}
              contingencyPercentage={contingencyPercentage}
              profitPercentage={profitPercentage}
              totalProjectTime={durationDays}
            />
          </div>
        </div>
      )}
    </div>
  );
}