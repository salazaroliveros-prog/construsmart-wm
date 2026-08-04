'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Calculator, Plus, Save, Download, FolderOpen, Building2, Map as MapIcon, AlertTriangle, Wallet, TrendingUp, CreditCard } from 'lucide-react';
import { useMaterialAlertContext } from '@/context/MaterialAlertContext';
import { calculateSlab, SlabDimensions, calculateSlabCost, SlabCostParams } from '@/lib/calculators/slabCalculators';
import {
  calculateAPU,
  formatQuetzales,
  getVolumetricFactor,
  calculateLocalBudgetSummary,
  type LocalBudgetSummary,
} from '@/lib/calculators/apuCalculator';
import { RENGLONES_BY_TYPOLOGY } from '@/lib/data/apuRenglones';
import { RENGLONES_BY_TYPOLOGY_DETAILED } from '@/lib/data/apuRenglonesDetailed';
import { APU_LIBRARY_BY_TYPOLOGY } from '@/lib/data/apuLibrary';
import { ProjectTypology, APUFormulaParams, APUResult, TYPOLOGY_LABELS, MATERIAL_FACTORS } from '@/lib/types/apu';
import type { APURenglon } from '@/lib/types/apu';
import { offlineDB, LocalProject, LocalBudgetItem, LocalClient } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { resolveSyncStatus, normalizeSyncStatus } from '@/lib/utils/syncState';
import { sendBudgetMaterialsToWarehouse, MaterialToWarehouseInput } from '@/lib/integrations/budgetToWarehouse';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useIncrementalList } from '@/lib/hooks/useIncrementalList';
import { budgetState, ActiveBudgetState } from '@/lib/state/budgetState';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import CSVGenerator from '@/components/csv/CSVGenerator';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { RenglonCalculator, ProjectRenglon } from '@/lib/calculators/renglonCalculator';
import BudgetItemsTable from '@/components/budgets/BudgetItemsTable';
import BudgetSummaryPanel from '@/components/budgets/BudgetSummaryPanel';
import type { BudgetItem } from './types';
import { PRESETS_POR_TIPOLOGIA, ElementPreset, TYPOLOGY_LABELS as PRESET_LABELS } from '@/lib/config/elementPresets';
import { calculateCommercialUnits, validateCostPerSquareMeter, CostValidationResult } from '@/lib/calculators/financialUtils';
import { useBusinessSettings } from '@/lib/hooks/useBusinessSettings';
import { checkBudgetMarginWarning, formatGTQ, GUATEMALA_CONFIG, validateBudgetAgainstStandards } from '@/lib/config/app.config';

// Dynamic imports for heavy components
const PDFGenerator = dynamic(() => import('@/components/pdf/PDFGenerator'), {
  ssr: false,
  loading: () => <div className="text-white/60 text-sm">Cargando visor PDF...</div>
});

