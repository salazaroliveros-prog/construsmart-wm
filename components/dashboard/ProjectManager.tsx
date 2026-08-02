'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, FolderOpen } from 'lucide-react';
import { offlineDB, LocalProject } from '@/lib/db/offlineStore';
import { queueDelete, isServerId, fetchProjectsForOffline } from '@/lib/utils/offlineSync';
import { generateId } from '@/lib/utils/generateId';
import { createProject as serverCreateProject, updateProject as serverUpdateProject, getProjectById } from '@/app/actions/project-actions';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';

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
  budget_total?: number;
  calculated_duration?: number;
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
    total_budget: 0,
    budget_total: undefined,
    calculated_duration: undefined
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
      // Lectura desde Supabase cuando hay conexión (Server-side pull al store local)
      if (isOnline) {
        const pulled = await fetchProjectsForOffline();
        console.log('[ProjectManager] fetchProjectsForOffline trajo=', pulled.length);
      }
      const localProjects = await offlineDB.projects.toArray();
      console.log('[ProjectManager] offlineDB.projects cargados=', localProjects.length);
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
      total_budget: 0,
      budget_total: undefined,
      calculated_duration: undefined
    });
    setEditingProject(null);
  };

  const calculateEndDate = (startDate: string, durationDays: number): string => {
    if (!startDate || !durationDays) return '';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    return end.toISOString().split('T')[0];
  };

  const handleStartDateChange = (startDate: string) => {
    setFormData(prev => {
      const duration = prev.duration_days || prev.calculated_duration || 0;
      return {
        ...prev,
        start_date: startDate,
        estimated_end_date: calculateEndDate(startDate, duration)
      };
    });
  };

  const handleDurationChange = (durationDays: number) => {
    setFormData(prev => ({
      ...prev,
      duration_days: durationDays,
      estimated_end_date: calculateEndDate(prev.start_date || '', durationDays)
    }));
  };

  const openModal = (project?: LocalProject) => {
    if (project) {
      setEditingProject(project);
      // If project has budget_total and calculated_duration from budget, use them
      const duration = project.duration_days || project.calculated_duration || 0;
      const budget = project.total_budget || project.budget_total || 0;

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
        estimated_end_date: project.estimated_end_date || calculateEndDate(project.start_date || '', duration),
        duration_days: duration,
        total_budget: budget,
        budget_total: project.budget_total,
        calculated_duration: project.calculated_duration
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
        id: editingProject?.id || generateId(),
        ...formData,
        sync_status: editingProject
          ? (editingProject.sync_status === 'synced' ? (isOnline ? 'synced' : 'updated_offline') : 'created_offline')
          : 'created_offline',
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

      // Sincroniza con Supabase a través de Server Action (segura en servidor)
      if (isOnline && isServerId(projectData.id)) {
        const result = editingProject
          ? await serverUpdateProject(projectData.id!, projectData)
          : await serverCreateProject(projectData);

        if (result.error) {
          // Si falla el servidor, quedar pendiente para el motor de sync offline
          await offlineDB.projects.update(projectData.id!, { sync_status: 'created_offline' });
          showToast('warning', 'Proyecto guardado localmente; pendiente de sync');
        } else {
          await offlineDB.projects.update(projectData.id!, { sync_status: 'synced' });
        }
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
      await queueDelete('projects', deleteConfirm);
      await offlineDB.projects.delete(deleteConfirm.id);

      // Cascada local para no dejar huérfanos (el servidor usa CASCADE/SET NULL):
      // elimina presupuestos + items y bitácoras; desvincula transacciones, stock, nómina y OC.
      const projectId = deleteConfirm.id!;
      const budgetIds = (await offlineDB.budgets.where('project_id').equals(projectId).toArray())
        .map((b) => b.id as string);
      if (budgetIds.length > 0) {
        await offlineDB.budgetItems.where('budget_id').anyOf(budgetIds).delete();
      }
      await offlineDB.budgets.where('project_id').equals(projectId).delete();
      await offlineDB.projectLogs.where('project_id').equals(projectId).delete();
      await offlineDB.financialTransactions.where('project_id').equals(projectId).modify({ project_id: undefined });
      await offlineDB.warehouseStock.where('project_id').equals(projectId).modify({ project_id: undefined });
      await offlineDB.payrollRecords.where('project_id').equals(projectId).modify({ project_id: undefined });
      await offlineDB.purchaseOrders.where('project_id').equals(projectId).modify({ project_id: undefined });

      showToast('success', 'Proyecto eliminado exitosamente');
      loadProjects();
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

  useRealtimeRefresh(['projects'], loadProjects);

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
            <Tooltip content={isOnline ? 'Conectado a internet' : 'Trabajando sin conexión'}>
              <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isOnline ? '🟢 En línea' : '🟡 Sin conexión'}
              </div>
            </Tooltip>
            <Tooltip content="Crear un nuevo proyecto">
              <button
                onClick={() => openModal()}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Proyecto
              </button>
            </Tooltip>
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
          <>
            {/* Tabla Desktop (md+) */}
            <div className="hidden md:block data-table-container rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
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
                          <ActionButton
                            onClick={() => openModal(project)}
                            icon={<Edit className="w-4 h-4" />}
                            label="Editar proyecto"
                            tooltip="Editar información del proyecto"
                            variant="primary"
                          />
                          <ActionButton
                            onClick={() => handleDelete(project)}
                            icon={<Trash2 className="w-4 h-4" />}
                            label="Eliminar proyecto"
                            tooltip="Eliminar proyecto permanentemente"
                            variant="danger"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards Móvil (<768px) */}
            <div className="md:hidden space-y-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="glass-card rounded-xl p-4 active:bg-white/5 touch-manipulation"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-cyan-400 truncate">{project.code}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0"
                          style={{
                            backgroundColor: statusColors[project.status].bg,
                            color: statusColors[project.status].text,
                            border: `1px solid ${statusColors[project.status].border}`
                          }}
                        >
                          {statusLabels[project.status]}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold text-sm truncate">{project.name}</h3>
                      <p className="text-xs text-white/60 truncate mt-0.5">{project.client_name}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <ActionButton
                        onClick={() => openModal(project)}
                        icon={<Edit className="w-4 h-4" />}
                        label="Editar proyecto"
                        tooltip="Editar información del proyecto"
                        variant="primary"
                      />
                      <ActionButton
                        onClick={() => handleDelete(project)}
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Eliminar proyecto"
                        tooltip="Eliminar proyecto permanentemente"
                        variant="danger"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 mt-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/40 truncate">Ubicación</p>
                      <p className="text-xs text-white/80 truncate">{project.location}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/40 truncate">Tipología</p>
                      <p className="text-xs text-white/80 truncate">{typologyLabels[project.typology]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/40 truncate">Área</p>
                      <p className="text-xs text-white/80 truncate">{project.area_m2.toLocaleString('es-GT')} m²</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/40 truncate">Presupuesto</p>
                      <p className="text-xs font-medium text-emerald-400 truncate">{formatCurrency(project.total_budget)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none" onClick={e => e.stopPropagation()}>
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
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Fecha Estimada Fin</label>
                  <input
                    type="date"
                    value={formData.estimated_end_date}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Duración (días)</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
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
                {formData.budget_total && (
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Presupuesto Calculado (GTQ)</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.budget_total)}
                      readOnly
                      className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-400 text-sm cursor-not-allowed"
                    />
                  </div>
                )}
                {formData.calculated_duration && (
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Duración Calculada (días)</label>
                    <input
                      type="text"
                      value={formData.calculated_duration}
                      readOnly
                      className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-400 text-sm cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Tooltip content="Cancelar y cerrar el formulario">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 glass-button px-4 py-2 rounded-lg text-white"
                  >
                    Cancelar
                  </button>
                </Tooltip>
                <Tooltip content={editingProject ? 'Guardar cambios del proyecto' : 'Crear nuevo proyecto'}>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 glass-button px-4 py-2 rounded-lg text-white bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 disabled:opacity-50"
                  >
                    {saveLoading ? 'Guardando...' : (editingProject ? 'Actualizar' : 'Crear')}
                  </button>
                </Tooltip>
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