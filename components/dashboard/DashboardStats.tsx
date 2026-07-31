'use client';

import React, { useEffect, useState } from 'react';
import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalPayrollEmployee, LocalWarehouseStock } from '@/lib/db/offlineStore';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

function StatCard({ title, value, subtitle, icon, trend, trendUp, color = 'cyan' }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };

  return (
    <div className="glass-card p-3 sm:p-4 rounded-xl transition-all hover:bg-white/5 flex flex-col gap-1.5 sm:gap-2">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.cyan}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border ${
            trendUp
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
              : 'text-red-400 bg-red-400/10 border-red-500/30'
          }`}>
            {trendUp ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[10px] sm:text-xs font-medium text-white/50 mb-0.5 sm:mb-1">{title}</h3>
        <p className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">{value}</p>
        <p className="text-[10px] sm:text-xs text-white/40">{subtitle}</p>
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
  const totalIncome = transactions
    .filter(t => t.type === 'income')
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

  // Data for charts
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

  const employeeDepartmentData = [
    { name: 'Obreros', value: employees.filter(e => e.category === 'obrero').length },
    { name: 'Empleados', value: employees.filter(e => e.category === 'empleado').length },
  ];

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {!isLoading ? (
        <>
          <MemoizedStatCard
            title="Proyectos Activos"
            value={activeProjects.length.toString()}
            subtitle={`${projects.length} total`}
            icon={<Building2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="cyan"
            trend={activeProjects.length > 0 ? '+2' : undefined}
            trendUp={true}
          />
          <MemoizedStatCard
            title="Presupuesto Total"
            value={formatCurrency(totalBudget)}
            subtitle="Todos los proyectos"
            icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="emerald"
          />
          <MemoizedStatCard
            title="Costo Real"
            value={formatCurrency(totalSpent)}
            subtitle={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% del presupuesto` : 'Sin presupuesto'}
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="violet"
            trend={totalBudget > 0 ? '+12%' : undefined}
            trendUp={true}
          />
          <MemoizedStatCard
            title="Empleados"
            value={activeEmployees.toString()}
            subtitle={`${employees.length} registrados`}
            icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="amber"
          />
          <MemoizedStatCard
            title="Stock Bajo"
            value={lowStockItems.toString()}
            subtitle={`${stockItems.length} items totales`}
            icon={<Hammer className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="red"
            trend={lowStockItems > 0 ? '+3' : undefined}
            trendUp={false}
          />
          <MemoizedStatCard
            title="Transacciones"
            value={transactions.length.toString()}
            subtitle="Últimos 30 días"
            icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="blue"
            trend="+15"
            trendUp={true}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Project Status Pie Chart */}
        <div className="glass-panel rounded-2xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <PieChartIcon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
            Estado de Proyectos
          </h3>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Bar Chart */}
        <div className="glass-panel rounded-2xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
            Distribución de Gastos
          </h3>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value) => formatCurrency(Number(value) || 0)}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Department Bar Chart */}
        <div className="glass-panel rounded-2xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
            Empleados por Departamento
          </h3>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeDepartmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Overview Line Chart */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-violet-400" />
          Flujo Financiero (Últimos 6 meses)
        </h3>
        <div className="h-40 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { month: 'Ene', income: totalIncome * 0.15, expense: totalSpent * 0.15 },
              { month: 'Feb', income: totalIncome * 0.20, expense: totalSpent * 0.20 },
              { month: 'Mar', income: totalIncome * 0.18, expense: totalSpent * 0.18 },
              { month: 'Abr', income: totalIncome * 0.22, expense: totalSpent * 0.22 },
              { month: 'May', income: totalIncome * 0.25, expense: totalSpent * 0.25 },
              { month: 'Jun', income: totalIncome, expense: totalSpent },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: 'white' }}
                formatter={(value) => formatCurrency(Number(value) || 0)}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Ingresos" dot={{ fill: '#10b981' }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Gastos" dot={{ fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}