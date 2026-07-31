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

const typologyLabels = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  civil: 'Civil',
  public: 'Público'
};

const qualityLabels = {
  basic: 'Básico (Q.3,000-3,500/m²)',
  moderate: 'Moderado (Q.3,500-4,000/m²)',
  premium: 'Premium (Q.4,000-5,000/m²)'
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
  const [saveLoading, setSaveLoading] = useState(false);

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
    total_budget: 0
  });

  useEffect(() => {
    loadProjects();
    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const loadProjects = async () => {
    try {
      const localProjects = await offlineDB.projects.toArray();
      setProjects(localProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('error', 'Error al cargar proyectos');
    }
  };

  const resetForm = () => {
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
      total_budget: 0
    });
    setEditingProject(null);
  };

  const openModal = (project?: LocalProject) => {
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
        quality_level: project.quality_level || 'moderate',
        status: project.status,
        start_date: project.start_date || '',
        estimated_end_date: project.estimated_end_date || '',
        duration_days: project.duration_days,
        total_budget: project.total_budget
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const projectData: LocalProject = {
        id: editingProject?.id || crypto.randomUUID(),
        ...formData,
        sync_status: isOnline ? 'synced' : 'created_offline',
        created_at: editingProject?.created_at || new Date().toISOString()
      };

      if (editingProject) {
        await offlineDB.projects.update(editingProject.id, projectData);
        showToast('success', 'Proyecto actualizado exitosamente');
      } else {
        await offlineDB.projects.add(projectData);
        showToast('success', 'Proyecto creado exitosamente');
      }

      closeModal();
      loadProjects();

      if (isOnline && supabase) {
        // Sync with Supabase
        const { error } = await supabase.from('projects').upsert([projectData]);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving project:', error);
      showToast('error', 'Error al guardar el proyecto');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (project: LocalProject) => {
    setDeleteConfirm(project);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await offlineDB.projects.delete(deleteConfirm.id);
      showToast('success', 'Proyecto eliminado exitosamente');
      loadProjects();

      if (isOnline && supabase) {
        await supabase.from('projects').delete().eq('id', deleteConfirm.id);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('error', 'Error al eliminar el proyecto');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Gestión de Proyectos
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Administre su portafolio de proyectos constructivos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
              isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isOnline ? '🟢 En línea' : '🟡 Sin conexión'}
            </div>
            <button
              onClick={() => openModal()}
              className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="planning">Planificación</option>
            <option value="execution">En Ejecución</option>
            <option value="paused">Pausado</option>
            <option value="completed">Completado</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-8 h-8 text-white/30" />}
            title="No hay proyectos"
            description={searchTerm || filterStatus !== 'all' 
              ? 'No se encontraron proyectos con los filtros actuales.'
              : 'Comience creando un nuevo proyecto para gestionar su portafolio.'}
          />
        ) : (
          <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-3 px-4">Código</th>
                  <th className="text-left text-white/60 py-3 px-4">Nombre</th>
                  <th className="text-left text-white/60 py-3 px-4">Cliente</th>
                  <th className="text-left text-white/60 py-3 px-4">Ubicación</th>
                  <th className="text-left text-white/60 py-3 px-4">Tipología</th>
                  <th className="text-left text-white/60 py-3 px-4">Área (m²)</th>
                  <th className="text-left text-white/60 py-3 px-4">Estado</th>
                  <th className="text-left text-white/60 py-3 px-4">Presupuesto</th>
                  <th className="text-right text-white/60 py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-medium">{project.code}</td>
                    <td className="py-3 px-4 text-white">{project.name}</td>
                    <td className="py-3 px-4 text-white">{project.client_name}</td>
                    <td className="py-3 px-4 text-white">{project.location}</td>
                    <td className="py-3 px-4 text-white">{typologyLabels[project.typology]}</td>
                    <td className="py-3 px-4 text-white">{project.area_m2.toLocaleString('es-GT')}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: statusColors[project.status].bg,
                          color: statusColors[project.status].text,
                          border: `1px solid ${statusColors[project.status].border}`
                        }}
                      >
                        {statusLabels[project.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {formatCurrency(project.total_budget)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(project)}
                          className="text-cyan-400 hover:text-cyan-300 p-1"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Eliminar"
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Nombre del Proyecto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Cliente</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Tipología</label>
                  <select
                    value={formData.typology}
                    onChange={(e) => setFormData({ ...formData, typology: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="residential">Residencial</option>
                    <option value="commercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="civil">Civil</option>
                    <option value="public">Público</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Área (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area_m2}
                    onChange={(e) => setFormData({ ...formData, area_m2: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Nivel de Calidad</label>
                  <select
                    value={formData.quality_level}
                    onChange={(e) => setFormData({ ...formData, quality_level: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="basic">Básico (Q.3,000-3,500/m²)</option>
                    <option value="moderate">Moderado (Q.3,500-4,000/m²)</option>
                    <option value="premium">Premium (Q.4,000-5,000/m²)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="planning">Planificación</option>
                    <option value="execution">En Ejecución</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Fecha Estimada Fin</label>
                  <input
                    type="date"
                    value={formData.estimated_end_date}
                    onChange={(e) => setFormData({ ...formData, estimated_end_date: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Duración (días)</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Presupuesto Total (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 disabled:opacity-50"
                >
                  {saveLoading ? 'Guardando...' : (editingProject ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Eliminar Proyecto"
        message={`¿Está seguro de eliminar el proyecto "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}