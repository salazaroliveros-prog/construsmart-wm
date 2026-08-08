/**
 * CONSTRUCTORA WM/M&S - NOTIFICATION CENTER COMPONENT
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Centro de notificaciones unificado con UI glassmorphism
 * Integrado con QuickActionFab y sistema de notificaciones
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  Trash2, 
  Settings, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { 
  Notification, 
  NotificationSeverity, 
  NotificationModule 
} from '@/lib/types/notifications';
import { cn } from '@/lib/utils';

// ============================================================================
// ICON MAP BY SEVERITY
// ============================================================================

const severityIcons: Record<NotificationSeverity, React.ReactNode> = {
  critical: <AlertTriangle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const severityColors: Record<NotificationSeverity, string> = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-cyan-400',
};

const severityBgColors: Record<NotificationSeverity, string> = {
  critical: 'bg-red-500/20 border-red-500/30',
  warning: 'bg-amber-500/20 border-amber-500/30',
  info: 'bg-cyan-500/20 border-cyan-500/30',
};

// ============================================================================
// MODULE LABELS
// ============================================================================

const moduleLabels: Record<NotificationModule, string> = {
  budget: 'Presupuesto',
  warehouse: 'Almacén',
  finance: 'Finanzas',
  payroll: 'Nómina',
  project: 'Proyecto',
  system: 'Sistema',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | NotificationSeverity>('all');
  const [moduleFilter, setModuleFilter] = useState<NotificationModule | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.status !== 'unread') return false;
    if (filter !== 'all' && filter !== 'unread' && n.severity !== filter) return false;
    if (moduleFilter !== 'all' && n.module !== moduleFilter) return false;
    return true;
  });

  // Handle notification action
  const handleAction = useCallback(async (notification: Notification) => {
    if (notification.action) {
      await notification.action();
      markAsRead(notification.id);
    }
  }, [markAsRead]);

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;
    return date.toLocaleDateString('es-GT');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Notification Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 320, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 320, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-4 top-20 bottom-20 w-full max-w-md z-50 flex flex-col"
          >
            <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden border border-white/20">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {unreadCount > 0 ? (
                      <BellRing className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-white/60" />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <h2 className="text-white font-semibold">Notificaciones</h2>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title="Marcar todas como leídas"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="px-4 py-2 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      filter === 'all'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      filter === 'unread'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                  >
                    No leídas ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilter('critical')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      filter === 'critical'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                  >
                    Críticas
                  </button>
                  <button
                    onClick={() => setFilter('warning')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      filter === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                  >
                    Advertencias
                  </button>
                </div>
              </div>

              {/* Module Filter */}
              <div className="px-4 py-2 border-b border-white/10 bg-white/5">
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value as NotificationModule | 'all')}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="all">Todos los módulos</option>
                  {(Object.keys(moduleLabels) as NotificationModule[]).map(module => (
                    <option key={module} value={module} className="bg-slate-900">
                      {moduleLabels[module]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto overflow-anchor-none">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <CheckCircle className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-white/40 text-sm">
                      {filter === 'unread' 
                        ? 'No hay notificaciones sin leer' 
                        : 'No hay notificaciones'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'glass-card rounded-xl p-3 border transition-all cursor-pointer',
                          notification.status === 'unread' 
                            ? 'border-cyan-500/30 bg-cyan-500/5' 
                            : 'border-white/10 bg-white/5'
                        )}
                        onClick={() => {
                          markAsRead(notification.id);
                          setExpandedId(expandedId === notification.id ? null : notification.id);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border',
                            severityBgColors[notification.severity]
                          )}>
                            <span className={severityColors[notification.severity]}>
                              {severityIcons[notification.severity]}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn(
                                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                    'bg-white/10 text-white/70'
                                  )}>
                                    {moduleLabels[notification.module]}
                                  </span>
                                  <span className="text-white/40 text-[10px]">
                                    {formatTime(notification.timestamp)}
                                  </span>
                                </div>
                                <h3 className={cn(
                                  'text-sm font-medium mb-1',
                                  notification.status === 'unread' ? 'text-white' : 'text-white/80'
                                )}>
                                  {notification.title}
                                </h3>
                                <p className="text-xs text-white/60 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                            </div>

                            {/* Action Button */}
                            {notification.actionLabel && expandedId === notification.id && (
                              <motion.button
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(notification);
                                }}
                                className="mt-2 w-full px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
                              >
                                {notification.actionLabel}
                              </motion.button>
                            )}
                          </div>

                          {/* Dismiss Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="flex-shrink-0 p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                  <button
                    onClick={clearAllNotifications}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpiar todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
