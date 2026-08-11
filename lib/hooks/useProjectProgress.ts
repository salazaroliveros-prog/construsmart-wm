import { useState, useEffect, useCallback } from 'react';
import { offlineDB, LocalProjectLog, LocalFinancialTransaction } from '@/lib/db/offlineStore';
import { useRealtimeRefresh } from './useRealtimeRefresh';
import { useToast } from '@/components/ui/Toast';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

interface ProjectProgress {
  projectId: string;
  logs: LocalProjectLog[];
  transactions: LocalFinancialTransaction[];
  physicalProgress: number;
  financialProgress: number;
  totalSpent: number;
  lastUpdated: string;
}

export function useProjectProgress(projectId?: string) {
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadProgress = useCallback(async (pid: string) => {
    if (!pid) {
      setProgress(null);
      return;
    }

    setLoading(true);
    try {
      // Validar propiedad del proyecto antes de exponer su progreso
      const userId = await getUserScope();
      const userProjects = scopeLocalRows(
        await offlineDB.projects.where('id').equals(pid).toArray(),
        userId
      );
      if (userProjects.length === 0) {
        setProgress(null);
        return;
      }

      const [logs, transactions] = await Promise.all([
        scopeLocalRows(await offlineDB.projectLogs.where('project_id').equals(pid).toArray(), userId),
        scopeLocalRows(await offlineDB.financialTransactions.where('project_id').equals(pid).toArray(), userId),
      ]);

      // Calculate aggregate progress from logs - use MAX instead of latest for better accuracy
      const progressLogs = logs
        .filter(log => log.activity_type === 'progress' && log.physical_progress !== undefined);
      
      // Use the maximum physical progress value from all progress logs
      const physicalProgress = progressLogs.length > 0
        ? Math.max(...progressLogs.map(log => log.physical_progress || 0))
        : 0;
      
      // Calculate financial progress from transactions
      const totalSpent = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.total_cost, 0);

      setProgress({
        projectId: pid,
        logs,
        transactions,
        physicalProgress,
        financialProgress: 0, // Will be calculated by ProgressTracker with budget context
        totalSpent,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading project progress:', error);
      showToast('error', 'Error al cargar el progreso del proyecto');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load progress when projectId changes
  useEffect(() => {
    if (projectId) {
      loadProgress(projectId);
    } else {
      setProgress(null);
    }
  }, [projectId, loadProgress]);

  // Refresh progress when logs or transactions change
  useRealtimeRefresh(
    ['project_logs', 'financial_transactions'],
    () => {
      if (projectId) {
        loadProgress(projectId);
      }
    }
  );

  // Update progress manually (e.g., after creating/updating a log)
  const updateProgress = useCallback(async (pid: string) => {
    await loadProgress(pid);
  }, [loadProgress]);

  return {
    progress,
    loading,
    updateProgress,
    refresh: () => projectId && loadProgress(projectId),
  };
}

// Export types for use in components
export type { ProjectProgress };