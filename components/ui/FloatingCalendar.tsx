'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, X, Bell, AlertCircle } from 'lucide-react';
import { offlineDB, LocalProjectLog, LocalProject } from '@/lib/db/offlineStore';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  type: 'meeting' | 'deadline' | 'milestone' | 'visit' | 'reminder';
  projectId?: string;
  projectName?: string;
  alertSent?: boolean;
}

interface FloatingCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  triggerDate?: Date;
}

export default function FloatingCalendar({ isOpen, onClose, triggerDate }: FloatingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    date: '',
    time: '',
    type: 'reminder',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Set selected date when opened
  useEffect(() => {
    if (isOpen && triggerDate) {
      setSelectedDate(triggerDate);
      setCurrentDate(triggerDate);
    }
  }, [isOpen, triggerDate]);

  // Load events from database
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
    if (isOpen) {
      loadRealEvents();
    }
  }, [isOpen, loadRealEvents]);

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
    const hasAlert = dayEvents.some(e => e.type === 'deadline' || e.type === 'milestone');

    days.push(
      <div
        key={day}
        onClick={() => setSelectedDate(date)}
        className={`p-1 aspect-square border border-white/10 rounded cursor-pointer text-xs transition-all relative ${
          isSelected ? 'bg-cyan-500/20 border-cyan-500/50' : 'hover:bg-white/5'
        } ${isToday ? 'bg-violet-500/10 border-violet-500/30' : ''}`}
      >
        <div className="text-[10px] font-medium text-zinc-900 dark:text-white mb-0.25">{day}</div>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
            <div className={`w-1 h-1 rounded-full ${hasAlert ? 'bg-red-400' : 'bg-cyan-400'}`} />
          </div>
        )}
      </div>
    );
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const selectedDateEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate.toISOString().split('T')[0])
    : [];

  const handleAddEvent = () => {
    if (newEvent.title && selectedDate) {
      const event: CalendarEvent = {
        id: `custom-${Date.now()}`,
        title: newEvent.title!,
        date: selectedDate.toISOString().split('T')[0],
        time: newEvent.time,
        type: newEvent.type as CalendarEvent['type'],
        description: newEvent.description,
      };

      setEvents([...events, event]);
      setNewEvent({ title: '', date: '', time: '', type: 'reminder', description: '' });
      setShowEventForm(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={calendarRef}
      className="fixed top-16 right-4 z-50 w-80 sm:w-96 bg-white/[var(--glass-opacity,0.95)] dark:bg-black/[var(--glass-opacity,0.95)] backdrop-blur-[var(--glass-blur,20px)] border border-white/20 dark:border-zinc-700/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden"
    >
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 dark:from-cyan-500/10 dark:to-violet-500/10 border-b border-white/10 dark:border-zinc-700/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-900 dark:text-white" />
          </button>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-900 dark:text-white" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-medium hover:bg-cyan-500/30 dark:hover:bg-cyan-500/20 transition-colors"
        >
          Ir a Hoy
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t border-white/10 dark:border-zinc-700/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {selectedDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="p-1.5 rounded-lg bg-cyan-500/20 dark:bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/30 dark:hover:bg-cyan-500/20 transition-colors"
              title="Agregar evento"
            >
              <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </button>
          </div>

          {/* Event Form */}
          {showEventForm && (
            <div className="mb-3 p-3 bg-white/5 dark:bg-black/5 rounded-lg border border-white/10 dark:border-zinc-700/30">
              <input
                type="text"
                placeholder="Título del evento"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full mb-2 px-3 py-1.5 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-zinc-700/30 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full mb-2 px-3 py-1.5 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-zinc-700/30 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                className="w-full mb-2 px-3 py-1.5 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-zinc-700/30 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="reminder">Recordatorio</option>
                <option value="meeting">Reunión</option>
                <option value="deadline">Deadline</option>
                <option value="milestone">Hito</option>
                <option value="visit">Visita</option>
              </select>
              <textarea
                placeholder="Descripción (opcional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full mb-2 px-3 py-1.5 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-zinc-700/30 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition-colors"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-zinc-700/30 text-zinc-900 dark:text-white text-sm font-medium hover:bg-white/20 dark:hover:bg-black/30 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Events List */}
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDateEvents.map((event) => {
                const isAlert = event.type === 'deadline' || event.type === 'milestone';
                return (
                  <div
                    key={event.id}
                    className={`p-2.5 rounded-lg border ${
                      isAlert
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-white/5 dark:bg-black/5 border-white/10 dark:border-zinc-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isAlert && <Bell className="w-3 h-3 text-red-400 flex-shrink-0" />}
                          <Clock className="w-3 h-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                          {event.time && (
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">{event.time}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {event.title}
                        </p>
                        {event.projectName && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {event.projectName}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 rounded hover:bg-white/10 dark:hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Eliminar evento"
                      >
                        <X className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-zinc-500 dark:text-zinc-400 text-sm">
              No hay eventos para esta fecha
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <div className="border-t border-white/10 dark:border-zinc-700/30 p-3">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-zinc-700/30 text-zinc-900 dark:text-white text-sm font-medium hover:bg-white/20 dark:hover:bg-black/30 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
