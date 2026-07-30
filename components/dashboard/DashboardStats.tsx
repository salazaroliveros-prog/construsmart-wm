'use client';

import React, { useEffect, useState } from 'react';
import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalPayrollEmployee, LocalWarehouseStock } from '@/lib/db/offlineStore';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="glass-card p-3 sm:p-4 rounded-xl transition-all hover:bg-white/5 flex flex-col gap-1.5 sm:gap-2">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${
            trendUp
              ? 'text-green-400 bg-green-400/10'
              : 'text-red-400 bg-red-400/10'
          }`}>
            <TrendingUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${!trendUp ? 'rotate-180' : ''}`} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[10px] sm:text-xs font-medium text-gray-400 mb-0.5 sm:mb-1">{title}</h3>
        <p className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">{value}</p>
        <p className="text-[10px] sm:text-xs text-cyan-400">{subtitle}</p>
      </div>
    </div>
  );
}

const MemoizedStatCard = React.memo(StatCard);

export default function DashboardStats() {
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

  const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Q. 0';
    }
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4" style={{ display: 'grid' }}>
        {!isLoading ? (
        <>
          <MemoizedStatCard
            title="Proyectos Activos"
            value={activeProjects.length.toString()}
            subtitle={`${projects.length} total`}
            icon={<Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />}
          />
          <MemoizedStatCard
            title="Presupuesto Total"
            value={formatCurrency(totalBudget)}
            subtitle="Todos los proyectos"
            icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          />
          <MemoizedStatCard
            title="Costo Real"
            value={formatCurrency(totalSpent)}
            subtitle={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% del presupuesto` : 'Sin presupuesto'}
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />}
          />
          <MemoizedStatCard
            title="Empleados"
            value={activeEmployees.toString()}
            subtitle={`${employees.length} registrados`}
            icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
          />
          <MemoizedStatCard
            title="Stock Bajo"
            value={lowStockItems.toString()}
            subtitle={`${stockItems.length} items totales`}
            icon={<Hammer className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
          />
          <MemoizedStatCard
            title="Transacciones"
            value={transactions.length.toString()}
            subtitle="Últimos 30 días"
            icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />}
          />
        </>
      ) : (
        <>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-3 sm:p-4 rounded-xl animate-pulse">
              <div className="h-6 sm:h-8 bg-white/10 rounded mb-1 sm:mb-2 w-1/2"></div>
              <div className="h-4 sm:h-6 bg-white/10 rounded mb-1 w-3/4"></div>
              <div className="h-3 sm:h-4 bg-white/10 rounded w-1/3"></div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
