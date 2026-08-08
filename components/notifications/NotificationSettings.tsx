/**
 * CONSTRUCTORA WM/M&S - NOTIFICATION SETTINGS COMPONENT
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Panel de configuración para sistema de notificaciones
 * Permite personalizar umbrales, horarios y preferencias por módulo
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Clock, 
  Sliders, 
  Smartphone,
  Monitor,
  Save,
  RotateCcw
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { type NotificationSettings, NotificationModule, NotificationSeverity } from '@/lib/types/notifications';
import { cn } from '@/lib/utils';

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

const severityLabels: Record<NotificationSeverity, string> = {
  critical: 'Críticas',
  warning: 'Advertencias',
  info: 'Informativas',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface NotificationSettingsProps {
  onClose?: () => void;
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { settings, updateSettings } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleModulePreferenceChange = (
    module: NotificationModule,
    severity: NotificationSeverity,
    value: boolean
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      modulePreferences: {
        ...prev.modulePreferences,
        [module]: {
          ...prev.modulePreferences[module],
          [severity]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleThresholdChange = (threshold: keyof NotificationSettings['thresholds'], value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [threshold]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateSettings(localSettings);
      setHasChanges(false);
      // Show success feedback
      setTimeout(() => {
        setIsSaving(false);
        onClose?.();
      }, 500);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Configuración de Notificaciones</h2>
            <p className="text-sm text-white/60">Personaliza tus alertas y preferencias</p>
          </div>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Configuración General
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-white">Notificaciones en App</p>
                  <p className="text-xs text-white/60">Mostrar alertas dentro de la aplicación</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('enableInApp', !localSettings.enableInApp)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  localSettings.enableInApp ? 'bg-cyan-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    localSettings.enableInApp ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-sm text-white">Notificaciones Push</p>
                  <p className="text-xs text-white/60">Alertas en el dispositivo (PWA)</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('enablePush', !localSettings.enablePush)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  localSettings.enablePush ? 'bg-cyan-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    localSettings.enablePush ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horario Silencioso
          </h3>
          
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Activar horario silencioso</p>
                <p className="text-xs text-white/60">No enviar notificaciones en horario especificado</p>
              </div>
              <button
                onClick={() => handleSettingChange('quietHours', {
                  ...localSettings.quietHours,
                  enabled: !localSettings.quietHours.enabled
                })}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  localSettings.quietHours.enabled ? 'bg-cyan-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    localSettings.quietHours.enabled ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>

            {localSettings.quietHours.enabled && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1">
                  <label className="text-xs text-white/60 mb-1 block">Inicio</label>
                  <input
                    type="time"
                    value={localSettings.quietHours.start}
                    onChange={(e) => handleSettingChange('quietHours', {
                      ...localSettings.quietHours,
                      start: e.target.value
                    })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <span className="text-white/40 self-center">-</span>
                <div className="flex-1">
                  <label className="text-xs text-white/60 mb-1 block">Fin</label>
                  <input
                    type="time"
                    value={localSettings.quietHours.end}
                    onChange={(e) => handleSettingChange('quietHours', {
                      ...localSettings.quietHours,
                      end: e.target.value
                    })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thresholds */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Umbrales de Alerta
          </h3>
          
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white">Exceso de Presupuesto</p>
                <span className="text-cyan-400 font-mono text-sm">{localSettings.thresholds.budgetOverage}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={localSettings.thresholds.budgetOverage}
                onChange={(e) => handleThresholdChange('budgetOverage', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-xs text-white/60 mt-1">Alertar cuando el presupuesto exceda este porcentaje</p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white">Sobrecosto de Mano de Obra</p>
                <span className="text-cyan-400 font-mono text-sm">{localSettings.thresholds.laborOverrun}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={localSettings.thresholds.laborOverrun}
                onChange={(e) => handleThresholdChange('laborOverrun', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-xs text-white/60 mt-1">Alertar cuando el costo de mano de obra exceda este porcentaje</p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white">Días sin Reconciliar</p>
                <span className="text-cyan-400 font-mono text-sm">{localSettings.thresholds.unreconciledDays}d</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={localSettings.thresholds.unreconciledDays}
                onChange={(e) => handleThresholdChange('unreconciledDays', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-xs text-white/60 mt-1">Alertar después de estos días sin reconciliar transacciones</p>
            </div>
          </div>
        </div>

        {/* Module Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Preferencias por Módulo
          </h3>
          
          <div className="space-y-2">
            {(Object.keys(moduleLabels) as NotificationModule[]).map(module => (
              <div key={module} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-medium">{moduleLabels[module]}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(Object.keys(severityLabels) as NotificationSeverity[]).map(severity => (
                    <button
                      key={severity}
                      onClick={() => handleModulePreferenceChange(module, severity, !localSettings.modulePreferences[module][severity])}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        localSettings.modulePreferences[module][severity]
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      )}
                    >
                      {severityLabels[severity]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
