'use client';

import React from 'react';
import { PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { offlineDB, LocalProject, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import { useState, useEffect } from 'react';

export default function DashboardCharts() {
  const { financial } = useFinancialSettings();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRealData();
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

  const categoryData = [
    { name: 'Materiales', value: totalSpent * 0.4 },
    { name: 'Mano de Obra', value: totalSpent * 0.3 },
    { name: 'Equipo', value: totalSpent * 0.15 },
    { name: 'Subcontratos', value: totalSpent * 0.1 },
    { name: 'Otros', value: totalSpent * 0.05 },
  ];

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

  useRealtimeRefresh(
    ['projects', 'financial_transactions'],
    loadRealData
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-2 flex-1 min-h-0">
            <div className="h-3 bg-white/10 rounded w-1/3 mb-2 animate-pulse" />
            <div className="h-full bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0">
      <div className="glass-panel rounded-xl p-2 flex-1 min-h-0 aspect-[4/3] lg:aspect-auto">
        <h3 className="text-xs font-semibold text-white mb-1 flex items-center gap-1">
          <PieChartIcon className="w-3 h-3 text-cyan-400" />
          Estado de Proyectos
        </h3>
        <div className="h-[calc(100%-1.25rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={24} outerRadius={42} paddingAngle={3} dataKey="value">
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value) => [value, '']} labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }} />
              <Legend iconSize={8} layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-2 flex-1 min-h-0 aspect-[4/3] lg:aspect-auto">
        <h3 className="text-xs font-semibold text-white mb-1 flex items-center gap-1">
          <BarChart3 className="w-3 h-3 text-emerald-400" />
          Distribución de Gastos
        </h3>
        <div className="h-[calc(100%-1.25rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" barGap={0} barCategoryGap={3}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value) => formatCurrency(Number(value) || 0, financial)} />
              <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-2 flex-1 min-h-0 aspect-[4/3] lg:aspect-auto">
        <h3 className="text-xs font-semibold text-white mb-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-violet-400" />
          Flujo Financiero (6 meses)
        </h3>
        <div className="h-[calc(100%-1.25rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { month: 'Ene', income: totalIncome * 0.15, expense: totalSpent * 0.15 },
              { month: 'Feb', income: totalIncome * 0.20, expense: totalSpent * 0.20 },
              { month: 'Mar', income: totalIncome * 0.18, expense: totalSpent * 0.18 },
              { month: 'Abr', income: totalIncome * 0.22, expense: totalSpent * 0.22 },
              { month: 'May', income: totalIncome * 0.25, expense: totalSpent * 0.25 },
              { month: 'Jun', income: totalIncome, expense: totalSpent },
            ]}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 8 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} itemStyle={{ color: 'white' }} formatter={(value) => formatCurrency(Number(value) || 0, financial)} />
              <Legend iconSize={8} layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: '12px' }} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={1.5} name="Ingresos" dot={{ fill: '#10b981', r: 2.5 }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={1.5} name="Gastos" dot={{ fill: '#ef4444', r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}