export default function BudgetCalculator() {
  const { showToast } = useToast();
  const { settings, financial } = useBusinessSettings();
  const { triggerStockCheck } = useMaterialAlertContext();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [indirectPercentage, setIndirectPercentage] = useState(financial.indirectPercentage);
  const [contingencyPercentage, setContingencyPercentage] = useState(financial.contingencyPercentage);
  const [profitPercentage, setProfitPercentage] = useState(financial.profitPercentage);
  const [projectName, setProjectName] = useState('Proyecto Sample');
  const [clientName, setClientName] = useState('Cliente Sample');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; desc: string } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [durationDays, setDurationDays] = useState(180);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [qualityLevel, setQualityLevel] = useState<'basic' | 'moderate' | 'premium'>('moderate');
  const [budgetValidation, setBudgetValidation] = useState<{ isValid: boolean; recommendation: string; severity: 'info' | 'warning' | 'critical' } | null>(null);

  // Sync financial percentages with settings
  useEffect(() => {
    setIndirectPercentage(financial.indirectPercentage);
    setContingencyPercentage(financial.contingencyPercentage);
    setProfitPercentage(financial.profitPercentage);
  }, [financial]);

  // Load projects and clients
  const loadProjects = async () => {
    try {
      const allProjects = await offlineDB.projects.toArray();
      const planningProjects = allProjects.filter(p => p.status === 'planning');
      setProjects(planningProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('error', 'Error al cargar proyectos');
    }
  };

  const loadClients = async () => {
    try {
      const allClients = await offlineDB.clients.toArray();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);
  
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

  // Estado de parámetros por renglón (Map) para no pisar apuParams global
  const [renglonParams, setRenglonParams] = useState<Map<string, Partial<APUFormulaParams>>>(new Map());

  const updateRenglonParam = (itemId: string, patch: Partial<APUFormulaParams>) => {
    setRenglonParams(prev => {
      const next = new Map(prev);
      const current = next.get(itemId) || {};
      next.set(itemId, { ...current, ...patch });
      return next;
    });
  };

  const getRenglonParam = (itemId: string): Partial<APUFormulaParams> => {
    return renglonParams.get(itemId) || {};
  };

  // Renderizado incremental: evita saturar el DOM con miles de items.
  const {
    visibleItems: visibleItems,
    hasMore: hasMoreItems,
    remaining: remainingItems,
    showMore: showMoreItems,
    reset: resetItems,
  } = useIncrementalList({
    items,
    increment: 20,
    resetOnItemsChange: true,
  });

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectName(project.name);
      setClientName(project.client_name);
    }

    // Carga el presupuesto existente desde offlineDB y restaura items en memoria.
    try {
      const existingBudget = await offlineDB.budgets
        .where('project_id')
        .equals(projectId)
        .reverse()
        .first();

      if (existingBudget) {
        const dbItems: LocalBudgetItem[] = await offlineDB.budgetItems
          .where('budget_id')
          .equals(existingBudget.id as string)
          .toArray();

        const restored: BudgetItem[] = dbItems
          .sort((a, b) => (a.item_order ?? 0) - (b.item_order ?? 0))
          .map((dbItem): BudgetItem => ({
            id: dbItem.id ?? Date.now().toString(),
            code: dbItem.code,
            description: dbItem.description,
            unit: dbItem.unit,
            quantity: dbItem.quantity,
            unit_cost: dbItem.unit_cost,
            total_cost: dbItem.total_cost,
            category: dbItem.is_custom ? 'Custom' : 'APU', // UI-only field, not persisted in DB
            apuResult: dbItem.apu_result as APUResult | undefined,
          }));

        setItems(restored);
        setIndirectPercentage(existingBudget.indirect_percentage);
        setContingencyPercentage(existingBudget.contingency_percentage);
        setProfitPercentage(existingBudget.profit_percentage);
        setDurationDays(existingBudget.duration_days);
        resetItems();
      } else {
        // Sin presupuesto previo: limpia el estado
        setItems([]);
        resetItems();
      }
    } catch (error) {
      console.error('Error cargando presupuesto existente:', error);
      showToast('error', 'Error al cargar el presupuesto del proyecto');
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

  const calculateSummary = (): LocalBudgetSummary => {
    return calculateLocalBudgetSummary(items, indirectPercentage, contingencyPercentage, profitPercentage);
  };

  // Validate budget against standards when summary changes
  useEffect(() => {
    const summary = calculateSummary();
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project && project.area_m2 > 0) {
        const validation = validateBudgetAgainstStandards(
          project.area_m2,
          summary.total,
          selectedTypology,
          qualityLevel
        );
        setBudgetValidation({
          isValid: validation.isValid,
          recommendation: validation.recommendation,
          severity: validation.severity
        });
      }
    }
  }, [items, indirectPercentage, contingencyPercentage, profitPercentage, selectedProject, selectedTypology, qualityLevel, projects]);

  const addSlabCalculation = () => {
    // Use preset if selected in preset mode
    let dimensions = { ...slabDimensions };

    if (usePresetMode && selectedElementPreset) {
      const preset = PRESETS_POR_TIPOLOGIA[selectedTypologyPreset]?.find(p => p.id === selectedElementPreset);
      if (preset) {
        dimensions = {
          ...dimensions,
          thickness: preset.espesor,
        };
      }
    }

    const result = calculateSlab(dimensions);
    const cost = calculateSlabCost(result, slabCostParams);

    const newItem: BudgetItem = {
      id: Date.now().toString(),
      code: `LOS-${dimensions.slabType.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      description: result.description,
      unit: 'm²',
      quantity: dimensions.length * dimensions.width,
      unit_cost: cost / (dimensions.length * dimensions.width),
      total_cost: cost,
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
      unit_cost: apuResult.total_cost / apuParams.theoreticalQuantity,
      total_cost: apuResult.total_cost,
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
      unit_cost: 0,
      total_cost: 0,
      category: renglon.category,
    };

    setItems([...items, newItem]);
    showToast('success', `Renglón "${renglon.description}" agregado al presupuesto`);
  };

  const [renglonConfirm, setRenglonConfirm] = useState<APURenglon | null>(null);

  // Preset and Typology State for Smart Input
  const [selectedTypologyPreset, setSelectedTypologyPreset] = useState<string>('Residencial');
  const [selectedElementPreset, setSelectedElementPreset] = useState<string>('');
  const [usePresetMode, setUsePresetMode] = useState<boolean>(true);

  // Cost Validation State
  const [costValidation, setCostValidation] = useState<CostValidationResult | null>(null);

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
      unit_cost: 0,
      total_cost: 0,
      category: 'General',
    };

    setItems([...items, newItem]);
    showToast('success', 'Item agregado al presupuesto');
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_cost') {
          updated.total_cost = Number(updated.quantity) * Number(updated.unit_cost);
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

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await queueDelete('budget_items', { id: deleteConfirm.id });
        setItems(items.filter(item => item.id !== deleteConfirm.id));
        setDeleteConfirm(null);
        showToast('success', 'Item eliminado del presupuesto');
      } catch (error) {
        console.error('Error deleting item:', error);
        showToast('error', 'Error al eliminar el item del presupuesto');
      }
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

      // Get project for validation and update
      const project = projects.find(p => p.id === selectedProject);

      // Validate cost per square meter against project category
      if (project && project.area_m2 > 0) {
        const costPerM2 = summary.total / project.area_m2;
        const validation = validateCostPerSquareMeter(
          costPerM2,
          project.quality_level === 'basic' ? 'Básico' :
          project.quality_level === 'moderate' ? 'Moderado' : 'Premium',
          15 // 15% tolerance
        );
        setCostValidation(validation);

        if (!validation.isValid) {
          showToast('warning', validation.warningMessage || 'Alerta de coherencia comercial');
          // Don't block save, just warn
        }
      }

      // Look up an existing budget for this project so saves are idempotent
      const existingBudget = await offlineDB.budgets
        .where('project_id')
        .equals(selectedProject)
        .reverse()
        .first();

      const isFirstSave = !existingBudget;
      let budgetId: string;

      if (existingBudget) {
        budgetId = existingBudget.id as string;
        await offlineDB.budgets.update(budgetId, {
          direct_cost: summary.directCost,
          indirect_percentage: indirectPercentage,
          contingency_percentage: contingencyPercentage,
          profit_percentage: profitPercentage,
          total_amount: summary.total,
          duration_days: durationDays,
          sync_status: resolveSyncStatus({
            isNewRecord: false,
            previousStatus: existingBudget.sync_status,
            isOnline: navigator.onLine,
          }),
          updated_at: new Date().toISOString(),
        });

        // Replace existing budget items (queue server deletions for synced items)
        const oldItems = await offlineDB.budgetItems.where('budget_id').equals(budgetId).toArray();
        for (const oldItem of oldItems) {
          await queueDelete('budget_items', oldItem);
          await offlineDB.budgetItems.delete(oldItem.id!);
        }
      } else {
        budgetId = (await offlineDB.budgets.add({
          project_id: selectedProject,
          version: 1,
          direct_cost: summary.directCost,
          indirect_percentage: indirectPercentage,
          contingency_percentage: contingencyPercentage,
          profit_percentage: profitPercentage,
          total_amount: summary.total,
          duration_days: durationDays,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: navigator.onLine }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as string;
      }

      // Save budget items
      const warehouseInputs: MaterialToWarehouseInput[] = [];
      for (const item of items) {
        // Calculate commercial units for materials
        let unidadesComerciales: number | undefined;
        if (item.unit === 'kg' || item.unit === 'kilogramos') {
          // Assume cement or steel based on description
          if (item.description.toLowerCase().includes('cemento')) {
            unidadesComerciales = calculateCommercialUnits('cement', item.quantity, item.unit);
          } else if (item.description.toLowerCase().includes('acero') ||
                     item.description.toLowerCase().includes('varilla') ||
                     item.description.toLowerCase().includes('hierro')) {
            unidadesComerciales = calculateCommercialUnits('steel', item.quantity, item.unit);
          }
        }

        const budgetItemData: LocalBudgetItem = {
          budget_id: budgetId as string,
          code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
          item_order: 0,
          is_custom: true,
          unidades_comerciales_estimadas: unidadesComerciales,
          sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: navigator.onLine }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add APU data if available
        if (item.apuResult) {
          budgetItemData.apu_result = item.apuResult;
          budgetItemData.apu_params = apuParams;
        }

        await offlineDB.budgetItems.add(budgetItemData);

        // Acumular materiales para el almacén (se envía al final, solo en el primer guardado)
        if (isFirstSave) {
          const catalogRenglon = RENGLONES_BY_TYPOLOGY_DETAILED[selectedTypology]?.find(
            r => r.code === item.code
          );

          if (catalogRenglon && catalogRenglon.materialFormula) {
            const materialBreakdown = RenglonCalculator.calculateMaterialBreakdown({
              quantity: item.quantity,
              renglon: catalogRenglon,
              customMaterialCost: item.unit_cost
            });
            for (const material of materialBreakdown) {
              warehouseInputs.push({
                projectId: selectedProject,
                itemCode: material.code,
                description: material.description,
                unit: material.unit,
                quantity: material.quantity,
                unit_cost: material.unit_cost,
              });
            }
          } else {
            warehouseInputs.push({
              projectId: selectedProject,
              itemCode: item.code,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
            });
          }
        }
      }

      // Enviar materiales al almacén (solo en el primer guardado para evitar duplicados)
      // TODO: Implementar upsert para actualizaciones incrementales
      if (warehouseInputs.length > 0 && isFirstSave) {
        await sendBudgetMaterialsToWarehouse(warehouseInputs);
        showToast('info', `${warehouseInputs.length} materiales sincronizados con el almacén`);
      }

      // Reuse the project variable from validation above
      if (project) {
        await offlineDB.projects.update(selectedProject, {
          budget_total: summary.total,
          calculated_duration: durationDays,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: project.sync_status ?? 'synced', isOnline: navigator.onLine }),
          updated_at: new Date().toISOString(),
        });
      }

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
            sum + (item.apuResult?.breakdown.materials || item.total_cost * 0.6), 0),
          labor: items.reduce((sum, item) => 
            sum + (item.apuResult?.breakdown.labor || item.total_cost * 0.3), 0),
          machinery: items.reduce((sum, item) => 
            sum + (item.apuResult?.breakdown.machinery || item.total_cost * 0.1), 0),
        },
        topographyData: topographyData,
        calculatedAt: new Date().toISOString(),
      };
      budgetState.set(activeBudget);

      // Trigger stock validation for warehouse integration
      if (selectedProject && items.length > 0) {
        try {
          const stockAlerts = await triggerStockCheck(selectedProject, items, projectName);
          if (stockAlerts.length > 0) {
            showToast('warning', `${stockAlerts.length} materiales con stock insuficiente para el proyecto`);
          }
        } catch (error) {
          console.error('[Budget→Warehouse Stock Check Error]', error);
        }
      }

      showToast('success', isFirstSave
        ? 'Presupuesto guardado, proyecto actualizado y materiales agregados al almacén'
        : 'Presupuesto actualizado y proyecto actualizado');
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

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['projects', 'budgets', 'budget_items'], loadProjects);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
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
                {saveLoading ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
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
                  unit_cost: item.unit_cost,
                  total_cost: item.total_cost,
                  timeRequired: item.apuResult ? 
                    (item.quantity / (apuParams.dailyPerformance * (apuParams.crewSize || 1))) : undefined,
                  materialBreakdown: item.apuResult ? [{
                    code: item.code,
                    description: item.description,
                    unit: item.unit,
                    quantity: item.quantity * (1 + apuParams.wastePercentage / 100),
                    unit_cost: item.unit_cost,
                    total_cost: item.total_cost
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

        {/* Client Selector with Balance Display */}
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">Seleccione un cliente...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.is_delinquent ? '⚠️' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Client Balance Display */}
        {selectedClient && (() => {
          const client = clients.find(c => c.id === selectedClient);
          if (!client) return null;

          return (
            <div className="glass-card p-3 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="text-white/70 text-sm">Saldo Cliente:</span>
                </div>
                <span className={`font-semibold ${client.account_balance && client.account_balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatGTQ(client.account_balance || 0)}
                </span>
              </div>
              {client.credit_limit && client.credit_limit > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span className="text-white/70 text-xs">Límite Crédito:</span>
                  </div>
                  <span className="font-medium text-cyan-400 text-sm">
                    {formatGTQ(client.credit_limit)}
                  </span>
                </div>
              )}
              {client.is_delinquent && (
                <div className="flex items-center gap-2 mt-2 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Cliente Moroso - Verificar pagos pendientes</span>
                </div>
              )}
            </div>
          );
        })()}

        {projects.length === 0 && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">
              No hay proyectos en planificación. Cree un proyecto en el módulo de Proyectos y seleccione el estado "Planificación".
            </p>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Nombre del Proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="Nombre del proyecto"
            />
          </div>
          <div>
            <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="Nombre del cliente"
            />
          </div>
        </div>
        <div>
          <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Duración Estimada (días)</label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
            placeholder="Duración en días"
          />
          <p className="text-white/40 text-xs mt-1">Este valor se usará para calcular la fecha fin del proyecto</p>
        </div>
      </div>

      {/* Budget Validation Warning Banner */}
      {budgetValidation && !budgetValidation.isValid && (
        <div className={`backdrop-blur-md border px-4 py-3 rounded-xl flex items-start gap-3 ${
          budgetValidation.severity === 'critical'
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        }`}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {budgetValidation.severity === 'critical' ? 'Advertencia Crítica' : 'Advertencia'} - Validación de Presupuesto
            </p>
            <p className="text-xs mt-1 opacity-80">
              {budgetValidation.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* APU & Typology Section */}
      <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Análisis de Precios Unitarios (APU)
          </h2>
          <div className="flex gap-2">
            <select
              value={selectedTypology}
              onChange={(e) => setSelectedTypology(e.target.value as ProjectTypology)}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              {Object.entries(TYPOLOGY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={qualityLevel}
              onChange={(e) => setQualityLevel(e.target.value as 'basic' | 'moderate' | 'premium')}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="basic">Básico (Q.3,000-3,500/m²)</option>
              <option value="moderate">Moderado (Q.3,500-4,000/m²)</option>
              <option value="premium">Premium (Q.4,000-5,000/m²)</option>
            </select>
            <Tooltip content="Cargar biblioteca APU estándar de 40 items para esta tipología">
              <button
                onClick={() => {
                  const library = APU_LIBRARY_BY_TYPOLOGY[selectedTypology];
                  library.forEach((renglon) => {
                    const apuResult = calculateAPU({
                      theoreticalQuantity: 100,
                      wastePercentage: renglon.materialFormula?.wastePercentage || 5,
                      volumetricFactor: 1.05,
                      crewDailySalary: renglon.laborFormula?.dailySalary || 350,
                      dailyPerformance: renglon.laborFormula?.dailyPerformance || 25,
                      indirectPercentage: 15,
                      materialUnitCost: renglon.materialFormula?.materialUnitCost || 45,
                      machineryCost: renglon.machineryFormula?.hourlyCost || 0,
                    });
                    const newItem: BudgetItem = {
                      id: Date.now().toString() + Math.random().toString(),
                      code: renglon.code,
                      description: renglon.description,
                      unit: renglon.unit,
                      quantity: 100,
                      unit_cost: apuResult.total_cost / 100,
                      total_cost: apuResult.total_cost,
                      category: renglon.category || 'general',
                      timeRequired: apuResult.total_cost / (renglon.laborFormula?.dailySalary || 350),
                      apuResult,
                    };
                    setItems(prev => [...prev, newItem]);
                  });
                  showToast('success', `Cargados ${library.length} renglones APU de la biblioteca estándar`);
                }}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Cargar Biblioteca
              </button>
            </Tooltip>
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
              <MapIcon className="w-4 h-4" />
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
                  onChange={(e) => {
                    const newSoilType = e.target.value as keyof typeof MATERIAL_FACTORS;
                    setTopographyData({ ...topographyData, soilType: newSoilType });
                    // Auto-update volumetric factor when soil type changes
                    const cutFactor = getVolumetricFactor(newSoilType, 'corte');
                    setApuParams({ ...apuParams, volumetricFactor: cutFactor });
                  }}
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
                    <p className="text-cyan-400 font-medium">{formatQuetzales(result.total_cost)}</p>
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
            <div className="data-table-container rounded-xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto overflow-anchor-none">
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
      <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Calculadora de Losas</h2>

        {/* Preset Mode Toggle */}
        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usePresetMode}
              onChange={(e) => setUsePresetMode(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-zinc-900 dark:text-white text-sm">Modo Presets Inteligentes</span>
          </label>
        </div>

        {/* Preset Selection */}
        {usePresetMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Tipología de Obra</label>
              <select
                value={selectedTypologyPreset}
                onChange={(e) => {
                  setSelectedTypologyPreset(e.target.value);
                  setSelectedElementPreset(''); // Reset element preset when typology changes
                }}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                {Object.keys(PRESETS_POR_TIPOLOGIA).map(typology => (
                  <option key={typology} value={typology}>
                    {PRESET_LABELS[typology] || typology}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Preset del Elemento</label>
              <select
                value={selectedElementPreset}
                onChange={(e) => setSelectedElementPreset(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">Seleccione un preset...</option>
                {PRESETS_POR_TIPOLOGIA[selectedTypologyPreset]?.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Preset Info Display */}
        {usePresetMode && selectedElementPreset && (() => {
          const preset = PRESETS_POR_TIPOLOGIA[selectedTypologyPreset]?.find(p => p.id === selectedElementPreset);
          if (!preset) return null;
          return (
            <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-cyan-400 text-xs font-semibold mb-2">Parámetros del Preset:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-white/60">Espesor:</span>
                  <span className="text-zinc-900 dark:text-white font-semibold ml-1">{preset.espesor}m</span>
                </div>
                <div>
                  <span className="text-white/60">Desperdicio:</span>
                  <span className="text-zinc-900 dark:text-white font-semibold ml-1">{(preset.desperdicio - 1) * 100}%</span>
                </div>
                <div>
                  <span className="text-white/60">Acero:</span>
                  <span className="text-zinc-900 dark:text-white font-semibold ml-1">{preset.densidadAcero} kg/m²</span>
                </div>
                {preset.factorCompactacion && (
                  <div>
                    <span className="text-white/60">Compactación:</span>
                    <span className="text-zinc-900 dark:text-white font-semibold ml-1">{(preset.factorCompactacion - 1) * 100}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Longitud (m)</label>
            <input
              type="number"
              value={slabDimensions.length}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, length: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Ancho (m)</label>
            <input
              type="number"
              value={slabDimensions.width}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, width: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">
              Espesor (m) {usePresetMode && selectedElementPreset && <span className="text-cyan-400 text-xs">(Auto)</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={slabDimensions.thickness}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, thickness: Number(e.target.value) })}
              disabled={usePresetMode && selectedElementPreset !== ''}
              className={`w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50 ${usePresetMode && selectedElementPreset !== '' ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-zinc-900 dark:text-white text-xs sm:text-sm mb-1 font-semibold">Tipo de Losa</label>
            <select
              value={slabDimensions.slabType}
              onChange={(e) => setSlabDimensions({ ...slabDimensions, slabType: e.target.value as any })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500/50"
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
      <BudgetItemsTable
        items={visibleItems}
        totalCount={items.length}
        hasMore={hasMoreItems}
        remaining={remainingItems}
        selectedTypology={selectedTypology}
        onShowMore={showMoreItems}
        onAddItem={addItem}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onCrewSizeChange={(itemId, value) => updateRenglonParam(itemId, { crewSize: value })}
        onPerformanceChange={(itemId, value) => updateRenglonParam(itemId, { dailyPerformance: value })}
        onEfficiencyChange={(itemId, value) => updateRenglonParam(itemId, { efficiency: value })}
      />

      {/* Budget Summary */}
      <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-4 sm:p-6">
        <BudgetSummaryPanel
          summary={summary}
          indirectPercentage={indirectPercentage}
          contingencyPercentage={contingencyPercentage}
          profitPercentage={profitPercentage}
          onIndirectChange={setIndirectPercentage}
          onContingencyChange={setContingencyPercentage}
          onProfitChange={setProfitPercentage}
          projectAreaM2={projects.find(p => p.id === selectedProject)?.area_m2}
          qualityLevel={projects.find(p => p.id === selectedProject)?.quality_level}
        />
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
          <div className="bg-white/[var(--glass-opacity,0.15)] dark:bg-black/[var(--glass-opacity,0.2)] backdrop-blur-[var(--glass-blur,16px)] border border-white/15 dark:border-zinc-700/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.25)] will-change-[backdrop-filter] contain-paint rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-anchor-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Exportar Presupuesto a PDF</h2>
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
                unit_cost: item.unit_cost,
                total_cost: item.total_cost,
                timeRequired: item.apuResult ? 
                  (item.quantity / (apuParams.dailyPerformance * (apuParams.crewSize || 1))) : undefined,
                materialBreakdown: item.apuResult ? [{
                  code: item.code,
                  description: item.description,
                  unit: item.unit,
                  quantity: item.quantity * (1 + apuParams.wastePercentage / 100),
                  unit_cost: item.unit_cost,
                  total_cost: item.total_cost
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