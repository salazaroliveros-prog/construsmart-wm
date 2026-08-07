'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, Calendar, Target, Zap } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalBudgetItem } from '@/lib/db/offlineStore';
import { formatCurrency, useFinancialSettings } from '@/lib/hooks/useBusinessSettings';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

export default function AnalyticsDashboard() {
  const { financial } = useFinancialSettings();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [budgetItems, setBudgetItems] = useState<LocalBudgetItem[]>([]);
  const [evmData, setEvmData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#f97316'];

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = await getUserScope();

      // Load projects
      const allProjects = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      setProjects(allProjects);

      // Load transactions and budget items
      let allTransactions = scopeLocalRows(await offlineDB.financialTransactions.toArray(), userId);
      let allBudgetItems = scopeLocalRows(await offlineDB.budgetItems.toArray(), userId);

      if (selectedProject !== 'all') {
        allTransactions = allTransactions.filter(t => t.project_id === selectedProject);
        allBudgetItems = allBudgetItems.filter(b => b.project_id === selectedProject);
      }

      setTransactions(allTransactions);
      setBudgetItems(allBudgetItems);

      // Calculate analytics
      calculateEVM(allTransactions, allBudgetItems, allProjects);
      calculateCategoryData(allTransactions);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEVM = (txs: LocalFinancialTransaction[], items: LocalBudgetItem[], allProjects: LocalProject[]) => {
    // Earned Value Management calculation
    // PV (Planned Value) = Total Budget
    // AC (Actual Cost) = Total Expenses
    // EV (Earned Value) = % Complete * PV

    const projectSummary = allProjects.map(project => {
      const projectBudgets = items.filter(b => b.project_id === project.id);
      const projectTxs = txs.filter(t => t.project_id === project.id && t.type === 'expense');

      const totalPV = projectBudgets.reduce((sum, b) => sum + (b.unit_cost * b.quantity || 0), 0);
      const totalAC = projectTxs.reduce((sum, t) => sum + (t.total_cost || 0), 0);
      
      // Completion % based on actual vs budget
      const completionPercent = totalPV > 0 ? Math.min((totalAC / totalPV) * 100, 100) : 0;
      const totalEV = (completionPercent / 100) * totalPV;

      // Calculate CPI and SPI
      const CPI = totalEV > 0 ? totalAC / totalEV : 1;
      const SPI = totalPV > 0 ? totalEV / totalPV : 1;

      // Variance
      const CV = totalEV - totalAC; // Cost Variance
      const SV = totalEV - totalPV; // Schedule Variance

      return {
        name: project.name,
        project_id: project.id,
        PV: totalPV,
        AC: totalAC,
        EV: totalEV,
        CPI: parseFloat(CPI.toFixed(2)),
        SPI: parseFloat(SPI.toFixed(2)),
        CV: parseFloat(CV.toFixed(2)),
        SV: parseFloat(SV.toFixed(2)),
        completion: parseFloat(completionPercent.toFixed(1))
      };
    });

    setEvmData(projectSummary);
  };

  const calculateCategoryData = (txs: LocalFinancialTransaction[]) => {
    const categoryTotals: { [key: string]: number } = {};

    txs.forEach(tx => {
      if (tx.type === 'expense') {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + (tx.total_cost || 0);
      }
    });

    const data = Object.entries(categoryTotals).map(([category, total]) => ({
      name: category,
      value: parseFloat(total.toFixed(2))
    }));

    setCategoryData(data.sort((a, b) => b.value - a.value));
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'Sin proyecto';
    return projects.find(p => p.id === projectId)?.name || 'Proyecto desconocido';
  };

  const currentProject = selectedProject !== 'all' 
    ? evmData.find(e => e.project_id === selectedProject)
    : null;

  // S-Curve data: cumulative schedule
  const generateSCurve = () => {
    if (selectedProject === 'all') return [];
    
    const projectTxs = transactions.filter(t => t.project_id === selectedProject && t.type === 'expense');
    
    // Group by date
    const dateGroups: { [key: string]: number } = {};
    projectTxs.forEach(tx => {
      if (tx.date) {
        dateGroups[tx.date] = (dateGroups[tx.date] || 0) + (tx.total_cost || 0);
      }
    });

    const dates = Object.keys(dateGroups).sort();
    let cumulative = 0;
    const budgets = budgetItems.filter(b => b.project_id === selectedProject);
    const totalBudget = budgets.reduce((sum, b) => sum + (b.unit_cost * b.quantity || 0), 0);

    return dates.map(date => {
      cumulative += dateGroups[date];
      return {
        date: new Date(date).toLocaleDateString('es-GT'),
        actual: cumulative,
        planned: (cumulative / (totalBudget || cumulative)) * totalBudget
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-white/60 text-sm">Análisis de Valor Ganado y métricas de proyecto</p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="glass-input px-4 py-2 rounded-lg text-white text-sm"
        >
          <option value="all">Todos los proyectos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-12 rounded-xl text-center">
          <p className="text-white/60">Cargando datos...</p>
        </div>
      ) : (
        <>
          {/* EVM Metrics */}
          {currentProject && selectedProject !== 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl border-l-4 border-l-cyan-500">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-white/60 text-xs">CPI</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentProject.CPI}</p>
                <p className={`text-xs mt-1 ${currentProject.CPI < 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentProject.CPI < 1 ? 'Por encima de presupuesto' : 'Dentro de presupuesto'}
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-violet-500">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span className="text-white/60 text-xs">SPI</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentProject.SPI}</p>
                <p className={`text-xs mt-1 ${currentProject.SPI < 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentProject.SPI < 1 ? 'Atrasado' : 'En horario'}
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-white/60 text-xs">Finalización</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentProject.completion}%</p>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-white/60 text-xs">Varianza CV</span>
                </div>
                <p className={`text-2xl font-bold ${currentProject.CV < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(currentProject.CV, financial)}
                </p>
              </div>
            </div>
          )}

          {/* EVM Comparison Chart */}
          {selectedProject !== 'all' && currentProject && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Análisis de Valor Ganado (EVM)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  {
                    name: 'Métrica',
                    PV: currentProject.PV,
                    AC: currentProject.AC,
                    EV: currentProject.EV
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value, financial)}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <Legend />
                  <Bar dataKey="PV" fill="#06b6d4" name="PV (Presupuestado)" />
                  <Bar dataKey="AC" fill="#ef4444" name="AC (Costo Real)" />
                  <Bar dataKey="EV" fill="#10b981" name="EV (Valor Ganado)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* S-Curve */}
          {selectedProject !== 'all' && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Curva S - Progreso Acumulado</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateSCurve()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value, financial)}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#06b6d4" name="Costo Real Acumulado" strokeWidth={2} />
                  <Line type="monotone" dataKey="planned" stroke="#8b5cf6" name="Costo Planificado Acumulado" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Gastos por Categoría</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${(entry.name ?? '').substring(0, 10)}...`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value, financial)}
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-white/60 text-center py-8">Sin datos disponibles</p>
              )}
            </div>

            {/* Category Details */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Detalles de Categorías</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-white/70 text-sm truncate">{item.name}</span>
                    </div>
                    <span className="text-white font-medium text-sm">
                      {formatCurrency(item.value, financial)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Comparison */}
          {selectedProject === 'all' && evmData.length > 0 && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Comparativa de Proyectos - CPI vs SPI</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={evmData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <Legend />
                  <Bar dataKey="CPI" fill="#06b6d4" name="CPI (Eficiencia de Costo)" />
                  <Bar dataKey="SPI" fill="#8b5cf6" name="SPI (Eficiencia de Cronograma)" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-xs text-white/60 text-center">
                CPI/SPI = 1 es ideal. {'<'}1 indica sobreasignación
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {selectedProject === 'all' && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Resumen de Todos los Proyectos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Presupuesto Total</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(evmData.reduce((sum, p) => sum + p.PV, 0), financial)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Costo Real Total</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {formatCurrency(evmData.reduce((sum, p) => sum + p.AC, 0), financial)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Valor Ganado Total</p>
                  <p className="text-xl font-bold text-violet-400">
                    {formatCurrency(evmData.reduce((sum, p) => sum + p.EV, 0), financial)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Varianza Total</p>
                  <p className={`text-xl font-bold ${evmData.reduce((sum, p) => sum + p.CV, 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(evmData.reduce((sum, p) => sum + p.CV, 0), financial)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
