'use client';

import React, { useEffect, useState } from 'react';
import { PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { offlineDB, LocalProject, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

export default function DashboardCharts() {
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
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.total_cost || 0), 0);

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

  // Real cash flow per month (last 6 months)
  const now = new Date();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthlyFlow = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter(t => t.date && t.date.startsWith(monthKey));
    const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.total_cost || 0), 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.total_cost || 0), 0);
    return {
      month: monthNames[monthDate.getMonth()],
      income,
      expense,
    };
  });

  useRealtimeRefresh(
    ['projects', 'financial_transactions'],
    loadRealData
  );

if (isLoading || !isMounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-3">
            <div className="h-3 bg-white/10 rounded w-1/3 mb-2 animate-pulse" />
            <div className="h-28 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

      <div className="glass-panel rounded-xl p-3 min-h-[200px] flex flex-col">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1 flex-shrink-0">
          <BarChart3 className="w-3 h-3 text-emerald-400" />
          Distribución de Gastos
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" barGap={0} barCategoryGap={3}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value: any) => formatCurrency(Number(value) || 0, financial)} />
              <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-3 min-h-[200px] flex flex-col">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1 flex-shrink-0">
          <TrendingUp className="w-3 h-3 text-violet-400" />
          Flujo Financiero (6 meses)
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyFlow}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value: any) => formatCurrency(Number(value) || 0, financial)} />
              <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px', paddingTop: '4px' }} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={1.5} name="Ingresos" dot={{ fill: '#10b981', r: 2.5 }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={1.5} name="Gastos" dot={{ fill: '#ef4444', r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}