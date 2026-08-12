'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Calendar, DollarSign, Inbox } from 'lucide-react';
import { offlineDB, LocalProject } from '@/lib/db/offlineStore';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { EmptyState } from '@/components/ui/EmptyState';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

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

export default function ProjectOverview() {
  const { financial } = useFinancialSettings();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const userId = await getUserScope();
      const data = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      setProjects(data.filter(p => p.status === 'execution' || p.status === 'planning'));
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeRefresh(['projects'], loadProjects);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [projects]);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-3 sm:p-4 h-full flex flex-col">
        <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 mb-2">
          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
          <span>Proyectos Activos</span>
        </h2>
        <div className="space-y-1.5 flex-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-2.5 rounded-lg animate-pulse">
              <div className="h-2.5 bg-white/10 rounded w-1/3 mb-1" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-3 sm:p-4 h-full flex flex-col">
        <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 mb-2">
          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
          <span>Proyectos Activos</span>
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Inbox className="w-6 h-6 text-white/30" />}
            title="No hay proyectos activos"
            description="Cree un nuevo proyecto desde Gestión de Proyectos."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4 h-full flex flex-col">
      <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 mb-2">
        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
        <span>Proyectos Activos</span>
      </h2>

      <div className="space-y-1.5 flex-1 overflow-y-auto overflow-anchor-none overscroll-contain" ref={scrollRef}>
        {projects.map((project) => {
          const status = project.status || 'planning';
          const colors = statusColors[status] || statusColors.planning;
          const label = statusLabels[status] || status;

          return (
            <div
              key={project.id}
              className="glass-card p-2.5 rounded-lg transition-all active:bg-white/5 touch-manipulation"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono text-cyan-400 truncate">{project.code}</span>
                    <span
                      className="px-1.5 py-0.25 rounded-full text-[9px] font-medium border flex-shrink-0"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        borderColor: colors.border
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <h3 className="text-white font-medium text-xs truncate">{project.name}</h3>
                  <p className="text-[10px] text-white/60 truncate">{project.client_name}</p>
                </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <Calendar className="w-3 h-3 text-white/40 flex-shrink-0" />
                    <span className="text-[10px] text-white/70">{project.duration_days}d</span>
                    <DollarSign className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-[10px] font-medium text-white truncate">{formatCurrency(project.total_budget, financial)}</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
