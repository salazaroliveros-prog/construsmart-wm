/**
 * CONSTRUCTORA WM/M&S - EARNED VALUE MANAGEMENT HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook for Earned Value Management (EVM) calculations and predictive forecasting
 * Cross-module pipeline: FinancialTransactions → ProjectLogs → AnalyticsDashboard
 * 
 * Implements standard EVM formulas:
 * - SV = EV - PV (Schedule Variance)
 * - CV = EV - AC (Cost Variance)
 * - SPI = EV / PV (Schedule Performance Index)
 * - CPI = EV / AC (Cost Performance Index)
 * - EAC = BAC / CPI (Estimate at Completion)
 * - VAC = BAC - EAC (Variance at Completion)
 */

import { useState, useEffect } from 'react';
import { offlineDB, LocalFinancialTransaction, LocalProjectLog, LocalProject } from '@/lib/db/offlineStore';
import { 
  EVMMetrics, 
  EVMPrediction, 
  EVMForecastConfig, 
  EVMAnalysis, 
  EVMPeriodData,
  EVMThresholds,
  DEFAULT_EVM_THRESHOLDS 
} from '@/lib/types/evm';
import { formatGTQ } from '@/lib/config/app.config';

export const useEarnedValueManagement = () => {
  const [metrics, setMetrics] = useState<EVMMetrics | null>(null);
  const [predictions, setPredictions] = useState<EVMPrediction[]>([]);
  const [analysis, setAnalysis] = useState<EVMAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  /**
   * Calculate EVM metrics for a project
   */
  const calculateEVM = async (projectId: string, thresholds: EVMThresholds = DEFAULT_EVM_THRESHOLDS): Promise<EVMMetrics> => {
    try {
      setIsCalculating(true);

      // Get project data
      const project = await offlineDB.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get financial transactions (actual costs)
      const transactions = await offlineDB.financialTransactions
        .where('project_id')
        .equals(projectId)
        .toArray();

      // Calculate Actual Cost (AC)
      const actualCost = transactions.reduce((sum, tx) => {
        if (tx.type === 'expense' || tx.type === 'payment') {
          return sum + (tx.amount || 0);
        }
        return sum;
      }, 0);

      // Get project logs for progress tracking
      const logs = await offlineDB.projectLogs
        .where('project_id')
        .equals(projectId)
        .toArray();

      // Calculate progress based on logs and physical completion
      const totalLogs = logs.length;
      const completedActivities = logs.filter(log => 
        log.activity_type === 'completion' || log.activity_type === 'milestone'
      ).length;
      
      const progress = totalLogs > 0 ? (completedActivities / totalLogs) * 100 : 0;

      // Calculate Planned Value (PV) based on project timeline
      const now = new Date();
      const startDate = project.start_date ? new Date(project.start_date) : now;
      const endDate = project.estimated_end_date ? new Date(project.estimated_end_date) : now;
      
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsedDuration = now.getTime() - startDate.getTime();
      
      const timeProgress = totalDuration > 0 ? Math.min(100, (elapsedDuration / totalDuration) * 100) : 0;
      
      // PV = Budget × Time Progress
      const plannedValue = (project.budget_total || 0) * (timeProgress / 100);

      // Calculate Earned Value (EV) = Budget × Actual Progress
      const earnedValue = (project.budget_total || 0) * (progress / 100);

      // Calculate Variances
      const scheduleVariance = earnedValue - plannedValue; // SV = EV - PV
      const costVariance = earnedValue - actualCost; // CV = EV - AC

      // Calculate Performance Indices
      const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1; // SPI = EV / PV
      const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 1; // CPI = EV / AC

      // Calculate Forecasting Metrics
      const budgetAtCompletion = project.budget_total || 0; // BAC
      const estimatedAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion; // EAC = BAC / CPI
      const varianceAtCompletion = budgetAtCompletion - estimatedAtCompletion; // VAC = BAC - EAC
      const estimateToComplete = estimatedAtCompletion - actualCost; // ETC = EAC - AC

      // Performance Indicators
      const isAheadOfSchedule = schedulePerformanceIndex > 1;
      const isBehindSchedule = schedulePerformanceIndex < 1;
      const isUnderBudget = costPerformanceIndex > 1;
      const isOverBudget = costPerformanceIndex < 1;

      const evmMetrics: EVMMetrics = {
        plannedValue,
        earnedValue,
        actualCost,
        scheduleVariance,
        costVariance,
        schedulePerformanceIndex,
        costPerformanceIndex,
        budgetAtCompletion,
        estimatedAtCompletion,
        varianceAtCompletion,
        estimateToComplete,
        isAheadOfSchedule,
        isBehindSchedule,
        isUnderBudget,
        isOverBudget,
        calculatedAt: new Date().toISOString(),
      };

      setMetrics(evmMetrics);
      return evmMetrics;

    } catch (error) {
      console.error('[EVM] Error calculating metrics:', error);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Generate predictive forecast curve
   */
  const generateForecast = async (
    projectId: string, 
    config: Partial<EVMForecastConfig> = {}
  ): Promise<EVMPrediction[]> => {
    try {
      const currentMetrics = await calculateEVM(projectId);
      const project = await offlineDB.projects.get(projectId);
      
      if (!project || !currentMetrics) {
        return [];
      }

      const forecastConfig: EVMForecastConfig = {
        forecastPeriod: config.forecastPeriod || 30, // Default 30 days
        projectDuration: config.projectDuration || 180, // Default 180 days
        startDate: config.startDate || project.start_date || new Date().toISOString(),
        currentProgress: config.currentProgress || 0,
        dailyBurnRate: config.dailyBurnRate || currentMetrics.actualCost / 30, // Assume 30 days elapsed
        expectedAcceleration: config.expectedAcceleration || 1.0,
      };

      const predictions: EVMPrediction[] = [];
      const startDate = new Date(forecastConfig.startDate);
      const budgetPerDay = (project.budget_total || 0) / forecastConfig.projectDuration;

      // Generate prediction points
      for (let day = 0; day <= forecastConfig.forecastPeriod; day += 7) { // Weekly intervals
        const predictionDate = new Date(startDate);
        predictionDate.setDate(predictionDate.getDate() + day);

        const timeProgress = Math.min(100, (day / forecastConfig.projectDuration) * 100);
        const cumulativeProgress = Math.min(100, forecastConfig.currentProgress + (timeProgress * forecastConfig.expectedAcceleration));

        const plannedValue = budgetPerDay * day;
        const predictedEV = (project.budget_total || 0) * (cumulativeProgress / 100);
        const predictedAC = forecastConfig.dailyBurnRate * day * currentMetrics.costPerformanceIndex;
        const predictedSV = predictedEV - plannedValue;
        const predictedCV = predictedEV - predictedAC;

        predictions.push({
          date: predictionDate.toISOString().split('T')[0],
          plannedValue,
          predictedEV,
          predictedAC,
          predictedSV,
          predictedCV,
          cumulativeProgress,
        });
      }

      setPredictions(predictions);
      return predictions;

    } catch (error) {
      console.error('[EVM] Error generating forecast:', error);
      return [];
    }
  };

  /**
   * Perform complete EVM analysis with recommendations
   */
  const analyzeProject = async (
    projectId: string, 
    thresholds: EVMThresholds = DEFAULT_EVM_THRESHOLDS
  ): Promise<EVMAnalysis> => {
    try {
      const metrics = await calculateEVM(projectId, thresholds);
      const predictions = await generateForecast(projectId);

      // Calculate health score (0-100)
      const spiScore = Math.min(100, Math.max(0, metrics.schedulePerformanceIndex * 100));
      const cpiScore = Math.min(100, Math.max(0, metrics.costPerformanceIndex * 100));
      const healthScore = (spiScore + cpiScore) / 2;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (healthScore < 50) riskLevel = 'critical';
      else if (healthScore < 70) riskLevel = 'high';
      else if (healthScore < 85) riskLevel = 'medium';

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (metrics.isBehindSchedule) {
        recommendations.push('Proyecto retrasado - Considerar acelerar actividades críticas');
        if (metrics.schedulePerformanceIndex < thresholds.spiCritical) {
          recommendations.push('CRÍTICO: Revisión urgente de cronograma necesaria');
        }
      }
      
      if (metrics.isOverBudget) {
        recommendations.push('Proyecto sobre presupuesto - Revisar costos');
        if (metrics.costPerformanceIndex < thresholds.cpiCritical) {
          recommendations.push('CRÍTICO: Implementar medidas de control de costos inmediatas');
        }
      }
      
      if (metrics.isAheadOfSchedule && metrics.isUnderBudget) {
        recommendations.push('Excelente desempeño - Mantener estrategia actual');
      }

      // Calculate trends (simplified)
      const trends = {
        spiTrend: 'stable' as 'improving' | 'stable' | 'declining',
        cpiTrend: 'stable' as 'improving' | 'stable' | 'declining',
      };

      const analysis: EVMAnalysis = {
        metrics,
        predictions,
        healthScore,
        riskLevel,
        recommendations,
        trends,
      };

      setAnalysis(analysis);
      return analysis;

    } catch (error) {
      console.error('[EVM] Error analyzing project:', error);
      throw error;
    }
  };

  /**
   * Get historical EVM data for trend analysis
   */
  const getHistoricalData = async (projectId: string): Promise<EVMPeriodData[]> => {
    try {
      // This would typically be implemented with a separate EVM history table
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[EVM] Error getting historical data:', error);
      return [];
    }
  };

  return {
    metrics,
    predictions,
    analysis,
    isCalculating,
    calculateEVM,
    generateForecast,
    analyzeProject,
    getHistoricalData,
  };
};
