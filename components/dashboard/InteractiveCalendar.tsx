'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from 'lucide-react';

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
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
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
        className={`p-2 min-h-[80px] border border-white/10 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${
          isSelected ? 'bg-cyan-500/20 border-cyan-500/50' : ''
        } ${isToday ? 'bg-violet-500/10 border-violet-500/30' : ''}`}
      >
        <div className="text-sm font-medium text-white mb-1">{day}</div>
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className={`text-xs px-1 py-0.5 rounded truncate ${
                event.type === 'meeting'
                  ? 'bg-cyan-500/30 text-cyan-300'
                  : event.type === 'deadline'
                  ? 'bg-red-500/30 text-red-300'
                  : event.type === 'milestone'
                  ? 'bg-violet-500/30 text-violet-300'
                  : 'bg-emerald-500/30 text-emerald-300'
              }`}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-white/40">+{dayEvents.length - 2} más</div>
          )}
        </div>
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
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Calendario
          </h3>
          <button
            onClick={goToToday}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-white/60 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">{days}</div>

      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              {selectedDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            <button
              onClick={() => setShowEventForm(true)}
              className="glass-button px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Evento
            </button>
          </div>

          {selectedDateEvents.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">No hay eventos programados</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${
                    event.type === 'meeting'
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : event.type === 'deadline'
                      ? 'bg-red-500/10 border-red-500/30'
                      : event.type === 'milestone'
                      ? 'bg-violet-500/10 border-violet-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-white font-medium mb-1">{event.title}</h5>
                      {event.time && (
                        <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.projectName && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <User className="w-3 h-3" />
                          <span>{event.projectName}</span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-xs text-white/60 mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEventForm(false)} />
          <div className="glass-panel relative w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Nuevo Evento</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Título</label>
                <input type="text" className="glass-input w-full px-4 py-2 rounded-lg text-white" placeholder="Reunión de coordinación" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Hora</label>
                <input type="time" className="glass-input w-full px-4 py-2 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Tipo</label>
                <select className="glass-input w-full px-4 py-2 rounded-lg text-white">
                  <option value="meeting">Reunión</option>
                  <option value="deadline">Fecha Límite</option>
                  <option value="milestone">Hito</option>
                  <option value="visit">Visita</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Ubicación</label>
                <input type="text" className="glass-input w-full px-4 py-2 rounded-lg text-white" placeholder="Oficina central" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Descripción</label>
                <textarea className="glass-input w-full px-4 py-2 rounded-lg text-white min-h-[80px]" rows={3} />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
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
