'use client';

import React, { useEffect, useState } from 'react';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Layers } from 'lucide-react';
import { useBusinessSettings, useFinancialSettings, formatCurrency, calculateUtilityMarginHelper } from '@/lib/hooks/useBusinessSettings';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { offlineDB, LocalProject, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

export default function DashboardCharts() {
  const { settings } = useBusinessSettings();
  const { financial } = useFinancialSettings();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    loadRealData();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadRealData = async () => {
    try {
      const [localProjects, localTransactions] = await Promise.all([
        offlineDB.projects.toArray(),
        offlineDB.financialTransactions.toArray(),
      ]);
      setProjects(localProjects);
      setTransactions(localTransactions);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.total_cost || 0), 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);

  // Calculate utility margin dynamically from settings
  const utilityMargin = calculateUtilityMarginHelper(totalBudget, totalSpent, settings);

  const projectStatusData = [
    { name: 'Planificación', value: projects.filter(p => p.status === 'planning').length, color: '#f59e0b' },
    { name: 'Ejecución', value: projects.filter(p => p.status === 'execution').length, color: '#10b981' },
    { name: 'Pausado', value: projects.filter(p => p.status === 'paused').length, color: '#6366f1' },
    { name: 'Completado', value: projects.filter(p => p.status === 'completed').length, color: '#06b6d4' },
  ];

  // Real category distribution from transactions
  const categoryData = [
    { name: 'Materiales', value: transactions.filter(t => t.type === 'expense' && t.category === 'materiales').reduce((sum, t) => sum + (t.total_cost || 0), 0) },
    { name: 'Mano de Obra', value: transactions.filter(t => t.type === 'expense' && t.category === 'mano_de_obra').reduce((sum, t) => sum + (t.total_cost || 0), 0) },
    { name: 'Equipo', value: transactions.filter(t => t.type === 'expense' && t.category === 'herramienta').reduce((sum, t) => sum + (t.total_cost || 0), 0) },
    { name: 'Subcontratos', value: transactions.filter(t => t.type === 'expense' && t.category === 'sub_contrato').reduce((sum, t) => sum + (t.total_cost || 0), 0) },
    { name: 'Otros', value: transactions.filter(t => t.type === 'expense' && !['materiales', 'mano_de_obra', 'herramienta', 'sub_contrato'].includes(t.category)).reduce((sum, t) => sum + (t.total_cost || 0), 0) },
  ];

  // CHART 1: Combination Chart - Budget vs Actual Cost (6 months)
  const now = new Date();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const budgetVsActualData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter(t => t.date && t.date.startsWith(monthKey));
    const monthProjects = projects.filter(p => {
      const projectDate = p.created_at ? new Date(p.created_at) : new Date();
      return projectDate.getFullYear() === monthDate.getFullYear() && 
             projectDate.getMonth() === monthDate.getMonth();
    });
    
    const projectedBudget = monthProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0) / 6; // Distribute budget evenly
    const actualCost = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.total_cost || 0), 0);
    
    return {
      month: monthNames[monthDate.getMonth()],
      presupuesto: projectedBudget,
      costoReal: actualCost,
    };
  });

  // CHART 2: Grouped Bar Chart - Projects Comparison
  const activeProjects = projects.filter(p => p.status === 'execution' || p.status === 'planning').slice(0, 5);
  const projectsComparisonData = activeProjects.map(project => {
    const projectTx = transactions.filter(t => t.project_id === project.id);
    const projectCost = projectTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.total_cost || 0), 0);
    
    return {
      project: project.name.substring(0, 15),
      costo: projectCost,
      presupuesto: project.total_budget || 0,
      area: project.area_m2 || 0,
    };
  });

  // CHART 3: Stacked Area Chart - Cash Flow Breakdown (12 months)
  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter(t => t.date && t.date.startsWith(monthKey));
    
    return {
      month: monthNames[monthDate.getMonth()],
      materiales: monthTx.filter(t => t.type === 'expense' && t.category === 'materiales').reduce((sum, t) => sum + (t.total_cost || 0), 0),
      manoDeObra: monthTx.filter(t => t.type === 'expense' && t.category === 'mano_de_obra').reduce((sum, t) => sum + (t.total_cost || 0), 0),
      subcontratos: monthTx.filter(t => t.type === 'expense' && t.category === 'sub_contrato').reduce((sum, t) => sum + (t.total_cost || 0), 0),
      overheads: monthTx.filter(t => t.type === 'expense' && !['materiales', 'mano_de_obra', 'sub_contrato'].includes(t.category)).reduce((sum, t) => sum + (t.total_cost || 0), 0),
    };
  });

  // CHART 4: Gantt/Timeline - Project Milestones
  const ganttData = activeProjects.slice(0, 5).map((project, index) => {
    const startDate = project.start_date ? new Date(project.start_date) : new Date();
    const endDate = project.estimated_end_date ? new Date(project.estimated_end_date) : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    return {
      project: project.name.substring(0, 12),
      startDay: Math.floor((startDate.getTime() - new Date(now.getFullYear(), now.getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24)),
      duration: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
      progress,
      isDelayed: progress > 100,
    };
  });

  useRealtimeRefresh(
    ['projects', 'financial_transactions'],
    loadRealData
  );

  if (isLoading || !isMounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-3">
            <div className="h-3 bg-white/10 rounded w-1/3 mb-2 animate-pulse" />
            <div className="h-28 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {/* Chart 1: Project Status (Pie) */}
      <div className="glass-panel rounded-xl p-3 min-h-[200px] flex flex-col">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1 flex-shrink-0">
          <PieChartIcon className="w-3 h-3 text-cyan-400" />
          Estado de Proyectos
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius="30%" outerRadius="55%" paddingAngle={3} dataKey="value">
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value: any) => [value, '']} labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }} />
              <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px', paddingTop: '4px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Combination Chart - Budget vs Actual */}
      <div className="glass-panel rounded-xl p-3 min-h-[200px] flex flex-col">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1 flex-shrink-0">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Presupuesto vs Costo Real
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={budgetVsActualData} layout="vertical">
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value: any) => formatCurrency(Number(value) || 0, financial)} />
              <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px', paddingTop: '4px' }} />
              <Bar dataKey="costoReal" fill="#ef4444" radius={[2, 2, 0, 0]} name="Costo Real" />
              <Line type="monotone" dataKey="presupuesto" stroke="#10b981" strokeWidth={2} name="Presupuesto" dot={{ fill: '#10b981', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Grouped Bar Chart - Projects Comparison */}
      <div className="glass-panel rounded-xl p-3 min-h-[200px] flex flex-col">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1 flex-shrink-0">
          <BarChart3 className="w-3 h-3 text-violet-400" />
          Comparación por Proyecto
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectsComparisonData} layout="vertical" barGap={0} barCategoryGap={8}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="project" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 7 }} angle={-45} textAnchor="end" height={60} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value: any) => formatCurrency(Number(value) || 0, financial)} />
              <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px', paddingTop: '4px' }} />
              <Bar dataKey="costo" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Costo" />
              <Bar dataKey="presupuesto" fill="#06b6d4" radius={[2, 2, 0, 0]} name="Presupuesto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Stacked Area Chart - Cash Flow */}
      <div className="glass-panel rounded-xl p-3 min-h-[200px] flex flex-col">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1 flex-shrink-0">
          <Layers className="w-3 h-3 text-amber-400" />
          Flujo de Caja (12 meses)
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData} stackOffset="expand">
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value: any) => formatCurrency(Number(value) || 0, financial)} />
              <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px', paddingTop: '4px' }} />
              <Area type="monotone" dataKey="materiales" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Materiales" />
              <Area type="monotone" dataKey="manoDeObra" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Mano de Obra" />
              <Area type="monotone" dataKey="subcontratos" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Subcontratos" />
              <Area type="monotone" dataKey="overheads" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Overheads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
