'use client';

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
    <div 
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        e.currentTarget.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{
          padding: '0.75rem',
          borderRadius: '0.75rem',
          background: 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          transition: 'all 0.3s'
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 500, color: trendUp ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)' }}>
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

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Proyectos Activos"
        value="12"
        subtitle="3 en ejecución"
        icon={<Building2 className="w-5 h-5 text-cyan-400" />}
        trend="+2"
        trendUp={true}
      />
      <StatCard
        title="Presupuesto Total"
        value="Q. 4.2M"
        subtitle="Este mes"
        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        trend="+15%"
        trendUp={true}
      />
      <StatCard
        title="Progreso Promedio"
        value="67%"
        subtitle="Todos los proyectos"
        icon={<TrendingUp className="w-5 h-5 text-violet-400" />}
        trend="+5%"
        trendUp={true}
      />
      <StatCard
        title="Personal Activo"
        value="48"
        subtitle="En obra"
        icon={<Users className="w-5 h-5 text-amber-400" />}
        trend="+3"
        trendUp={true}
      />
      <StatCard
        title="Tareas Pendientes"
        value="23"
        subtitle="Esta semana"
        icon={<Hammer className="w-5 h-5 text-red-400" />}
        trend="-5"
        trendUp={false}
      />
      <StatCard
        title="Próxima Entrega"
        value="15 días"
        subtitle="Residencial Villa Real"
        icon={<Calendar className="w-5 h-5 text-cyan-400" />}
      />
    </div>
  );
}
