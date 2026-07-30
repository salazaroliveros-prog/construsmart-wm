'use client';

import React from 'react';

import { Building2, DollarSign, TrendingUp, Users, Hammer, Calendar } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MemoizedStatCard
        title="Proyectos Activos"
        value="12"
        subtitle="3 en ejecución"
        icon={<Building2 className="w-5 h-5 text-cyan-400" />}
        trend="+2"
        trendUp={true}
      />
      <MemoizedStatCard
        title="Presupuesto Total"
        value="Q. 4.2M"
        subtitle="Este mes"
        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        trend="+12%"
        trendUp={true}
      />
      <MemoizedStatCard
        title="Costo Real"
        value="Q. 3.8M"
        subtitle="90.5% del presupuesto"
        icon={<TrendingUp className="w-5 h-5 text-violet-400" />}
        trend="+8%"
        trendUp={true}
      />
      <MemoizedStatCard
        title="Empleados"
        value="45"
        subtitle="Operativos activos"
        icon={<Users className="w-5 h-5 text-amber-400" />}
        trend="+3"
        trendUp={true}
      />
      <MemoizedStatCard
        title="Tareas Pendientes"
        value="23"
        subtitle="Esta semana"
        icon={<Hammer className="w-5 h-5 text-red-400" />}
        trend="-5"
        trendUp={false}
      />
      <MemoizedStatCard
        title="Próxima Entrega"
        value="15 días"
        subtitle="Residencial Villa Real"
        icon={<Calendar className="w-5 h-5 text-cyan-400" />}
      />
    </div>
  );
}
