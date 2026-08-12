/**
 * Audit Log System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Simple audit logging for tracking important operations
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit entry
 */
export function logAuditAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  try {
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Store in localStorage for now (in production, this should go to a database)
    const auditLogs = getAuditLogs();
    auditLogs.push(auditEntry);
    
    // Keep only last 1000 entries to prevent storage overflow
    if (auditLogs.length > 1000) {
      auditLogs.splice(0, auditLogs.length - 1000);
    }
    
    localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', auditEntry);
    }
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

/**
 * Get audit logs
 */
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem('audit_logs');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific entity
 */
export function getAuditLogsForEntity(entity: string, entityId?: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => 
    log.entity === entity && 
    (entityId === undefined || log.entityId === entityId)
  );
}

/**
 * Get audit logs for a specific user
 */
export function getAuditLogsForUser(userId: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => log.userId === userId);
}

/**
 * Get audit logs within a date range
 */
export function getAuditLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Clear audit logs (use with caution)
 */
export function clearAuditLogs(): void {
  try {
    localStorage.removeItem('audit_logs');
  } catch (error) {
    console.error('Error clearing audit logs:', error);
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SYNC: 'sync',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

/**
 * Common entities
 */
export const AuditEntities = {
  PROJECT: 'project',
  BUDGET: 'budget',
  TRANSACTION: 'transaction',
  EMPLOYEE: 'employee',
  SUPPLIER: 'supplier',
  CLIENT: 'client',
  WAREHOUSE: 'warehouse',
  PURCHASE_ORDER: 'purchase_order',
  USER: 'user',
} as const;