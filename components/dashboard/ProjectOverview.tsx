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
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '1rem'
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgb(34, 211, 238)' }}>{project.code}</span>
                  <span 
                    style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid',
                      background: statusColors[project.status].bg,
                      color: statusColors[project.status].text,
                      borderColor: statusColors[project.status].border
                    }}
                  >
                    {statusLabels[project.status]}
                  </span>
                </div>
                <h3 style={{ color: 'white', fontWeight: 500, marginBottom: '0.25rem' }}>{project.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>{project.client}</p>
              </div>
              <button 
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <MoreVertical style={{ width: '1rem', height: '1rem', color: 'rgba(255, 255, 255, 0.4)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <MapPin style={{ width: '1rem', height: '1rem', color: 'rgba(255, 255, 255, 0.4)' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{project.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Calendar style={{ width: '1rem', height: '1rem', color: 'rgba(255, 255, 255, 0.4)' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{project.endDate}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign style={{ width: '1rem', height: '1rem', color: 'rgb(52, 211, 153)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>{formatCurrency(project.budget)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp style={{ width: '1rem', height: '1rem', color: 'rgb(139, 92, 246)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>{project.progress}%</span>
              </div>
            </div>

            <div style={{ 
              marginTop: '0.75rem', 
              height: '0.5rem', 
              background: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '9999px', 
              overflow: 'hidden' 
            }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  transition: 'all 0.5s',
                  width: `${project.progress}%`,
                  background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(139, 92, 246))'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
