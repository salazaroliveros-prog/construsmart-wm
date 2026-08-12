'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Clock } from 'lucide-react';

interface DeviationAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  variancePercent: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface DeviationAlertsProps {
  projectId?: string;
  budgetTotal: number;
  actualTotal?: number;
  threshold?: number; // Porcentaje de desviación para alertar (default: 10%)
}

export default function DeviationAlerts({ 
  projectId, 
  budgetTotal, 
  actualTotal = 0, 
  threshold = 10 
}: DeviationAlertsProps) {
  const [alerts, setAlerts] = useState<DeviationAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    if (!actualTotal || actualTotal === 0 || !budgetTotal) {
      setAlerts([]);
      return;
    }

    const variance = actualTotal - budgetTotal;
    const variancePercent = (Math.abs(variance) / budgetTotal) * 100;

    const newAlerts: DeviationAlert[] = [];

    // Alerta de exceso de presupuesto
    if (variance > 0 && variancePercent > threshold) {
      newAlerts.push({
        id: `deviation-excess-${Date.now()}`,
        type: variancePercent > threshold * 2 ? 'critical' : 'warning',
        category: 'Exceso de Presupuesto',
        message: `Los gastos reales exceden el presupuesto en ${variancePercent.toFixed(1)}% ($${variance.toLocaleString()})`,
        variancePercent,
        threshold,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // Alerta de ahorro significativo
    if (variance < 0 && variancePercent > threshold * 1.5) {
      newAlerts.push({
        id: `deviation-savings-${Date.now()}`,
        type: 'info',
        category: 'Ahorro Significativo',
        message: `Los gastos reales están ${variancePercent.toFixed(1)}% por debajo del presupuesto ($${Math.abs(variance).toLocaleString()})`,
        variancePercent,
        threshold,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // Alerta de alerta temprana (cercano al threshold)
    if (variance > 0 && variancePercent > threshold * 0.8 && variancePercent <= threshold) {
      newAlerts.push({
        id: `deviation-early-${Date.now()}`,
        type: 'warning',
        category: 'Alerta Temprana',
        message: `Los gastos están cerca del límite del presupuesto (${variancePercent.toFixed(1)}% de ${threshold}% permitido)`,
        variancePercent,
        threshold,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    setAlerts(newAlerts);
  }, [budgetTotal, actualTotal, threshold, projectId]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'ahora mismo';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} horas`;
    return `hace ${Math.floor(seconds / 86400)} días`;
  };

  if (alerts.length === 0) {
    return null;
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = alerts.filter(a => a.type === 'critical');

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {/* Summary Badge */}
      {showAlerts && unacknowledgedAlerts.length > 0 && (
        <button
          onClick={() => setShowAlerts(false)}
          className="w-full glass-panel rounded-xl p-3 border border-white/10 mb-2 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-cyan-400" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium text-sm">
                {unacknowledgedAlerts.length} alerta{unacknowledgedAlerts.length !== 1 ? 's' : ''} de desviación
              </p>
              <p className="text-white/60 text-xs">
                {criticalAlerts.length > 0 ? `${criticalAlerts.length} crítica${criticalAlerts.length !== 1 ? 's' : ''}` : 'Revisar presupuesto'}
              </p>
            </div>
            <X className="w-4 h-4 text-white/60" />
          </div>
        </button>
      )}

      {/* Alerts List */}
      {!showAlerts && (
        <button
          onClick={() => setShowAlerts(true)}
          className="glass-button rounded-full p-2 border border-white/10 hover:border-white/20 transition-all"
        >
          <Bell className="w-5 h-5 text-cyan-400" />
          {unacknowledgedAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-white text-xs flex items-center justify-center">
              {unacknowledgedAlerts.length}
            </span>
          )}
        </button>
      )}

      {showAlerts && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-panel rounded-xl p-4 border ${
                alert.type === 'critical' 
                  ? 'border-red-500/30 bg-red-500/10' 
                  : alert.type === 'warning' 
                    ? 'border-amber-500/30 bg-amber-500/10' 
                    : 'border-cyan-500/30 bg-cyan-500/10'
              } ${alert.acknowledged ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {alert.type === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium uppercase ${
                      alert.type === 'critical' 
                        ? 'text-red-400' 
                        : alert.type === 'warning' 
                          ? 'text-amber-400' 
                          : 'text-cyan-400'
                    }`}>
                      {alert.category}
                    </span>
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-white text-sm">{alert.message}</p>
                  <p className="text-white/60 text-xs mt-1">
                    Umbral: {alert.threshold}% | Actual: {alert.variancePercent.toFixed(1)}%
                  </p>
                </div>

                <div className="flex gap-1">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="p-1 text-white/60 hover:text-white transition-colors"
                      title="Marcar como leído"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 text-white/60 hover:text-white transition-colors"
                    title="Descartar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}