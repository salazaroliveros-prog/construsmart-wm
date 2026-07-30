'use client';

import React, { useEffect, useState } from 'react';

import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar } from 'lucide-react';
import { offlineDB, LocalProject, LocalFinancialTransaction, LocalPayrollEmployee, LocalWarehouseStock } from '@/lib/db/offlineStore';

// Mobile-responsive dashboard stats component with real data
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
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      padding: '1rem',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: trendUp ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            background: trendUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px'
          }}>
            <TrendingUp style={{ width: '0.75rem', height: '0.75rem', transform: !trendUp ? 'rotate(180deg)' : 'none' }} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem', textShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: 'rgb(34, 211, 238)' }}>{subtitle}</p>
    </div>
  );
}

const MemoizedStatCard = React.memo(StatCard);

export default function DashboardStats() {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [employees, setEmployees] = useState<LocalPayrollEmployee[]>([]);
  const [stockItems, setStockItems] = useState<LocalWarehouseStock[]>([]);

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
    }
  };

  // Calculate real statistics
  const activeProjects = projects.filter(p => p.status === 'execution' || p.status === 'planning');
  const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.total_cost || 0), 0);
  const activeEmployees = employees.filter(e => e.active).length;
  const lowStockItems = stockItems.filter(s => s.current_stock <= s.minimum_threshold).length;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MemoizedStatCard
        title="Proyectos Activos"
        value={activeProjects.length.toString()}
        subtitle={`${projects.length} total`}
        icon={<Building2 className="w-5 h-5 text-cyan-400" />}
      />
      <MemoizedStatCard
        title="Presupuesto Total"
        value={formatCurrency(totalBudget)}
        subtitle="Todos los proyectos"
        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
      />
      <MemoizedStatCard
        title="Costo Real"
        value={formatCurrency(totalSpent)}
        subtitle={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% del presupuesto` : 'Sin presupuesto'}
        icon={<TrendingUp className="w-5 h-5 text-violet-400" />}
      />
      <MemoizedStatCard
        title="Empleados"
        value={activeEmployees.toString()}
        subtitle={`${employees.length} registrados`}
        icon={<Users className="w-5 h-5 text-amber-400" />}
      />
      <MemoizedStatCard
        title="Stock Bajo"
        value={lowStockItems.toString()}
        subtitle={`${stockItems.length} items totales`}
        icon={<Hammer className="w-5 h-5 text-red-400" />}
      />
      <MemoizedStatCard
        title="Transacciones"
        value={transactions.length.toString()}
        subtitle="Últimos 30 días"
        icon={<Calendar className="w-5 h-5 text-cyan-400" />}
      />
    </div>
  );
}
