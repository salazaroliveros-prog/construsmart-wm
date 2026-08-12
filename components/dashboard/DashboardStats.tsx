'use client';

import React from 'react';
import { Building2, DollarSign, TrendingUp, Users, Hammer, Target } from 'lucide-react';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { calculateDashboardStats } from '@/lib/utils/summaryCalculations';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useBusinessSettings } from '@/lib/hooks/useBusinessSettings';
import StatCard from '@/components/ui/StatCard';

interface DashboardStatsProps {
  selectedProject?: string;
}

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
            <StatCard
              title="Proyectos Activos"
              value={activeProjects.length.toString()}
              subtitle={`${projects.length} total`}
              icon={<Building2 className="w-4 h-4" />}
              color="cyan"
            />
            <StatCard
              title="Presupuesto Total"
              value={formatCurrency(totalBudget, financial)}
              subtitle="Todos los proyectos"
              icon={<DollarSign className="w-4 h-4" />}
              color="emerald"
            />
            <StatCard
              title="Costo Real"
              value={formatCurrency(totalSpent, financial)}
              subtitle={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% presup.` : 'Sin presupuesto'}
              icon={<TrendingUp className="w-4 h-4" />}
              color="violet"
            />
            <StatCard
              title="Empleados"
              value={activeEmployees.toString()}
              subtitle={`${employees.length} registrados`}
              icon={<Users className="w-4 h-4" />}
              color="amber"
            />
            <StatCard
              title="Stock Bajo"
              value={lowStockItems.toString()}
              subtitle={`${stock.length} items`}
              icon={<Hammer className="w-4 h-4" />}
              color="red"
            />
            <StatCard
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
