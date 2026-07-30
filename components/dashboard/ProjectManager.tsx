'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, FolderOpen } from 'lucide-react';
import { offlineDB, LocalProject } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

interface ProjectFormData {
  code: string;
  name: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  location: string;
  typology: 'residential' | 'commercial' | 'industrial' | 'civil' | 'public';
  area_m2: number;
  quality_level: 'basic' | 'moderate' | 'premium';
  status: 'planning' | 'execution' | 'paused' | 'completed';
  start_date?: string;
  estimated_end_date?: string;
  duration_days: number;
  total_budget: number;
}

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

export default function ProjectManager() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<LocalProject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isOnline, setIsOnline] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<ProjectFormData>({
    code: '',
    name: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    location: '',
    typology: 'residential',
    area_m2: 0,
    quality_level: 'moderate',
    status: 'planning',
    start_date: '',
    estimated_end_date: '',
    duration_days: 0,
    total_budget: 0,
  });

  useEffect(() => {
    loadProjects();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProjects = async () => {
    try {
      const data = await offlineDB.projects.toArray();
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (project?: LocalProject) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        code: project.code,
        name: project.name,
        client_name: project.client_name,
        client_phone: project.client_phone || '',
        client_email: project.client_email || '',
        location: project.location,
        typology: project.typology,
        area_m2: project.area_m2,
        quality_level: project.quality_level,
        status: project.status,
        start_date: project.start_date || '',
        estimated_end_date: project.estimated_end_date || '',
        duration_days: project.duration_days,
        total_budget: project.total_budget,
      });
    } else {
      setEditingProject(null);
      setFormData({
        code: '',
        name: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        location: '',
        typology: 'residential',
        area_m2: 0,
        quality_level: 'moderate',
        status: 'planning',
        start_date: '',
        estimated_end_date: '',
        duration_days: 0,
        total_budget: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = async () => {
    try {
      const projectData: LocalProject = {
        ...formData,
        sync_status: isOnline ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
      };

      if (editingProject) {
        await offlineDB.projects.update(editingProject.id!, {
          ...projectData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });

        if (isOnline && editingProject.id && supabase) {
          const { error } = await supabase
            .from('projects')
            .update({
              code: projectData.code,
              name: projectData.name,
              client_name: projectData.client_name,
              client_phone: projectData.client_phone,
              client_email: projectData.client_email,
              location: projectData.location,
              typology: projectData.typology,
              area_m2: projectData.area_m2,
              quality_level: projectData.quality_level,
              status: projectData.status,
              start_date: projectData.start_date,
              estimated_end_date: projectData.estimated_end_date,
              duration_days: projectData.duration_days,
              total_budget: projectData.total_budget,
            })
            .eq('id', editingProject.id);

          if (error) {
            console.error('Error updating project in Supabase:', error);
            await offlineDB.projects.update(editingProject.id!, {
              sync_status: 'updated_offline',
            });
          }
        }
        showToast('success', 'Proyecto actualizado');
      } else {
        const id = await offlineDB.projects.add(projectData);

        if (isOnline && supabase) {
          const { data, error } = await supabase
            .from('projects')
            .insert({
              code: projectData.code,
              name: projectData.name,
              client_name: projectData.client_name,
              client_phone: projectData.client_phone,
              client_email: projectData.client_email,
              location: projectData.location,
              typology: projectData.typology,
              area_m2: projectData.area_m2,
              quality_level: projectData.quality_level,
              status: projectData.status,
              start_date: projectData.start_date,
              estimated_end_date: projectData.estimated_end_date,
              duration_days: projectData.duration_days,
              total_budget: projectData.total_budget,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating project in Supabase:', error);
          } else if (data) {
            await offlineDB.projects.update(id, { id: data.id, sync_status: 'synced' });
          }
        }
        showToast('success', 'Proyecto creado exitosamente');
      }

      await loadProjects();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving project:', error);
      showToast('error', 'Error al guardar el proyecto');
    }
  };

  const handleDeleteProject = async (project: LocalProject) => {
    try {
      await offlineDB.projects.delete(project.id!);

      if (isOnline && project.id && supabase) {
        const { error } = await supabase.from('projects').delete().eq('id', project.id);
        if (error) console.error('Error deleting from Supabase:', error);
      }

      showToast('success', 'Proyecto eliminado');
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('error', 'Error al eliminar el proyecto');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center space-x-2">
          <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span>Gestión de Proyectos</span>
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="glass-button-inline px-3 sm:px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Todos los estados</option>
          <option value="planning">Planificación</option>
          <option value="execution">En Ejecución</option>
          <option value="paused">Pausado</option>
          <option value="completed">Completado</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12" />}
          title={projects.length === 0 ? "No hay proyectos" : "Sin resultados"}
          description={projects.length === 0 ? "Cree su primer proyecto para comenzar a gestionar." : "Intente con otros términos de búsqueda o filtros."}
          action={projects.length === 0 ? (
            <button
              onClick={() => handleOpenModal()}
              className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proyecto</span>
            </button>
          ) : undefined}
        />
      ) : (
        <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm" style={{ minWidth: '600px' }}>
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/60 py-3 px-4">Código</th>
                <th className="text-left text-white/60 py-3 px-4">Nombre</th>
                <th className="text-left text-white/60 py-3 px-4">Cliente</th>
                <th className="text-left text-white/60 py-3 px-4">Ubicación</th>
                <th className="text-left text-white/60 py-3 px-4">Área</th>
                <th className="text-left text-white/60 py-3 px-4">Estado</th>
                <th className="text-left text-white/60 py-3 px-4">Presupuesto</th>
                <th className="text-left text-white/60 py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const status = project.status || 'planning';
                const colors = statusColors[status] || statusColors.planning;
                const label = statusLabels[status] || status;
                
                return (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-cyan-400 font-mono text-xs">{project.code}</td>
                    <td className="py-3 px-4 text-white font-medium">{project.name}</td>
                    <td className="py-3 px-4 text-white/70">{project.client_name}</td>
                    <td className="py-3 px-4 text-white/70">{project.location}</td>
                    <td className="py-3 px-4 text-white/70">{project.area_m2.toFixed(2)} m²</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium border"
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(project.total_budget)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(project)}
                          className="text-cyan-400 hover:text-cyan-300"
                          aria-label={`Editar proyecto ${project.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(project)}
                          className="text-red-400 hover:text-red-300"
                          aria-label={`Eliminar proyecto ${project.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-3 sm:mx-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Código</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/60 mb-1 block">Cliente</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Teléfono</label>
                <input
                  type="text"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Email</label>
                <input
                  type="text"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/60 mb-1 block">Ubicación</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tipo</label>
                <select
                  value={formData.typology}
                  onChange={(e) => setFormData({ ...formData, typology: e.target.value as ProjectFormData['typology'] })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="civil">Civil</option>
                  <option value="public">Público</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Nivel</label>
                <select
                  value={formData.quality_level}
                  onChange={(e) => setFormData({ ...formData, quality_level: e.target.value as ProjectFormData['quality_level'] })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="basic">Básico</option>
                  <option value="moderate">Moderado</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Área (m²)</label>
                <input
                  type="number"
                  value={formData.area_m2}
                  onChange={(e) => setFormData({ ...formData, area_m2: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Presupuesto (GTQ)</label>
                <input
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Días</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectFormData['status'] })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="planning">Planificación</option>
                  <option value="execution">En Ejecución</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4 sm:mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm hover:opacity-90 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Proyecto"
        message={`¿Está seguro de eliminar el proyecto "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteConfirm) handleDeleteProject(deleteConfirm); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
