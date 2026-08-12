'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BudgetComparisonData {
  category: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface BudgetVsExecutionProps {
  projectId?: string;
  budgetTotal: number;
  actualTotal?: number;
}

const COLORS = {
  planned: '#06b6d4', // cyan-500
  actual: '#8b5cf6', // violet-500
  positive: '#10b981', // emerald-500
  negative: '#f59e0b', // amber-500
};

export default function BudgetVsExecution({ projectId, budgetTotal, actualTotal = 0 }: BudgetVsExecutionProps) {
  const [comparisonData, setComparisonData] = useState<BudgetComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActualData, setHasActualData] = useState(false);

  useEffect(() => {
    // Simulación de datos - en producción esto vendría de la base de datos
    const generateComparisonData = () => {
      if (!actualTotal || actualTotal === 0) {
        setLoading(false);
        return;
      }

      setHasActualData(true);

      // Datos simulados por categoría (en producción vendrían de gastos reales)
      const categories = [
        { name: 'Estructural', planned: budgetTotal * 0.25, actual: actualTotal * 0.26 },
        { name: 'Mampostería', planned: budgetTotal * 0.15, actual: actualTotal * 0.14 },
        { name: 'Acabados', planned: budgetTotal * 0.20, actual: actualTotal * 0.22 },
        { name: 'Instalaciones', planned: budgetTotal * 0.18, actual: actualTotal * 0.17 },
        { name: 'Equipos', planned: budgetTotal * 0.12, actual: actualTotal * 0.11 },
        { name: 'Servicios', planned: budgetTotal * 0.10, actual: actualTotal * 0.10 },
      ];

      const data = categories.map(cat => {
        const variance = cat.actual - cat.planned;
        const variancePercent = (variance / cat.planned) * 100;

        return {
          category: cat.name,
          planned: cat.planned,
          actual: cat.actual,
          variance,
          variancePercent,
        };
      });

      setComparisonData(data);
      setLoading(false);
    };

    generateComparisonData();
  }, [budgetTotal, actualTotal, projectId]);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'Q 0';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const overallVariance = actualTotal - budgetTotal;
  const overallVariancePercent = budgetTotal > 0 ? (overallVariance / budgetTotal) * 100 : 0;

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Comparación Presupuesto vs Ejecución</h3>
        </div>
        <div className="text-white/60 text-sm">Cargando datos de ejecución...</div>
      </div>
    );
  }

  if (!hasActualData) {
    return (
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Comparación Presupuesto vs Ejecución</h3>
        </div>
        <div className="flex items-center gap-3 text-white/60 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <p>No hay datos de ejecución disponibles. Inicie el proyecto para ver comparaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Comparación Presupuesto vs Ejecución</h3>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm">Presupuesto Planificado</span>
          </div>
          <p className="text-white font-bold text-lg">{formatCurrency(budgetTotal)}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-violet-400" />
            <span className="text-white/60 text-sm">Gastos Reales</span>
          </div>
          <p className="text-white font-bold text-lg">{formatCurrency(actualTotal)}</p>
        </div>

        <div className={`rounded-xl p-4 ${
          overallVariance <= 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {overallVariance <= 0 ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-white/60 text-sm">Varianza</span>
          </div>
          <p className={`font-bold text-lg ${
            overallVariance <= 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {overallVariance <= 0 ? '-' : '+'}{formatCurrency(Math.abs(overallVariance))}
            <span className="text-sm ml-1">({overallVariancePercent.toFixed(1)}%)</span>
          </p>
        </div>
      </div>

      {/* Gráfico de Barras Comparativo */}
      <div className="mb-6">
        <h4 className="text-white/80 text-sm mb-3">Desglose por Categoría</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="category" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              stroke="rgba(255,255,255,0.3)"
            />
            <YAxis 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              stroke="rgba(255,255,255,0.3)"
              tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : undefined)}
            />
            <Legend />
            <Bar dataKey="planned" name="Planificado" fill={COLORS.planned} />
            <Bar dataKey="actual" name="Real" fill={COLORS.actual} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Pie de Distribución */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h4 className="text-white/80 text-sm mb-3">Distribución Planificada</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={comparisonData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="planned"
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-planned-${index}`} fill={COLORS.planned} opacity={0.8 - (index * 0.1)} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : undefined)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-white/80 text-sm mb-3">Distribución Real</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={comparisonData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="actual"
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-actual-${index}`} fill={COLORS.actual} opacity={0.8 - (index * 0.1)} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : undefined)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Detalles */}
      <div className="mt-6">
        <h4 className="text-white/80 text-sm mb-3">Detalles por Categoría</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/60">Categoría</th>
                <th className="text-right py-2 px-3 text-white/60">Planificado</th>
                <th className="text-right py-2 px-3 text-white/60">Real</th>
                <th className="text-right py-2 px-3 text-white/60">Varianza</th>
                <th className="text-right py-2 px-3 text-white/60">%</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item, index) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-2 px-3 text-white">{item.category}</td>
                  <td className="py-2 px-3 text-right text-cyan-400">{formatCurrency(item.planned)}</td>
                  <td className="py-2 px-3 text-right text-violet-400">{formatCurrency(item.actual)}</td>
                  <td className={`py-2 px-3 text-right ${
                    item.variance <= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {item.variance <= 0 ? '-' : '+'}{formatCurrency(Math.abs(item.variance))}
                  </td>
                  <td className={`py-2 px-3 text-right ${
                    item.variance <= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {item.variance <= 0 ? '-' : '+'}{item.variancePercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}