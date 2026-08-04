// ============================================================================
// Componente Acordeón Expandible para Renglones
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Muestra desglose completo de cálculos por renglón
// Tipo concertina: collapsado por defecto, expandible al click
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, Package, Clock, TrendingUp, Settings, Edit3 } from 'lucide-react';
import { RenglonCalculator, RenglonCalculationParams, RenglonCalculationResult, formatCurrency, formatDays } from '@/lib/calculators/renglonCalculator';
import { APURenglon } from '@/lib/types/apu';
import { MaterialBreakdownItem } from '@/lib/calculators/renglonCalculator';

interface RenglonAccordionProps {
  renglon: APURenglon;
  quantity: number;
  onQuantityChange?: (quantity: number) => void;
  onCrewSizeChange?: (crewSize: number) => void;
  onMaterialCostChange?: (cost: number) => void;
  onPerformanceChange?: (performance: number) => void;
  onEfficiencyChange?: (efficiency: number) => void;
  defaultExpanded?: boolean;
}

export default function RenglonAccordion({
  renglon,
  quantity,
  onQuantityChange,
  onCrewSizeChange,
  onMaterialCostChange,
  onPerformanceChange,
  onEfficiencyChange,
  defaultExpanded = false
}: RenglonAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [calcResult, setCalcResult] = useState<RenglonCalculationResult | null>(null);
  const [materialBreakdown, setMaterialBreakdown] = useState<MaterialBreakdownItem[]>([]);

  // Estado de parámetros editables
  const [customCrewSize, setCustomCrewSize] = useState<number | undefined>(renglon.laborFormula?.crewSize);
  const [customMaterialCost, setCustomMaterialCost] = useState<number | undefined>(renglon.materialFormula?.materialUnitCost);
  const [customPerformance, setCustomPerformance] = useState<number | undefined>(renglon.laborFormula?.dailyPerformance);
  const [efficiency, setEfficiency] = useState(renglon.defaultValues?.efficiency || 100);

  // Recalcular cuando cambian parámetros
  useEffect(() => {
    const params: RenglonCalculationParams = {
      quantity,
      renglon,
      customCrewSize,
      customMaterialCost,
      customPerformance,
      efficiency
    };

    const result = RenglonCalculator.calculateRenglon(params);
    setCalcResult(result);

    const breakdown = RenglonCalculator.calculateMaterialBreakdown(params);
    setMaterialBreakdown(breakdown);
  }, [quantity, renglon, customCrewSize, customMaterialCost, customPerformance, efficiency]);

  // Handlers para cambios
  const handleCrewSizeChange = (value: number) => {
    setCustomCrewSize(value);
    onCrewSizeChange?.(value);
  };

  const handleMaterialCostChange = (value: number) => {
    setCustomMaterialCost(value);
    onMaterialCostChange?.(value);
  };

  const handlePerformanceChange = (value: number) => {
    setCustomPerformance(value);
    onPerformanceChange?.(value);
  };

  const handleEfficiencyChange = (value: number) => {
    setEfficiency(value);
    onEfficiencyChange?.(value);
  };

  if (!calcResult) return null;

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/10">
      {/* Header - Siempre visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            {renglon.number}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-xs">{renglon.code}</span>
              <h3 className="text-white font-semibold">{renglon.description}</h3>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-white/60">Cant: {quantity} {renglon.unit}</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(calcResult.total_cost)}</span>
              <span className="text-white/60 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDays(calcResult.daysRequired)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </div>
      </div>

      {/* Expanded Content - Desglose completo */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Resumen de Costos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-cyan-400" />
                <span className="text-white/60 text-xs">Materiales</span>
              </div>
              <p className="text-white font-semibold">{formatCurrency(calcResult.materialCost)}</p>
              <p className="text-white/40 text-xs">{calcResult.materialQuantity.toFixed(2)} {calcResult.materialUnit}</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-white/60 text-xs">Mano de Obra</span>
              </div>
              <p className="text-white font-semibold">{formatCurrency(calcResult.laborCost)}</p>
              <p className="text-white/40 text-xs">{calcResult.crewSize} personas</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-white/60 text-xs">Tiempo</span>
              </div>
              <p className="text-white font-semibold">{formatDays(calcResult.daysRequired)}</p>
              <p className="text-white/40 text-xs">{calcResult.crewHours.toFixed(0)} horas-hombre</p>
            </div>
          </div>

          {/* Desglose de Materiales - Mejorado para Almacén */}
          {materialBreakdown.length > 0 && (
            <div className="glass-panel p-4 rounded-lg border-l-4 border-l-cyan-500">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Desglose de Materiales (Para Órdenes de Compra)
              </h4>
              <div className="overflow-x-auto overflow-anchor-none">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-2 px-2">Código</th>
                      <th className="text-left text-white/60 py-2 px-2">Material</th>
                      <th className="text-right text-white/60 py-2 px-2">Cantidad</th>
                      <th className="text-right text-white/60 py-2 px-2">Unidad</th>
                      <th className="text-right text-white/60 py-2 px-2">P. Unitario</th>
                      <th className="text-right text-white/60 py-2 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialBreakdown.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-2 text-cyan-400 font-mono text-xs">{item.code}</td>
                        <td className="py-2 px-2 text-white">{item.description}</td>
                        <td className="py-2 px-2 text-right text-white font-medium">{item.quantity.toFixed(3)}</td>
                        <td className="py-2 px-2 text-right text-white/60">{item.unit}</td>
                        <td className="py-2 px-2 text-right text-white/60">{formatCurrency(item.unit_cost)}</td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-semibold">{formatCurrency(item.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-cyan-500/30">
                      <td colSpan={5} className="py-2 px-2 text-right text-white font-semibold">Total Materiales:</td>
                      <td className="py-2 px-2 text-right text-cyan-400 font-bold">
                        {formatCurrency(materialBreakdown.reduce((sum, item) => sum + item.total_cost, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-3 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-cyan-300 text-xs flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  Este desglose se utiliza para generar órdenes de compra en el módulo de almacén
                </p>
              </div>
            </div>
          )}

          {/* Parámetros Editables */}
          <div className="glass-panel p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-violet-400" />
              Parámetros Editables
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cantidad */}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Cantidad ({renglon.unit})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => onQuantityChange?.(parseFloat(e.target.value) || 0)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                />
              </div>

              {/* Tamaño de Cuadrilla */}
              {renglon.laborFormula && (
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Cuadrilla (personas)</label>
                  <input
                    type="number"
                    value={customCrewSize || renglon.laborFormula.crewSize}
                    onChange={(e) => handleCrewSizeChange(parseFloat(e.target.value) || 1)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  />
                  <p className="text-white/40 text-xs mt-1">Default: {renglon.laborFormula.crewSize}</p>
                </div>
              )}

              {/* Costo de Material */}
              {renglon.materialFormula && (
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Costo Material (Q/{renglon.materialFormula.unit})</label>
                  <input
                    type="number"
                    value={customMaterialCost || renglon.materialFormula.materialUnitCost}
                    onChange={(e) => handleMaterialCostChange(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  />
                  <p className="text-white/40 text-xs mt-1">Default: {formatCurrency(renglon.materialFormula.materialUnitCost)}</p>
                </div>
              )}

              {/* Rendimiento */}
              {renglon.laborFormula && (
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Rendimiento ({renglon.laborFormula.unit}/día)</label>
                  <input
                    type="number"
                    value={customPerformance || renglon.laborFormula.dailyPerformance}
                    onChange={(e) => handlePerformanceChange(parseFloat(e.target.value) || 1)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  />
                  <p className="text-white/40 text-xs mt-1">Default: {renglon.laborFormula.dailyPerformance}</p>
                </div>
              )}

              {/* Eficiencia */}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Eficiencia (%)</label>
                <input
                  type="number"
                  value={efficiency}
                  onChange={(e) => handleEfficiencyChange(Math.min(150, Math.max(50, parseFloat(e.target.value) || 100)))}
                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  min={50}
                  max={150}
                />
                <p className="text-white/40 text-xs mt-1">Rango: 50% - 150%</p>
              </div>
            </div>
          </div>

          {/* Rendimientos */}
          <div className="glass-panel p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Rendimientos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/60 text-sm">Rendimiento Material</span>
                <span className="text-cyan-400 font-medium">{calcResult.materialYield.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/60 text-sm">Rendimiento Mano de Obra</span>
                <span className="text-violet-400 font-medium">{calcResult.laborYield.toFixed(2)} {renglon.unit}/día</span>
              </div>
            </div>
          </div>

          {/* Maquinaria (si aplica) */}
          {calcResult.machineryType && (
            <div className="glass-panel p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">Maquinaria</h4>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white text-sm">{calcResult.machineryType}</p>
                  <p className="text-white/60 text-xs">{calcResult.machineryHours?.toFixed(2)} horas</p>
                </div>
                <p className="text-amber-400 font-semibold">{formatCurrency(calcResult.machineryCost)}</p>
              </div>
            </div>
          )}

          {/* Impacto en Cascada */}
          {calcResult.crewSizeChange !== undefined && calcResult.timeReduction !== undefined && (
            <div className="glass-panel p-4 rounded-lg border-l-4 border-l-emerald-500">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Impacto en Cascada
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-white/80">
                  Cambio de cuadrilla: <span className={calcResult.crewSizeChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {calcResult.crewSizeChange > 0 ? '+' : ''}{calcResult.crewSizeChange} personas
                  </span>
                </p>
                <p className="text-white/80">
                  Reducción de tiempo: <span className="text-emerald-400 font-medium">
                    {formatDays(calcResult.timeReduction)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
