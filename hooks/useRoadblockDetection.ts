/**
 * CONSTRUCTORA WM/M&S - ROADBLOCK DETECTION HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook for automatic roadblock detection from project logs (Bitácoras)
 * Cross-module pipeline: ProjectLogManager ↔ ProjectManager
 * 
 * Automatically detects critical roadblocks in daily logs and:
 * 1. Updates project roadblock flags
 * 2. Calculates completion buffer days
 * 3. Triggers high-visibility warnings in ProjectManager
 */

import { useState, useEffect } from 'react';
import { offlineDB, LocalProject, LocalProjectLog } from '@/lib/db/offlineStore';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

export interface RoadblockAlert {
  projectId: string;
  projectName: string;
  roadblockType: string;
  roadblockDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  bufferDaysRemaining: number;
}

export interface RoadblockDetectionResult {
  roadblocks: RoadblockAlert[];
  totalCritical: number;
  totalHigh: number;
  affectedProjects: number;
}

// Critical roadblock keywords in multiple languages (Spanish + English)
const CRITICAL_KEYWORDS = [
  // Spanish
  'retraso por clima',
  'falta de cemento',
  'falta de material',
  'sin material',
  'problema técnico',
  'permiso denegado',
  'problema financiero',
  'huelga',
  'personal',
  'accidente',
  'falta de',
  'sin',
  'parada',
  'detenido',
  'esperando',
  'atrasado',
  'retraso',
  // English
  'weather delay',
  'cement shortage',
  'material shortage',
  'out of stock',
  'technical issue',
  'permit denied',
  'financial problem',
  'strike',
  'staff',
  'accident',
  'lack of',
  'without',
  'stopped',
  'halted',
  'waiting',
  'delayed',
  'delay'
];

const ROADBLOCK_CATEGORIES: Record<string, 'clima' | 'material' | 'personal' | 'técnico' | 'permiso' | 'financiero' | 'otro'> = {
  // Spanish
  'clima': 'clima',
  'lluvia': 'clima',
  'tiempo': 'clima',
  'cemento': 'material',
  'material': 'material',
  'personal': 'personal',
  'técnico': 'técnico',
  'permiso': 'permiso',
  'financiero': 'financiero',
  'dinero': 'financiero',
  'crédito': 'financiero',
  'pago': 'financiero',
  // English
  'weather': 'clima',
  'rain': 'clima',
  'storm': 'clima',
  'cement': 'material',
  'staff': 'personal',
  'worker': 'personal',
  'labor': 'personal',
  'technical': 'técnico',
  'permit': 'permiso',
  'financial': 'financiero',
  'money': 'financiero',
  'budget': 'financiero',
  'cost': 'financiero',
  'credit': 'financiero',
  'payment': 'financiero'
};

export const useRoadblockDetection = () => {
  const [alerts, setAlerts] = useState<RoadblockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const detectRoadblocks = async (): Promise<RoadblockDetectionResult> => {
    try {
      setIsLoading(true);

      // Get all logs scoped by user
      const userId = await getUserScope();
      const logs = scopeLocalRows(await offlineDB.projectLogs.toArray(), userId);
      const projects = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      
      const detectedRoadblocks: RoadblockAlert[] = [];
      
      // Group logs by project
      const logsByProject = new Map<string, LocalProjectLog[]>();
      logs.forEach(log => {
        if (!logsByProject.has(log.project_id)) {
          logsByProject.set(log.project_id, []);
        }
        logsByProject.get(log.project_id)!.push(log);
      });
      
      // Analyze each project's logs for roadblocks
      for (const [projectId, projectLogs] of logsByProject.entries()) {
        const project = projects.find(p => p.id === projectId);
        if (!project) continue;
        
        // Check recent logs (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentLogs = projectLogs.filter(
          log => new Date(log.log_date) >= sevenDaysAgo
        );
        
        // Analyze for roadblocks
        for (const log of recentLogs) {
          const description = log.description.toLowerCase();
          const activityType = log.activity_type;
          
          // Only check issue-type logs or high-severity entries
          if (activityType === 'issue' || log.severity === 'critical' || log.severity === 'high') {
            // Check for critical keywords
            const detectedKeyword = CRITICAL_KEYWORDS.find(keyword => 
              description.includes(keyword)
            );
            
            if (detectedKeyword) {
              // Determine roadblock category
              let roadblockCategory: 'clima' | 'material' | 'personal' | 'técnico' | 'permiso' | 'financiero' | 'otro' = 'otro';
              
              for (const [keyword, category] of Object.entries(ROADBLOCK_CATEGORIES)) {
                if (description.includes(keyword)) {
                  roadblockCategory = category;
                  break;
                }
              }
              
              // Calculate buffer days remaining - consider project status
              let bufferDays = 0;
              if (project.estimated_end_date && project.status === 'execution') {
                bufferDays = Math.max(0, Math.ceil(
                  (new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                ));
              } else if (project.status === 'paused') {
                // For paused projects, use the estimated end date but mark as paused
                bufferDays = project.estimated_end_date 
                  ? Math.max(0, Math.ceil(
                    (new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  ))
                  : 0;
              }
              
              detectedRoadblocks.push({
                projectId: project.id!,
                projectName: project.name,
                roadblockType: roadblockCategory,
                roadblockDescription: log.description,
                severity: log.severity as 'low' | 'medium' | 'high' | 'critical' || 'high',
                date: log.log_date,
                bufferDaysRemaining: bufferDays
              });
              
              // Update project with roadblock flags
              await offlineDB.projects.update(project.id!, {
                has_critical_roadblock: true,
                roadblock_type: roadblockCategory,
                roadblock_description: log.description,
                roadblock_date: log.log_date,
                completion_buffer_days: bufferDays
              });
              
              break; // Only flag the most recent critical roadblock
            }
          }
        }
      }
      
      setAlerts(detectedRoadblocks);
      
      return {
        roadblocks: detectedRoadblocks,
        totalCritical: detectedRoadblocks.filter(r => r.severity === 'critical').length,
        totalHigh: detectedRoadblocks.filter(r => r.severity === 'high').length,
        affectedProjects: new Set(detectedRoadblocks.map(r => r.projectId)).size
      };
      
    } catch (error) {
      console.error('[Roadblock Detection] Error:', error);
      return {
        roadblocks: [],
        totalCritical: 0,
        totalHigh: 0,
        affectedProjects: 0
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoadblockFlag = async (projectId: string) => {
    try {
      // Consistencia con la BD (roadblock_type: string|null): al limpiar se usa null,
      // no undefined, para que calce con el esquema de Supabase en database.ts.
      await offlineDB.projects.update(projectId, {
        has_critical_roadblock: false,
        roadblock_type: null,
        roadblock_description: null,
        roadblock_date: null
      } as unknown as Parameters<typeof offlineDB.projects.update>[1]);
      
      // Update local state
      setAlerts(prev => prev.filter(alert => alert.projectId !== projectId));
    } catch (error) {
      console.error('[Roadblock Detection] Error clearing flag:', error);
    }
  };

  return {
    alerts,
    isLoading,
    detectRoadblocks,
    clearRoadblockFlag
  };
};
