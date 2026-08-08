/**
 * CONSTRUCTORA WM/M&S - NOTIFICATION SYSTEM TYPES
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Sistema de notificaciones inteligentes con contexto accionable
 * Integrado con QuickActionFab y hooks de detección existentes
 */

// ============================================================================
// CORE NOTIFICATION TYPES
// ============================================================================

export type NotificationSeverity = 'critical' | 'warning' | 'info';
export type NotificationModule = 'budget' | 'warehouse' | 'finance' | 'payroll' | 'project' | 'system';
export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface Notification {
  id: string;
  severity: NotificationSeverity;
  module: NotificationModule;
  title: string;
  message: string;
  actionLabel?: string;
  action?: () => void | Promise<void>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  status: NotificationStatus;
  expiresAt?: Date; // Para notificaciones temporales
}

// ============================================================================
// NOTIFICATION CATEGORIES BY MODULE
// ============================================================================

export interface BudgetNotification extends Notification {
  module: 'budget';
  metadata: {
    projectId?: string;
    projectName?: string;
    budgetId?: string;
    overagePercentage?: number;
    threshold?: number;
  };
}

export interface WarehouseNotification extends Notification {
  module: 'warehouse';
  metadata: {
    itemId?: string;
    itemCode?: string;
    itemDescription?: string;
    currentStock?: number;
    minimumThreshold?: number;
    unit?: string;
    autoGeneratePO?: boolean;
  };
}

export interface FinanceNotification extends Notification {
  module: 'finance';
  metadata: {
    transactionId?: string;
    projectId?: string;
    amount?: number;
    category?: string;
    unreconciledCount?: number;
  };
}

export interface PayrollNotification extends Notification {
  module: 'payroll';
  metadata: {
    employeeId?: string;
    projectId?: string;
    overrunPercentage?: number;
    threshold?: number;
    periodStart?: string;
    periodEnd?: string;
  };
}

export interface ProjectNotification extends Notification {
  module: 'project';
  metadata: {
    projectId?: string;
    projectName?: string;
    milestone?: string;
    dueDate?: string;
    daysRemaining?: number;
    status?: string;
  };
}

export interface SystemNotification extends Notification {
  module: 'system';
  metadata: {
    syncStatus?: 'syncing' | 'synced' | 'error';
    syncProgress?: number;
    isOnline?: boolean;
  };
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export interface NotificationSettings {
  enabled: boolean;
  enablePush: boolean;
  enableInApp: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  thresholds: {
    budgetOverage: number; // Percentage
    stockLow: number;      // Percentage of minimum
    laborOverrun: number;  // Percentage
    unreconciledDays: number;
  };
  modulePreferences: Record<NotificationModule, {
    critical: boolean;
    warning: boolean;
    info: boolean;
  }>;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  enablePush: false,
  enableInApp: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  thresholds: {
    budgetOverage: 10,    // Alert when budget exceeds by 10%
    stockLow: 100,       // Alert when stock reaches minimum
    laborOverrun: 15,    // Alert when labor cost exceeds by 15%
    unreconciledDays: 7, // Alert after 7 days unreconciled
  },
  modulePreferences: {
    budget: { critical: true, warning: true, info: false },
    warehouse: { critical: true, warning: true, info: true },
    finance: { critical: true, warning: true, info: false },
    payroll: { critical: true, warning: true, info: false },
    project: { critical: true, warning: true, info: true },
    system: { critical: true, warning: true, info: true },
  },
};

// ============================================================================
// NOTIFICATION CENTER STATE
// ============================================================================

export interface NotificationCenterState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  isOpen: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type NotificationUnion = 
  | BudgetNotification 
  | WarehouseNotification 
  | FinanceNotification 
  | PayrollNotification 
  | ProjectNotification 
  | SystemNotification;

export interface NotificationFilter {
  severity?: NotificationSeverity[];
  module?: NotificationModule[];
  status?: NotificationStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
