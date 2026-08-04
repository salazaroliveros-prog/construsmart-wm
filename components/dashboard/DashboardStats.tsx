'use client';

import React, { useEffect, useState } from 'react';
import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar, Target } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalPayrollEmployee, LocalWarehouseStock } from '@/lib/db/offlineStore';
import { useFinancialSettings, formatCurrency, calculateUtilityMarginHelper } from '@/lib/hooks/useBusinessSettings';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
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
          <div className={`flex items-center gap-0.5 text-[9px] px-1 py-0.25 rounded-md border ${
            trendUp
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
              : 'text-red-400 bg-red-400/10 border-red-500/30'
          }`}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[9px] sm:text-[10px] font-medium text-white/50 mb-0.5 truncate">{title}</h3>
        <p className="text-sm sm:text-base font-bold text-white drop-shadow-lg truncate">{value}</p>
        <p className="text-[8px] sm:text-[9px] text-white/40 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

const MemoizedStatCard = React.memo(StatCard);

export default function DashboardStats() {
  const { financial } = useFinancialSettings();
  const { settings } = useBusinessSettings();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [employees, setEmployees] = useState<LocalPayrollEmployee[]>([]);
  const [stockItems, setStockItems] = useState<LocalWarehouseStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      const [localProjects, localTransactions, localEmployees, localStock] = await Promise.all([
        offlineDB.projects.toArray(),
        offlineDB.financialTransactions.toArray(),
        offlineDB.payrollEmployees.toArray(),
        offlineDB.warehouseStock.toArray()
      ]);

      setProjects(localProjects);
      setTransactions(localTransactions);
      setEmployees(localEmployees);
      setStockItems(localStock);
    } catch (error) {
      console.error('Error loading real data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'execution' || p.status === 'planning');
  const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.total_cost || 0), 0);
  const activeEmployees = employees.filter(e => e.active).length;
  const lowStockItems = stockItems.filter(s => s.current_stock <= s.minimum_threshold).length;

  // Calculate utility margin dynamically from settings
  const utilityMargin = calculateUtilityMarginHelper(totalBudget, totalSpent, settings);

  useRealtimeRefresh(
    ['projects', 'financial_transactions', 'payroll_employees', 'warehouse_stock'],
    loadRealData
  );

  return (
    <div className="flex flex-col w-full h-full gap-2">
      {/* KPI Cards - mobile-first: 3 columnas en móvil */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1 flex-shrink-0">
        {!isLoading ? (
          <>
            <MemoizedStatCard
              title="Proyectos Activos"
              value={activeProjects.length.toString()}
              subtitle={`${projects.length} total`}
              icon={<Building2 className="w-4 h-4" />}
              color="cyan"
              trend={activeProjects.length > 0 ? '+2' : undefined}
              trendUp={true}
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
              trend={totalBudget > 0 ? '+12%' : undefined}
              trendUp={true}
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
              subtitle={`${stockItems.length} items`}
              icon={<Hammer className="w-4 h-4" />}
              color="red"
              trend={lowStockItems > 0 ? '+3' : undefined}
              trendUp={false}
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
