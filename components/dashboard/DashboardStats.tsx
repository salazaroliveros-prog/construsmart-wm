'use client';

import React from 'react';
import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar, Target } from 'lucide-react';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { calculateDashboardStats } from '@/lib/utils/summaryCalculations';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useBusinessSettings } from '@/lib/hooks/useBusinessSettings';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

interface DashboardStatsProps {
  selectedProject?: string;
}

const colorClasses: Record<string, string> = {
  cyan: 'text-cyan-400 bg-cyan-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  violet: 'text-violet-400 bg-violet-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  red: 'text-red-400 bg-red-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
};

function StatCard({ title, value, subtitle, icon, trend, trendUp, color = 'cyan' }: StatCardProps) {
  return (
    <div className="glass-card p-2 sm:p-2.5 rounded-lg transition-all active:bg-white/5 flex flex-col gap-1 touch-manipulation">
      <div className="flex items-center justify-between">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.cyan}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded-md border ${
            trendUp
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
              : 'text-red-400 bg-red-400/10 border-red-500/30'
          }`}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[10px] sm:text-xs font-medium text-white/50 mb-0.5 truncate">{title}</h3>
        <p className="text-sm sm:text-base font-bold text-white drop-shadow-lg truncate">{value}</p>
        <p className="text-[10px] sm:text-xs text-white/40 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

const MemoizedStatCard = React.memo(StatCard);

export default function DashboardStats({ selectedProject = 'all' }: DashboardStatsProps) {
  const { financial } = useFinancialSettings();
  const { settings } = useBusinessSettings();
  const { projects, transactions, employees, stock, loading } = useDashboardData();

  const stats = calculateDashboardStats({
    projects,
    transactions,
    employees,
    stockItems: stock,
    settings,
    selectedProject,
  });

  const { visibleProjects, visibleTransactions, activeProjects, totalBudget, totalSpent, activeEmployees, lowStockItems, utilityMargin } = stats;

  return (
    <div className="flex flex-col w-full h-full gap-2">
      {/* KPI Cards - mobile-first: 2 columnas en móvil para mejor legibilidad */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 flex-shrink-0 w-full mx-auto max-w-7xl">
        {!loading ? (
          <>
            <MemoizedStatCard
              title="Proyectos Activos"
              value={activeProjects.length.toString()}
              subtitle={`${projects.length} total`}
              icon={<Building2 className="w-4 h-4" />}
              color="cyan"
            />
            <MemoizedStatCard
              title="Presupuesto Total"
              value={formatCurrency(totalBudget, financial)}
              subtitle="Todos los proyectos"
              icon={<DollarSign className="w-4 h-4" />}
              color="emerald"
            />
            <MemoizedStatCard
              title="Costo Real"
              value={formatCurrency(totalSpent, financial)}
              subtitle={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% presup.` : 'Sin presupuesto'}
              icon={<TrendingUp className="w-4 h-4" />}
              color="violet"
            />
            <MemoizedStatCard
              title="Empleados"
              value={activeEmployees.toString()}
              subtitle={`${employees.length} registrados`}
              icon={<Users className="w-4 h-4" />}
              color="amber"
            />
            <MemoizedStatCard
              title="Stock Bajo"
              value={lowStockItems.toString()}
              subtitle={`${stock.length} items`}
              icon={<Hammer className="w-4 h-4" />}
              color="red"
            />
            <MemoizedStatCard
              title="Margen Utilidad"
              value={`${utilityMargin.marginPercentage.toFixed(1)}%`}
              subtitle={`Objetivo: ${utilityMargin.targetMargin}%`}
              icon={<Target className="w-4 h-4" />}
              color={utilityMargin.isOnTarget ? 'emerald' : utilityMargin.variance > 0 ? 'cyan' : 'red'}
              trend={utilityMargin.variance > 0 ? `+${utilityMargin.variance.toFixed(1)}%` : `${utilityMargin.variance.toFixed(1)}%`}
              trendUp={utilityMargin.variance >= 0}
            />
          </>
        ) : (
          <>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-2 rounded-lg animate-pulse">
                <div className="h-3 bg-white/10 rounded w-1/3 mb-1" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
