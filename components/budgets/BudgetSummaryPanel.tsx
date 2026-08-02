'use client';

// ============================================================================
// Panel de Resumen del Presupuesto
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Extraído de BudgetCalculator.tsx (FASE 6.1 - dividir componente grande)
// ============================================================================

import { LocalBudgetSummary, formatQuetzales } from '@/lib/calculators/apuCalculator';

interface BudgetSummaryPanelProps {
  summary: LocalBudgetSummary;
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  onIndirectChange: (value: number) => void;
  onContingencyChange: (value: number) => void;
  onProfitChange: (value: number) => void;
}

export default function BudgetSummaryPanel({
  summary,
  indirectPercentage,
  contingencyPercentage,
  profitPercentage,
  onIndirectChange,
  onContingencyChange,
  onProfitChange,
}: BudgetSummaryPanelProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Resumen del Presupuesto</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-white/60 text-xs sm:text-sm mb-1">Indirectos (%)</label>
          <input
            type="number"
            value={indirectPercentage}
            onChange={(e) => onIndirectChange(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs sm:text-sm mb-1">Contingencia (%)</label>
          <input
            type="number"
            value={contingencyPercentage}
            onChange={(e) => onContingencyChange(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs sm:text-sm mb-1">Utilidad (%)</label>
          <input
            type="number"
            value={profitPercentage}
            onChange={(e) => onProfitChange(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs sm:text-sm mb-1">Total</label>
          <div className="text-2xl font-bold text-white">
            {formatQuetzales(summary.total)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-3 rounded-lg">
          <p className="text-white/60 text-xs sm:text-sm">Costo Directo</p>
          <p className="text-lg font-bold text-white">
            {formatQuetzales(summary.directCost)}
          </p>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <p className="text-white/60 text-xs sm:text-sm">Indirectos</p>
          <p className="text-lg font-bold text-white">
            {formatQuetzales(summary.indirectCost)}
          </p>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <p className="text-white/60 text-xs sm:text-sm">Contingencia</p>
          <p className="text-lg font-bold text-white">
            {formatQuetzales(summary.contingency)}
          </p>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <p className="text-white/60 text-xs sm:text-sm">Utilidad</p>
          <p className="text-lg font-bold text-white">
            {formatQuetzales(summary.profit)}
          </p>
        </div>
      </div>
    </div>
  );
}

