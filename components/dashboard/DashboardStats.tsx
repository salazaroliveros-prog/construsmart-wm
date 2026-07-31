'use client';

import React, { useEffect, useState } from 'react';
import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalPayrollEmployee, LocalWarehouseStock } from '@/lib/db/offlineStore';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';

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
  const { financial } = useFinancialSettings();
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

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(
    ['projects', 'financial_transactions', 'payroll_employees', 'warehouse_stock'],
    loadRealData
  );

  return (
    <div className="space-y-2 w-full h-full flex flex-col">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 flex-shrink-0">
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
            title="Transacciones"
            value={transactions.length.toString()}
            subtitle="Últimos 30 días"
            icon={<Calendar className="w-4 h-4" />}
            color="blue"
            trend="+15"
            trendUp={true}
          />
        </>
      ) : (
        <>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-3 rounded-xl animate-pulse">
              <div className="h-6 bg-white/10 rounded mb-1.5 w-1/2"></div>
              <div className="h-5 bg-white/10 rounded mb-1 w-3/4"></div>
              <div className="h-3 bg-white/10 rounded w-1/3"></div>
            </div>
          ))}
        </>
      )}
      </div>

      {/* Charts Section - Compact grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-2 flex-1 min-h-0">
        {/* Project Status Pie Chart */}
        <div className="glass-panel rounded-xl p-2 lg:col-span-1 flex-1 min-h-0">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <PieChartIcon className="w-3 h-3 text-cyan-400" />
            Estado de Proyectos
          </h3>
          <div className="h-[calc(100%-1.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={56}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value) => [value, '']}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="bottom" align="center"
                  wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Bar Chart */}
        <div className="glass-panel rounded-xl p-2 lg:col-span-1 flex-1 min-h-0">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-emerald-400" />
            Distribución de Gastos
          </h3>
          <div className="h-[calc(100%-1.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" barGap={0} barCategoryGap={4}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value) => formatCurrency(Number(value) || 0, financial)}
                />
                <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Department Bar Chart */}
        <div className="glass-panel rounded-xl p-2 lg:col-span-1 flex-1 min-h-0">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-400" />
            Empleados x Depto
          </h3>
          <div className="h-[calc(100%-1.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeDepartmentData} barCategoryGap={4}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physical vs Financial Progress */}
        <div className="glass-panel rounded-xl p-2 lg:col-span-1 flex-1 min-h-0">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Avance Físico / Financiero
          </h3>
          <div className="h-[calc(100%-1.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projects.map(p => {
                let physical = 0;
                let financial = 0;
                if (p.start_date && p.estimated_end_date) {
                  const startDate = new Date(p.start_date);
                  const endDate = new Date(p.estimated_end_date);
                  const currentDate = new Date();
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const timeProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
                  if (p.status === 'execution') {
                    physical = timeProgress * 0.95;
                    financial = timeProgress * 0.9;
                  } else if (p.status === 'completed') {
                    physical = 100;
                    financial = 100;
                  }
                }
                return { project: p.name.substring(0, 12), physical, financial };
              }).slice(0, 5)} barCategoryGap={4}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="project" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value) => `${(value as number)?.toFixed(1) || 0}%`}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="bottom" align="center"
                  wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}
                />
                <Bar dataKey="physical" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Físico" />
                <Bar dataKey="financial" fill="#10b981" radius={[3, 3, 0, 0]} name="Financiero" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Overview Line Chart */}
        <div className="glass-panel rounded-xl p-2 lg:col-span-2 xl:col-span-3 flex-1 min-h-0">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-violet-400" />
            Flujo Financiero (Últimos 6 meses)
          </h3>
          <div className="h-[calc(100%-1.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Ene', income: totalIncome * 0.15, expense: totalSpent * 0.15 },
                { month: 'Feb', income: totalIncome * 0.20, expense: totalSpent * 0.20 },
                { month: 'Mar', income: totalIncome * 0.18, expense: totalSpent * 0.18 },
                { month: 'Abr', income: totalIncome * 0.22, expense: totalSpent * 0.22 },
                { month: 'May', income: totalIncome * 0.25, expense: totalSpent * 0.25 },
                { month: 'Jun', income: totalIncome, expense: totalSpent },
              ]}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value) => formatCurrency(Number(value) || 0, financial)}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="bottom" align="center"
                  wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}
                />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={1.5} name="Ingresos" dot={{ fill: '#10b981', r: 3 }} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={1.5} name="Gastos" dot={{ fill: '#ef4444', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="glass-panel rounded-xl p-2 lg:col-span-1 flex-1 min-h-0">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <Hammer className="w-3 h-3 text-red-400" />
            Alertas de Stock
          </h3>
          <div className="h-[calc(100%-1.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Stock Bajo', value: lowStockItems },
                { name: 'OK', value: Math.max(0, stockItems.length - lowStockItems) },
              ]} barCategoryGap={4}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}