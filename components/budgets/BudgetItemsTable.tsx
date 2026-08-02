'use client';

// ============================================================================
// Tabla/Lista de Items del Presupuesto
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Extraído de BudgetCalculator.tsx (FASE 6.1 - dividir componente grande)
// Renderiza de forma incremental los items (useIncrementalList en el padre).
// ============================================================================

import { Plus, Trash2, Calculator } from 'lucide-react';
import { RENGLONES_BY_TYPOLOGY_DETAILED } from '@/lib/data/apuRenglonesDetailed';
import { ProjectTypology } from '@/lib/types/apu';
import { formatQuetzales } from '@/lib/calculators/apuCalculator';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import RenglonAccordion from '@/components/budgets/RenglonAccordion';
import { BudgetItem } from './types';

interface BudgetItemsTableProps {
  items: BudgetItem[];
  totalCount: number;
  hasMore: boolean;
  remaining: number;
  selectedTypology: ProjectTypology;
  onShowMore: () => void;
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof BudgetItem, value: string | number) => void;
  onDeleteItem: (id: string) => void;
  onCrewSizeChange: (itemId: string, value: number) => void;
  onPerformanceChange: (itemId: string, value: number) => void;
  onEfficiencyChange: (itemId: string, value: number) => void;
}

export default function BudgetItemsTable({
  items,
  totalCount,
  hasMore,
  remaining,
  selectedTypology,
  onShowMore,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onCrewSizeChange,
  onPerformanceChange,
  onEfficiencyChange,
}: BudgetItemsTableProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Items del Presupuesto</h2>
        <Tooltip content="Agregar nuevo item al presupuesto">
          <button
            onClick={onAddItem}
            className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Item
          </button>
        </Tooltip>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={<Calculator className="w-8 h-8 text-white/30" />}
          title="No hay items en el presupuesto"
          description="Agregue cálculos de losa o items manuales para comenzar a armar el presupuesto."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            // Busca el renglón del catálogo para el cálculo detallado
            const catalogRenglon = RENGLONES_BY_TYPOLOGY_DETAILED[selectedTypology]?.find(
              r => r.code === item.code
            );

            if (catalogRenglon) {
              return (
                <RenglonAccordion
                  key={item.id}
                  renglon={catalogRenglon}
                  quantity={item.quantity}
                  onQuantityChange={(value) => onUpdateItem(item.id, 'quantity', value)}
                  onCrewSizeChange={(value) => onCrewSizeChange(item.id, value)}
                  onMaterialCostChange={(value) => onUpdateItem(item.id, 'unitCost', value)}
                  onPerformanceChange={(value) => onPerformanceChange(item.id, value)}
                  onEfficiencyChange={(value) => onEfficiencyChange(item.id, value)}
                  defaultExpanded={false}
                />
              );
            }

            // Fallback: fila simple para items sin renglón en catálogo
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
                        onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
                        className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => onUpdateItem(item.id, 'unitCost', e.target.value)}
                        className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="text-white font-medium mr-4">
                    {formatQuetzales(item.totalCost)}
                  </div>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    aria-label={`Eliminar ${item.description}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <div className="text-center py-3">
              <button
                onClick={onShowMore}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
              >
                Ver más items ({remaining} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

