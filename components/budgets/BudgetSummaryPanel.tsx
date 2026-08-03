'use client';

// ============================================================================
// Panel de Resumen del Presupuesto
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Extraído de BudgetCalculator.tsx (FASE 6.1 - dividir componente grande)
// ============================================================================

import { LocalBudgetSummary, formatQuetzales } from '@/lib/calculators/apuCalculator';
import { checkBudgetMarginWarning, formatGTQ, GUATEMALA_CONFIG } from '@/lib/config/app.config';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface BudgetSummaryPanelProps {
  summary: LocalBudgetSummary;
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  onIndirectChange: (value: number) => void;
  onContingencyChange: (value: number) => void;
  onProfitChange: (value: number) => void;
  projectAreaM2?: number;
  qualityLevel?: 'basic' | 'moderate' | 'premium';
}

export default function BudgetSummaryPanel({
  summary,
  indirectPercentage,
  contingencyPercentage,
  profitPercentage,
  onIndirectChange,
  onContingencyChange,
  onProfitChange,
  projectAreaM2,
  qualityLevel = 'moderate',
}: BudgetSummaryPanelProps) {
  // Calculate budget margin warning if project area is available
  const marginWarning = projectAreaM2 && projectAreaM2 > 0
    ? checkBudgetMarginWarning(projectAreaM2, summary.total, qualityLevel)
    : null;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Resumen del Presupuesto</h2>
        {marginWarning && marginWarning.exceeds && (
          <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Excede Matriz Guatemala</span>
          </div>
        )}
      </div>

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

      {/* Budget Margin Warning Section */}
      {projectAreaM2 && projectAreaM2 > 0 && marginWarning && (
        <div className={`mt-4 p-4 rounded-lg border ${
          marginWarning.exceeds 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              marginWarning.exceeds ? 'bg-amber-500/20' : 'bg-emerald-500/20'
            }`}>
              {marginWarning.exceeds ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold mb-1 ${
                marginWarning.exceeds ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                {marginWarning.exceeds 
                  ? 'Alerta: Presupuesto Excede Matriz Guatemala' 
                  : 'Presupuesto Dentro de Rango Aceptable'}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Costo por m²:</span>
                  <span className={`font-medium ${
                    marginWarning.exceeds ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {formatGTQ(summary.total / projectAreaM2)}/m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Rango Recomendado:</span>
                  <span className="text-white">{marginWarning.recommendedMargin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Margen Actual:</span>
                  <span className={`font-medium ${
                    marginWarning.exceeds ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {marginWarning.marginPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

