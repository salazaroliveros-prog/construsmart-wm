/**
 * CONSTRUCTORA WM/M&S - NOTIFICATION SYSTEM HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook unificado para sistema de notificaciones inteligentes
 * Integra con hooks de detección existentes y genera notificaciones contextuales
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Notification, 
  NotificationSeverity, 
  NotificationModule, 
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  type WarehouseNotification,
  type PayrollNotification,
  type BudgetNotification,
  type FinanceNotification,
  type ProjectNotification,
  type SystemNotification
} from '@/lib/types/notifications';
import { useMaterialAlertContext } from '@/context/MaterialAlertContext';
import { useLaborCostOverrun } from '@/hooks/useLaborCostOverrun';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import { offlineDB } from '@/lib/db/offlineStore';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';
import { generateId } from '@/lib/utils/generateId';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const NOTIFICATIONS_STORAGE_KEY = 'notifications';
const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useNotifications() {
  const { showToast } = useToast();
  const { alerts: materialAlerts, clearAlerts } = useMaterialAlertContext();
  const { alerts: laborAlerts, detectAllOverruns } = useLaborCostOverrun();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitialized = useRef(false);

  // ============================================================================
  // STORAGE OPERATIONS
  // ============================================================================

  const loadNotifications = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const notificationsWithDates = parsed.map((n: Notification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        }));
        setNotifications(notificationsWithDates);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, []);

  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, []);

  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    try {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }, []);

  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      status: 'unread',
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 100); // Keep last 100
      saveNotifications(updated);
      return updated;
    });

    // Show toast for critical notifications
    if (notification.severity === 'critical' && settings.enableInApp) {
      showToast(
        notification.severity === 'critical' ? 'error' : 'info',
        notification.title,
        notification.message
      );
    }
  }, [settings.enableInApp, showToast, saveNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, status: 'read' as const } : n
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, status: 'read' as const }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  }, []);

  // ============================================================================
  // NOTIFICATION GENERATORS BY MODULE
  // ============================================================================

  // Warehouse notifications from existing material alerts
  const generateWarehouseNotifications = useCallback(async () => {
    if (!settings.modulePreferences.warehouse.warning) return;

    try {
      const userId = await getUserScope();
      const warehouseStock = scopeLocalRows(await offlineDB.warehouseStock.toArray(), userId);

      warehouseStock.forEach(item => {
        if (item.current_stock <= item.minimum_threshold) {
          const notification: Omit<WarehouseNotification, 'id'> = {
            severity: 'warning',
            module: 'warehouse',
            title: 'Stock Bajo',
            message: `${item.description} está por debajo del mínimo (${item.current_stock} ${item.unit})`,
            actionLabel: 'Generar Orden de Compra',
            action: () => {
              // Navigate to purchase order creation
              window.dispatchEvent(new CustomEvent('navigate-to-purchase-order', { 
                detail: { itemId: item.id } 
              }));
            },
            metadata: {
              itemId: item.id,
              itemCode: item.item_code,
              itemDescription: item.description,
              currentStock: item.current_stock,
              minimumThreshold: item.minimum_threshold,
              unit: item.unit,
              autoGeneratePO: item.auto_generate_po,
            },
            timestamp: new Date(),
            status: 'unread',
          };

          // Check if similar notification already exists
          const exists = notifications.some(
            n => n.module === 'warehouse' && 
            n.metadata?.itemId === item.id && 
            n.status === 'unread'
          );

          if (!exists) {
            addNotification(notification);
          }
        }
      });
    } catch (error) {
      console.error('Error generating warehouse notifications:', error);
    }
  }, [settings.modulePreferences.warehouse.warning, notifications, addNotification]);

  // Payroll notifications from labor cost overrun detection
  const generatePayrollNotifications = useCallback(async () => {
    if (!settings.modulePreferences.payroll.warning) return;

    try {
      await detectAllOverruns();
      
      laborAlerts.forEach(alert => {
        const notification: Omit<PayrollNotification, 'id'> = {
          severity: alert.severity || 'warning',
          module: 'payroll',
          title: 'Sobrecosto de Mano de Obra',
          message: alert.message || 'Detectado sobrecosto en nómina',
          actionLabel: 'Ver Detalles',
          action: () => {
            window.dispatchEvent(new CustomEvent('navigate-to-payroll', { 
              detail: { payrollRecordId: alert.payrollRecord.id } 
            }));
          },
          metadata: {
            employeeId: alert.payrollRecord.employee_id,
            projectId: alert.payrollRecord.project_id,
            overrunPercentage: alert.actualHours > 0 ? (alert.costOverrunAmount / alert.actualHours) * 100 : 0,
            threshold: settings.thresholds.laborOverrun,
          },
          timestamp: new Date(),
          status: 'unread',
        };

        const exists = notifications.some(
          n => n.module === 'payroll' && 
          n.metadata?.projectId === alert.payrollRecord.project_id && 
          n.status === 'unread'
        );

        if (!exists) {
          addNotification(notification);
        }
      });
    } catch (error) {
      console.error('Error generating payroll notifications:', error);
    }
  }, [settings.modulePreferences.payroll.warning, settings.thresholds.laborOverrun, laborAlerts, detectAllOverruns, notifications, addNotification]);

  // Budget notifications
  const generateBudgetNotifications = useCallback(async () => {
    if (!settings.modulePreferences.budget.warning) return;

    try {
      const userId = await getUserScope();
      const [projects, budgets] = await Promise.all([
        scopeLocalRows(await offlineDB.projects.toArray(), userId),
        scopeLocalRows(await offlineDB.budgets.toArray(), userId),
      ]);

      projects.forEach(project => {
        const projectBudget = budgets.find(b => b.project_id === project.id);
        if (projectBudget && project.total_budget > 0) {
          const spent = projectBudget.total_amount || 0;
          const overagePercentage = ((spent - project.total_budget) / project.total_budget) * 100;

          if (overagePercentage >= settings.thresholds.budgetOverage) {
            const notification: Omit<BudgetNotification, 'id'> = {
              severity: overagePercentage > 20 ? 'critical' : 'warning',
              module: 'budget',
              title: 'Exceso de Presupuesto',
              message: `El proyecto ${project.name} excede el presupuesto en ${overagePercentage.toFixed(1)}%`,
              actionLabel: 'Ver Presupuesto',
              action: () => {
                window.dispatchEvent(new CustomEvent('navigate-to-budget', { 
                  detail: { projectId: project.id } 
                }));
              },
              metadata: {
                projectId: project.id,
                projectName: project.name,
                budgetId: projectBudget.id,
                overagePercentage,
                threshold: settings.thresholds.budgetOverage,
              },
              timestamp: new Date(),
              status: 'unread',
            };

            const exists = notifications.some(
              n => n.module === 'budget' && 
              n.metadata?.projectId === project.id && 
              n.status === 'unread'
            );

            if (!exists) {
              addNotification(notification);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error generating budget notifications:', error);
    }
  }, [settings.modulePreferences.budget.warning, settings.thresholds.budgetOverage, notifications, addNotification]);

  // System notifications (sync status, online/offline)
  const generateSystemNotifications = useCallback(() => {
    if (!settings.modulePreferences.system.info) return;

    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      const notification: Omit<SystemNotification, 'id'> = {
        severity: 'warning',
        module: 'system',
        title: 'Sin Conexión',
        message: 'Trabajando en modo offline. Los cambios se sincronizarán cuando vuelvas a estar conectado.',
        metadata: {
          isOnline: false,
          syncStatus: 'error',
        },
        timestamp: new Date(),
        status: 'unread',
      };

      const exists = notifications.some(
        n => n.module === 'system' && 
        n.metadata?.isOnline === false && 
        n.status === 'unread'
      );

      if (!exists) {
        addNotification(notification);
      }
    }
  }, [settings.modulePreferences.system.info, notifications, addNotification]);

  // ============================================================================
  // INITIALIZATION AND REFRESH
  // ============================================================================

  useEffect(() => {
    if (!isInitialized.current) {
      loadNotifications();
      loadSettings();
      isInitialized.current = true;
    }
  }, [loadNotifications, loadSettings]);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => n.status === 'unread').length;
    setUnreadCount(unread);
  }, [notifications]);

  // Clean expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        const now = new Date();
        const filtered = prev.filter(n => !n.expiresAt || n.expiresAt > now);
        if (filtered.length !== prev.length) {
          saveNotifications(filtered);
        }
        return filtered;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [saveNotifications]);

  // Refresh notifications periodically
  useRealtimeRefresh(
    ['warehouse_stock', 'financial_transactions', 'projects', 'budgets', 'payroll_records'],
    async () => {
      await Promise.all([
        generateWarehouseNotifications(),
        generatePayrollNotifications(),
        generateBudgetNotifications(),
      ]);
    }
  );

  // System notifications (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      generateSystemNotifications();
    };
    const handleOffline = () => {
      generateSystemNotifications();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [generateSystemNotifications]);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    updateSettings: saveSettings,
    refreshNotifications: async () => {
      await Promise.all([
        generateWarehouseNotifications(),
        generatePayrollNotifications(),
        generateBudgetNotifications(),
        generateSystemNotifications(),
      ]);
    },
  };
}
