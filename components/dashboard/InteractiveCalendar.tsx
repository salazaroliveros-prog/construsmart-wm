'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { offlineDB, LocalProjectLog, LocalProject } from '@/lib/db/offlineStore';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  type: 'meeting' | 'deadline' | 'milestone' | 'visit';
  projectId?: string;
  projectName?: string;
}

export default function InteractiveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar eventos reales desde project_logs (hitos) y proyectos (deadlines)
  const loadRealEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = await getUserScope();
      const [logs, projects] = await Promise.all([
        scopeLocalRows(await offlineDB.projectLogs.toArray(), userId),
        scopeLocalRows(await offlineDB.projects.toArray(), userId),
      ]);

      const projectMap = new Map<string, LocalProject>();
      projects.forEach(p => p.id && projectMap.set(p.id, p));

      const logEvents: CalendarEvent[] = (logs as LocalProjectLog[])
        .filter(l => l.log_date)
        .map(log => ({
          id: `log-${log.id || Math.random().toString(36).slice(2)}`,
          title: log.description || 'Bitácora',
          date: log.log_date,
          type: (log.activity_type === 'milestone' ? 'milestone' : 'note') as CalendarEvent['type'],
          projectId: log.project_id,
          projectName: projectMap.get(log.project_id)?.name,
          description: log.description,
        }));

      const deadlineEvents: CalendarEvent[] = projects
        .filter(p => p.estimated_end_date)
        .map(p => ({
          id: `deadline-${p.id}`,
          title: `Fin: ${p.name}`,
          date: p.estimated_end_date!,
          type: 'deadline',
          projectId: p.id,
          projectName: p.name,
        }));

      const startEvents: CalendarEvent[] = projects
        .filter(p => p.start_date && p.status === 'execution')
        .map(p => ({
          id: `start-${p.id}`,
          title: `Inicio: ${p.name}`,
          date: p.start_date!,
          type: 'milestone',
          projectId: p.id,
          projectName: p.name,
        }));

      setEvents([...logEvents, ...deadlineEvents, ...startEvents]);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRealEvents();
  }, [loadRealEvents]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      firstDayOfWeek: firstDay.getDay(),
      daysInMonth: lastDay.getDate(),
    };
  };

  const { firstDayOfWeek, daysInMonth } = getDaysInMonth(currentDate);

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-1" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter((e) => e.date === dateStr);
    const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    days.push(
      <div
        key={day}
        onClick={() => setSelectedDate(date)}
        className={`p-1 aspect-square border border-white/10 rounded cursor-pointer text-xs transition-all ${
          isSelected ? 'bg-cyan-500/20 border-cyan-500/50' : ''
        } ${isToday ? 'bg-violet-500/10 border-violet-500/30' : ''}`}
      >
        <div className="text-[10px] font-medium text-white mb-0.25">{day}</div>
        {dayEvents.length > 0 && (
          <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
        )}
      </div>
    );
  }

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className="glass-card rounded-xl p-2.5 sm:p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-xs font-bold text-white">Calendario</h3>
          {isLoading && <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" title="Cargando eventos..." />}
          <button
            onClick={goToToday}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goToPreviousMonth}
            className="p-0.5 rounded text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-medium text-white text-center whitespace-nowrap">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-0.5 rounded text-white/60 hover:text-white transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1 text-[8px] font-medium text-white/40">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
          <div key={day} className="text-center py-0.5">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
        {days}
      </div>

      {/* Selected date events - compact */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-white/10 flex-1 overflow-y-auto overflow-anchor-none min-h-0">
          <h4 className="text-[10px] font-semibold text-white mb-1">
            {selectedDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
          </h4>
          <div className="space-y-1">
            {selectedDateEvents.map((event) => (
              <div
                key={event.id}
                className={`p-1.5 rounded text-[9px] ${
                  event.type === 'meeting'
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : event.type === 'deadline'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : event.type === 'milestone'
                    ? 'bg-violet-500/10 border border-violet-500/20'
                    : 'bg-emerald-500/10 border border-emerald-500/20'
                } truncate`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedDateEvents.length === 0 && (
        <div className="mt-1.5 text-[9px] text-white/40 text-center py-1">
          {selectedDate.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEventForm(false)} />
          <div className="glass-panel relative w-full max-w-sm rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">Nuevo Evento</h3>
            <form className="space-y-3">
              <div>
                <label className="block text-white/70 text-[10px] mb-1">Título</label>
                <input type="text" className="glass-input w-full px-3 py-1.5 rounded text-[11px] text-white" placeholder="Reunión" />
              </div>
              <div>
                <label className="block text-white/70 text-[10px] mb-1">Hora</label>
                <input type="time" className="glass-input w-full px-3 py-1.5 rounded text-[11px] text-white" />
              </div>
              <div>
                <label className="block text-white/70 text-[10px] mb-1">Tipo</label>
                <select className="glass-input w-full px-3 py-1.5 rounded text-[11px] text-white">
                  <option>Reunión</option>
                  <option>Fecha Límite</option>
                  <option>Hito</option>
                  <option>Visita</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 glass-button px-3 py-1.5 rounded text-[11px] text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-1.5 rounded text-[11px] text-white font-semibold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
