'use client';

import { Calculator } from 'lucide-react';
import type { BudgetItem } from './types';

interface RealTimeCalculationsProps {
  items: BudgetItem[];
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
}

export default function RealTimeCalculations({
  items,
  indirectPercentage,
  contingencyPercentage,
  profitPercentage,
}: RealTimeCalculationsProps) {
  if (items.length === 0) {
    return null;
  }

  const directCost = items.reduce((sum, item) => sum + item.total_cost, 0);
  const indirectCost = directCost * (indirectPercentage / 100);
  const contingencyCost = directCost * (contingencyPercentage / 100);
  const profitCost = directCost * (profitPercentage / 100);
  const total = directCost + indirectCost + contingencyCost + profitCost;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-cyan-500/30 bg-cyan-500/10">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Cálculos en Tiempo Real</h3>
        <span className="text-xs text-white/60 ml-auto">{items.length} items</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/60 text-xs mb-1">Costo Directo</p>
          <p className="text-white font-bold text-lg">{formatCurrency(directCost)}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/60 text-xs mb-1">Indirectos ({indirectPercentage}%)</p>
          <p className="text-white font-bold text-lg">{formatCurrency(indirectCost)}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/60 text-xs mb-1">Contingencia ({contingencyPercentage}%)</p>
          <p className="text-white font-bold text-lg">{formatCurrency(contingencyCost)}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/60 text-xs mb-1">Utilidad ({profitPercentage}%)</p>
          <p className="text-white font-bold text-lg">{formatCurrency(profitCost)}</p>
        </div>

        <div className="bg-cyan-500/20 rounded-xl p-3 col-span-2 sm:col-span-1">
          <p className="text-cyan-400 text-xs mb-1">Total Estimado</p>
          <p className="text-cyan-400 font-bold text-lg">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/60">Promedio por item</span>
          <span className="text-white font-medium">{formatCurrency(directCost / items.length)}</span>
        </div>
      </div>
    </div>
  );
}