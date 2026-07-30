'use client';

import { Building2, MapPin, Calendar, DollarSign, TrendingUp, MoreVertical } from 'lucide-react';

interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  progress: number;
  budget: number;
  status: 'planning' | 'execution' | 'paused' | 'completed';
  endDate: string;
}

const projects: Project[] = [
  {
    id: '1',
    code: 'PROJ-2024-001',
    name: 'Residencial Villa Real',
    client: 'Grupo Inmobiliario GT',
    location: 'Zona 10, Ciudad de Guatemala',
    progress: 75,
    budget: 2500000,
    status: 'execution',
    endDate: '2024-09-15'
  },
  {
    id: '2',
    code: 'PROJ-2024-002',
    name: 'Oficinas Corporativas Centro',
    client: 'Tech Solutions SA',
    location: 'Zona 4, Ciudad de Guatemala',
    progress: 45,
    budget: 1800000,
    status: 'execution',
    endDate: '2024-11-30'
  },
  {
    id: '3',
    code: 'PROJ-2024-003',
    name: 'Complejo Industrial Mixco',
    client: 'Manufacturas del Norte',
    location: 'Mixco, Guatemala',
    progress: 20,
    budget: 3200000,
    status: 'execution',
    endDate: '2025-02-28'
  }
];

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
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>Proyectos Activos</span>
        </h2>
        <button className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 hover:text-cyan-200">
          Ver Todos
        </button>
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
                <p className="text-sm text-white/60">{project.client}</p>
              </div>
              <button 
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
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
                <span className="text-white/70">{project.endDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">{formatCurrency(project.budget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">{project.progress}%</span>
              </div>
            </div>

            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-violet-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
