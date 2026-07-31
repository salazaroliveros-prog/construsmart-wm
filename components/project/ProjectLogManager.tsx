'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Calendar, TrendingUp, AlertTriangle, Flag, MessageSquare, Filter, Search, DollarSign } from 'lucide-react';
import { offlineDB, LocalProject, LocalProjectLog } from '@/lib/db/offlineStore';
import { queueDelete } from '@/lib/utils/offlineSync';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';

export default function ProjectLogManager() {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [logs, setLogs] = useState<LocalProjectLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LocalProjectLog[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'progress' | 'issue' | 'milestone' | 'note'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<LocalProjectLog | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; log: LocalProjectLog | null }>({ show: false, log: null });

  const [formData, setFormData] = useState<Partial<LocalProjectLog>>({
    project_id: '',
    log_date: new Date().toISOString().split('T')[0],
    activity_type: 'progress',
    description: '',
    physical_progress: 0,
    financial_progress: 0,
    created_by: '',
  });

  useEffect(() => {
    loadProjects();
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, selectedProject, filterType, searchTerm]);

  const loadProjects = async () => {
    try {
      const allProjects = await offlineDB.projects.toArray();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const allLogs = await offlineDB.projectLogs.toArray();
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (selectedProject) {
      filtered = filtered.filter((log) => log.project_id === selectedProject);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((log) => log.activity_type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

    setFilteredLogs(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const now = new Date().toISOString();

      if (editingLog) {
        await offlineDB.projectLogs.update(editingLog.id!, {
          ...formData,
          updated_at: now,
          sync_status: 'updated_offline',
        });
      } else {
        const newLog: LocalProjectLog = {
          ...formData,
          project_id: selectedProject,
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
        } as LocalProjectLog;
        await offlineDB.projectLogs.add(newLog);
      }

      setShowForm(false);
      setEditingLog(null);
      setFormData({
        project_id: '',
        log_date: new Date().toISOString().split('T')[0],
        activity_type: 'progress',
        description: '',
        physical_progress: 0,
        financial_progress: 0,
        created_by: '',
      });
      loadLogs();
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const handleEdit = (log: LocalProjectLog) => {
    setEditingLog(log);
    setFormData(log);
    setShowForm(true);
  };

  const handleDelete = async (log: LocalProjectLog) => {
    try {
      await queueDelete('project_logs', log);
      await offlineDB.projectLogs.delete(log.id!);
      setDeleteDialog({ show: false, log: null });
      loadLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'progress':
        return <TrendingUp className="w-4 h-4" />;
      case 'issue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'milestone':
        return <Flag className="w-4 h-4" />;
      case 'note':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'progress':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'issue':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'milestone':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'note':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Proyecto desconocido';
  };

  // Realtime refresh: recarga cuando cambios llegan de otros dispositivos
  useRealtimeRefresh(['project_logs', 'projects'], () => {
    loadLogs();
    loadProjects();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bitácora de Proyectos</h2>
          <p className="text-white/60 text-sm">Registro de avance, incidencias y notas</p>
        </div>
        <Tooltip content="Agregar nueva entrada a la bitácora">
          <button
            onClick={() => {
              if (!selectedProject) {
                alert('Por favor selecciona un proyecto primero');
                return;
              }
              setEditingLog(null);
              setFormData({
                project_id: selectedProject,
                log_date: new Date().toISOString().split('T')[0],
                activity_type: 'progress',
                description: '',
                physical_progress: 0,
                financial_progress: 0,
                created_by: '',
              });
              setShowForm(true);
            }}
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-white"
          >
            <Plus className="w-4 h-4" />
            Nueva Entrada
          </button>
        </Tooltip>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-white/70 text-sm mb-2">Proyecto</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white"
            >
              <option value="">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-white/70 text-sm mb-2">Tipo de Actividad</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white"
            >
              <option value="all">Todos</option>
              <option value="progress">Avance</option>
              <option value="issue">Incidencia</option>
              <option value="milestone">Hito</option>
              <option value="note">Nota</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-white/70 text-sm mb-2">Buscar</label>
            <Search className="absolute left-3 top-9 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar en descripciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Total Entradas</p>
              <p className="text-white text-xl font-bold">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Avances</p>
              <p className="text-white text-xl font-bold">
                {logs.filter((l) => l.activity_type === 'progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Incidencias</p>
              <p className="text-white text-xl font-bold">
                {logs.filter((l) => l.activity_type === 'issue').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-l-4 border-l-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Flag className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Hitos</p>
              <p className="text-white text-xl font-bold">
                {logs.filter((l) => l.activity_type === 'milestone').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log List */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="No hay entradas en la bitácora"
          description="Comienza registrando el avance de tus proyectos"
        />
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="glass-card p-4 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getActivityColor(log.activity_type)}`}>
                    {getActivityIcon(log.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{getProjectName(log.project_id)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getActivityColor(log.activity_type)}`}>
                        {log.activity_type.charAt(0).toUpperCase() + log.activity_type.slice(1)}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mb-3">{log.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-white/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(log.log_date).toLocaleDateString('es-GT')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Por: {log.created_by}</span>
                      </div>
                      {(log.physical_progress || log.financial_progress) && (
                        <>
                          {log.physical_progress !== undefined && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>Avance físico: {log.physical_progress}%</span>
                            </div>
                          )}
                          {log.financial_progress !== undefined && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>Avance financiero: {log.financial_progress}%</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ show: true, log })}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingLog ? 'Editar Entrada' : 'Nueva Entrada'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.log_date}
                  onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Tipo de Actividad</label>
                <select
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as any })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                >
                  <option value="progress">Avance</option>
                  <option value="issue">Incidencia</option>
                  <option value="milestone">Hito</option>
                  <option value="note">Nota</option>
                </select>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white min-h-[100px]"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Avance Físico (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.physical_progress || 0}
                    onChange={(e) => setFormData({ ...formData, physical_progress: parseFloat(e.target.value) })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Avance Financiero (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.financial_progress || 0}
                    onChange={(e) => setFormData({ ...formData, financial_progress: parseFloat(e.target.value) })}
                    className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Creado por</label>
                <input
                  type="text"
                  value={formData.created_by}
                  onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  {editingLog ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.show}
        onCancel={() => setDeleteDialog({ show: false, log: null })}
        onConfirm={() => deleteDialog.log && handleDelete(deleteDialog.log)}
        title="Eliminar Entrada"
        message="¿Estás seguro de que deseas eliminar esta entrada de la bitácora? Esta acción no se puede deshacer."
      />
    </div>
  );
}
