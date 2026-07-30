'use client';

import { useEffect, useState } from 'react';
import { Building2, MapPin, Calendar, DollarSign, TrendingUp, MoreVertical, Inbox } from 'lucide-react';
import { offlineDB, LocalProject } from '@/lib/db/offlineStore';
import EmptyState from '@/components/ui/EmptyState';

const statusColors = {
  planning: { bg: 'rgba(59, 130, 246, 0.2)', text: 'rgb(147, 197, 253)', border: 'rgba(59, 130, 246, 0.3)' },
  execution: { bg: 'rgba(16, 185, 129, 0.2)', text: 'rgb(134, 239, 172)', border: 'rgba(16, 185, 129, 0.3)' },
  paused: { bg: 'rgba(245, 158, 11, 0.2)', text: 'rgb(253, 186, 116)', border: 'rgba(245, 158, 11, 0.3)' },
  completed: { bg: 'rgba(139, 92, 246, 0.2)', text: 'rgb(196, 181, 253)', border: 'rgba(139, 92, 246, 0.3)' }
};

const statusLabels = {
  planning: 'Planificación',
  execution: 'En Ejecución',
  paused: 'Pausado',
  completed: 'Completado'
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProjectOverview() {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await offlineDB.projects.toArray();
      setProjects(data.filter(p => p.status === 'execution' || p.status === 'planning'));
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2 mb-6">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>Proyectos Activos</span>
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-2 bg-white/10 rounded-full w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2 mb-6">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>Proyectos Activos</span>
        </h2>
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-white/30" />}
          title="No hay proyectos activos"
          description="Cree un nuevo proyecto desde la sección Gestión de Proyectos para comenzar."
        />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>Proyectos Activos</span>
        </h2>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="glass-card p-4 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-cyan-400">{project.code}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium border"
                    style={{
                      background: statusColors[project.status].bg,
                      color: statusColors[project.status].text,
                      borderColor: statusColors[project.status].border
                    }}
                  >
                    {statusLabels[project.status]}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-1">{project.name}</h3>
                <p className="text-sm text-white/60">{project.client_name}</p>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <MoreVertical className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-white/40" />
                <span className="text-white/70">{project.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-white/40" />
                <span className="text-white/70">{project.estimated_end_date || '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">{formatCurrency(project.total_budget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">{project.duration_days} días</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
