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

export default function ProjectManager() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<LocalProject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isOnline, setIsOnline] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalProject | null>(null);

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
    checkOnlineStatus();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const loadProjects = async () => {
    try {
      const localProjects = await offlineDB.projects.toArray();
      setProjects(localProjects);
      
      // If online, try to sync with Supabase
      if (navigator.onLine && supabase) {
        const { data: supabaseProjects } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (supabaseProjects) {
          // Merge or update local projects
          for (const project of supabaseProjects) {
            await offlineDB.projects.put({
              ...project,
              sync_status: 'synced',
            });
          }
          
          // Reload projects after sync
          const updatedProjects = await offlineDB.projects.toArray();
          setProjects(updatedProjects);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
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
        code: `PROJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
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
  };

  const handleSaveProject = async () => {
    try {
      // Calculate duration days if dates are provided
      let durationDays = formData.duration_days;
      if (formData.start_date && formData.estimated_end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.estimated_end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const projectData: LocalProject = {
        ...formData,
        duration_days: durationDays,
        sync_status: isOnline ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
      };

      if (editingProject) {
        // Update existing project in localStorage
        await offlineDB.projects.update(editingProject.id!, {
          ...projectData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });
        
        // Update in Supabase if online
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
            // Keep sync_status as updated_offline if failed
            await offlineDB.projects.update(editingProject.id!, {
              sync_status: 'updated_offline',
            });
          }
        }
      } else {
        // Create new project in localStorage
        const id = await offlineDB.projects.add(projectData);
        
        // Create in Supabase if online
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
            // Keep as created_offline
          } else if (data) {
            // Update local record with server ID
            await offlineDB.projects.update(id, {
              id: data.id,
              sync_status: 'synced',
            });
          }
        }
      }

      await loadProjects();
      handleCloseModal();
      showToast(
        'success',
        editingProject
          ? `Proyecto "${projectData.name}" actualizado`
          : `Proyecto "${projectData.name}" creado`
      );
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
        if (error) console.error('Error deleting project from Supabase:', error);
      }
      
      await loadProjects();
      showToast('info', `Proyecto "${project.name}" eliminado`);
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('error', 'Error al eliminar el proyecto');
    }
  };

  const calculateEstimatedBudget = (area: number, quality: string) => {
    const qualityRates = {
      basic: 3250, // Average of 3000-3500
      moderate: 3750, // Average of 3500-4000
      premium: 4500, // Average of 4000-5000
    };
    
    return area * qualityRates[quality as keyof typeof qualityRates];
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">📋</span>
          </span>
          <span>Gestión de Proyectos</span>
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${isOnline ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
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

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12" />}
          title={projects.length === 0 ? "No hay proyectos" : "Sin resultados"}
          description={projects.length === 0 ? "Cree su primer proyecto para comenzar a gestionar." : "Intente con otros términos de búsqueda o filtros."}
          action={projects.length === 0 ? (
            <button
              onClick={() => handleOpenModal()}
              className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Nuevo Proyecto
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
              {filteredProjects.map((project) => (
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
                        background: statusColors[project.status].bg,
                        color: statusColors[project.status].text,
                        borderColor: statusColors[project.status].border
                      }}
                    >
                      {statusLabels[project.status]}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="text-xs text-white/60 mb-1 block">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Nombre del Cliente</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Teléfono del Cliente</label>
                <input
                  type="text"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Email del Cliente</label>
                <input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Ubicación</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tipología</label>
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
                <label className="text-xs text-white/60 mb-1 block">Área (m²)</label>
                <input
                  type="number"
                  value={formData.area_m2}
                  onChange={(e) => {
                    const area = Number(e.target.value);
                    setFormData({ 
                      ...formData, 
                      area_m2: area,
                      duration_days: formData.duration_days,
                      total_budget: calculateEstimatedBudget(area, formData.quality_level)
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Nivel de Calidad</label>
                <select
                  value={formData.quality_level}
                  onChange={(e) => {
                    const quality = e.target.value;
                    setFormData({ 
                      ...formData, 
                      quality_level: quality as ProjectFormData['quality_level'],
                      duration_days: formData.duration_days,
                      total_budget: calculateEstimatedBudget(formData.area_m2, quality)
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="basic">Básico (Q.3,000-3,500/m²)</option>
                  <option value="moderate">Moderado (Q.3,500-4,000/m²)</option>
                  <option value="premium">Premium (Q.4,000-5,000/m²)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectFormData['status'], duration_days: formData.duration_days })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="planning">Planificación</option>
                  <option value="execution">En Ejecución</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fecha de Inicio</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value, duration_days: formData.duration_days })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fecha Estimada de Finalización</label>
                <input
                  type="date"
                  value={formData.estimated_end_date}
                  onChange={(e) => setFormData({ ...formData, estimated_end_date: e.target.value, duration_days: formData.duration_days })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Duración (días)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block">Presupuesto Estimado</label>
                <div className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(formData.total_budget)}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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
        title="Eliminar proyecto"
        message={`¿Está seguro de eliminar el proyecto "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteConfirm) handleDeleteProject(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
