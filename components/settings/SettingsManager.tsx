'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Palette, Sliders, Eye, EyeOff, Zap, Moon, Sun, RotateCcw, Check,
  Building2, DollarSign, FileText, Monitor, Database, Sparkles, Upload, X,
  LayoutDashboard, Bell, Ruler, Globe
} from 'lucide-react';
import {
  DEFAULT_UI_SETTINGS, UISettings,
  CompanySettings, FinancialSettings, ExportSettings,
  DashboardSettings, NotificationSettings, ThemeAccentSettings, LocaleSettings,
  COLOR_PALETTES, GLASS_PRESETS
} from '@/lib/types/uiSettings';
import { applyUISettings } from '@/lib/utils/applySettings';
import { updateSettingsSingleton } from '@/lib/hooks/useBusinessSettings';
import { useToast } from '@/components/ui/Toast';

export default function SettingsManager() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UISettings>(DEFAULT_UI_SETTINGS);
  const [activeTab, setActiveTab] = useState<'appearance' | 'glass' | 'dashboard' | 'notifications' | 'accents' | 'company' | 'financial' | 'export' | 'locale' | 'sync'>('appearance');
  const [hasChanges, setHasChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('uiSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        if (parsed.company?.logoUrl) {
          setLogoPreview(parsed.company.logoUrl);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

const saveSettings = () => {
    try {
      localStorage.setItem('uiSettings', JSON.stringify(settings));
      // Aplica los estilos UI usando la función centralizada (única fuente de verdad)
      applyUISettings(settings);
      // Notifica al singleton para que todos los hooks useBusinessSettings reaccionen
      updateSettingsSingleton(settings);
      setHasChanges(false);
      showToast('success', 'Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Error al guardar la configuración');
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_UI_SETTINGS);
    setLogoPreview('');
    setHasChanges(true);
    showToast('info', 'Configuración restablecida');
  };

  const updateSetting = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
    setSettings(prev => {
      const next: UISettings = { ...prev, [key]: value };
      return next;
    });
    setHasChanges(true);
  };

  const updateCompanySetting = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setSettings(prev => ({ 
      ...prev, 
      company: { ...prev.company, [key]: value } 
    }));
    setHasChanges(true);
  };

  const updateFinancialSetting = <K extends keyof FinancialSettings>(key: K, value: FinancialSettings[K]) => {
    setSettings(prev => ({ 
      ...prev, 
      financial: { ...prev.financial, [key]: value } 
    }));
    setHasChanges(true);
  };

  const updateExportSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings(prev => ({ 
      ...prev, 
      export: { ...prev.export, [key]: value } 
    }));
    setHasChanges(true);
  };

  const updateDashboardSetting = <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      dashboard: { ...prev.dashboard, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateNotificationSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateAccentSetting = <K extends keyof ThemeAccentSettings>(key: K, value: ThemeAccentSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      accents: { ...prev.accents, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateLocaleSetting = <K extends keyof LocaleSettings>(key: K, value: LocaleSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      locale: { ...prev.locale, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateCustomColor = <K extends keyof NonNullable<UISettings['customColors']>>(key: K, value: NonNullable<UISettings['customColors']>[K]) => {
    setSettings(prev => ({
      ...prev,
      customColors: {
        ...(prev.customColors ?? {}),
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const resetCustomColors = () => {
    setSettings(prev => ({
      ...prev,
      customColors: undefined,
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        updateCompanySetting('logoUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    updateCompanySetting('logoUrl', '');
  };

  const applyGlassPreset = (presetId: string) => {
    const preset = GLASS_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSettings(prev => ({
        ...prev,
        glassPreset: presetId,
        cardTransparency: preset.cardTransparency,
        glassBlurIntensity: preset.glassBlurIntensity,
        glassGrainIntensity: preset.glassGrainIntensity,
        borderOpacity: preset.borderOpacity,
        shadowIntensity: preset.shadowIntensity,
      }));
      setHasChanges(true);
    }
  };

  const tabs = [
    { id: 'appearance' as const, label: 'Apariencia', icon: Palette },
    { id: 'glass' as const, label: 'Glassmorphism', icon: Sliders },
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
    { id: 'accents' as const, label: 'Acentos', icon: Ruler },
    { id: 'company' as const, label: 'Empresa', icon: Building2 },
    { id: 'financial' as const, label: 'Finanzas', icon: DollarSign },
    { id: 'export' as const, label: 'Exportación', icon: FileText },
    { id: 'locale' as const, label: 'Región', icon: Globe },
    { id: 'sync' as const, label: 'Sincronización', icon: Database },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Configuración del Sistema</h2>
            <p className="text-xs sm:text-sm text-white/60">Personaliza toda la plataforma</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={resetSettings}
              className="px-3 sm:px-4 py-2 rounded-lg glass-button text-white/60 hover:text-white flex items-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm ${
              hasChanges
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>

      {/* Tabs - Mobile Scrollable */}
      <div className="flex gap-2 overflow-x-auto overflow-anchor-none pb-3 sm:pb-4 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        {activeTab === 'appearance' && (
          <AppearanceTab
            settings={settings}
            updateSetting={updateSetting}
            updateCustomColor={updateCustomColor}
            resetCustomColors={resetCustomColors}
          />
        )}
        {activeTab === 'glass' && <GlassTab settings={settings} updateSetting={updateSetting} applyPreset={applyGlassPreset} />}
        {activeTab === 'dashboard' && <DashboardTab settings={settings} updateSetting={updateDashboardSetting} />}
        {activeTab === 'notifications' && <NotificationsTab settings={settings} updateSetting={updateNotificationSetting} />}
        {activeTab === 'accents' && <AccentsTab settings={settings} updateSetting={updateAccentSetting} />}
        {activeTab === 'company' && <CompanyTab settings={settings} updateSetting={updateCompanySetting} logoPreview={logoPreview} onLogoUpload={handleLogoUpload} onRemoveLogo={handleRemoveLogo} />}
        {activeTab === 'financial' && <FinancialTab settings={settings} updateSetting={updateFinancialSetting} />}
        {activeTab === 'export' && <ExportTab settings={settings} updateSetting={updateExportSetting} />}
        {activeTab === 'locale' && <LocaleTab settings={settings} updateSetting={updateLocaleSetting} />}
        {activeTab === 'sync' && <SyncTab settings={settings} updateSetting={updateSetting} />}
      </div>
    </div>
  );
}

function AppearanceTab({
  settings,
  updateSetting,
  updateCustomColor,
  resetCustomColors,
}: {
  settings: UISettings;
  updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void;
  updateCustomColor: <K extends keyof NonNullable<UISettings['customColors']>>(key: K, value: NonNullable<UISettings['customColors']>[K]) => void;
  resetCustomColors: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Paleta de Colores
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {COLOR_PALETTES.map(palette => (
            <button
              key={palette.id}
              onClick={() => {
                updateSetting('colorPalette', palette.id);
                resetCustomColors();
              }}
              className={`relative group rounded-xl overflow-hidden transition-all ${
                settings.colorPalette === palette.id && !settings.customColors
                  ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0f172a]'
                  : 'hover:scale-105'
              }`}
            >
              <div
                className="h-16 sm:h-20 w-full"
                style={{
                  background: `linear-gradient(to bottom, ${palette.backgroundStart}, ${palette.backgroundEnd})`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
                    }}
                  />
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-[#0f172a]">
                <p className="text-[10px] sm:text-sm font-medium text-white text-center">{palette.name}</p>
              </div>
              {settings.colorPalette === palette.id && (
                <div className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Colores personalizados</p>
              <p className="text-[10px] sm:text-xs text-white/60">Define valores hex directos para toda la suite.</p>
            </div>
            <button
              onClick={resetCustomColors}
              className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white/70 hover:bg-white/5"
            >
              Restablecer
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Primario', key: 'primary' as const },
              { label: 'Secundario', key: 'secondary' as const },
              { label: 'Acento', key: 'accent' as const },
              { label: 'Fondo inicio', key: 'backgroundStart' as const },
              { label: 'Fondo fin', key: 'backgroundEnd' as const },
            ].map(color => (
              <label key={color.key} className="space-y-2">
                <span className="block text-[10px] sm:text-xs text-white/70">{color.label}</span>
                <input
                  type="color"
                  value={settings.customColors?.[color.key] ?? '#000000'}
                  onChange={e => updateCustomColor(color.key, e.target.value)}
                  className="w-full h-12 rounded-xl border border-white/10 bg-[#0f172a] p-0"
                />
              </label>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-white mb-2">Previsualización</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${settings.customColors?.primary ?? 'var(--primary-color)'}, ${settings.customColors?.secondary ?? 'var(--secondary-color)'})` }}>
                <p className="text-xs text-white">Primario → Secundario</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${settings.customColors?.backgroundStart ?? 'var(--background-start)'}, ${settings.customColors?.backgroundEnd ?? 'var(--background-end)'})` }}>
                <p className="text-xs text-white">Fondo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Modo de Tema
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {([
            { id: 'dark' as const, label: 'Oscuro', icon: Moon },
            { id: 'light' as const, label: 'Claro', icon: Sun },
            { id: 'auto' as const, label: 'Auto', icon: Monitor },
          ]).map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => updateSetting('themeMode', mode.id)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all ${
                  settings.themeMode === mode.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Modo de Rendimiento
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {([
            { id: 'high' as const, label: 'Alto', desc: 'Efectos máximos' },
            { id: 'balanced' as const, label: 'Balanceado', desc: 'Equilibrado' },
            { id: 'low' as const, label: 'Bajo', desc: 'Máxima velocidad' },
          ]).map(mode => (
            <button
              key={mode.id}
              onClick={() => updateSetting('performanceMode', mode.id)}
              className={`p-3 sm:p-4 rounded-xl border transition-all ${
                settings.performanceMode === mode.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <p className="text-xs sm:text-sm font-medium text-white mb-1">{mode.label}</p>
              <p className="text-[10px] sm:text-xs text-white/50">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Accesibilidad
        </h3>
        
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-white">Modo Alto Contraste</p>
              <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Aumenta el contraste para mejor legibilidad</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.highContrast ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.highContrast ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-white">Modo Compacto</p>
              <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Reduce espaciado para mostrar más contenido</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('compactMode', !settings.compactMode)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.compactMode ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.compactMode ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Velocidad de Animaciones</label>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'normal', 'fast'] as const).map(speed => (
              <button
                key={speed}
                onClick={() => updateSetting('animationSpeed', speed)}
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.animationSpeed === speed
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {speed === 'slow' ? 'Lenta' : speed === 'normal' ? 'Normal' : 'Rápida'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassTab({ settings, updateSetting, applyPreset }: { 
  settings: UISettings; 
  updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void;
  applyPreset: (presetId: string) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Presets de Glassmorphism
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GLASS_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`p-3 sm:p-4 rounded-xl border transition-all text-left ${
                settings.glassPreset === preset.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <p className="text-xs sm:text-sm font-medium text-white mb-1">{preset.name}</p>
              <p className="text-[10px] sm:text-xs text-white/50">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Ajustes Manuales
        </h3>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Transparencia de Tarjetas</label>
          <div className="space-y-2 sm:space-y-3">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.cardTransparency}
              onChange={e => updateSetting('cardTransparency', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] sm:text-sm text-white/60">
              <span>Opaco</span>
              <span className="text-cyan-400 font-medium">{settings.cardTransparency}%</span>
              <span>Transparente</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Intensidad del Desenfoque (Blur)</label>
          <div className="space-y-2 sm:space-y-3">
            <input
              type="range"
              min="0"
              max="200"
              value={settings.glassBlurIntensity}
              onChange={e => updateSetting('glassBlurIntensity', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] sm:text-sm text-white/60">
              <span>Nítido</span>
              <span className="text-cyan-400 font-medium">{settings.glassBlurIntensity}px</span>
              <span>Desenfocado</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Granulometría del Efecto (Grain)</label>
          <div className="space-y-2 sm:space-y-3">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.glassGrainIntensity}
              onChange={e => updateSetting('glassGrainIntensity', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] sm:text-sm text-white/60">
              <span>Liso</span>
              <span className="text-cyan-400 font-medium">{settings.glassGrainIntensity}%</span>
              <span>Texturizado</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Opacidad de Bordes</label>
          <div className="space-y-2 sm:space-y-3">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.borderOpacity}
              onChange={e => updateSetting('borderOpacity', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] sm:text-sm text-white/60">
              <span>Invisible</span>
              <span className="text-cyan-400 font-medium">{settings.borderOpacity}%</span>
              <span>Visible</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Intensidad de Sombras</label>
          <div className="space-y-2 sm:space-y-3">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.shadowIntensity}
              onChange={e => updateSetting('shadowIntensity', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] sm:text-sm text-white/60">
              <span>Suave</span>
              <span className="text-cyan-400 font-medium">{settings.shadowIntensity}%</span>
              <span>Profunda</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyTab({ 
  settings, 
  updateSetting, 
  logoPreview, 
  onLogoUpload, 
  onRemoveLogo 
}: { 
  settings: UISettings; 
  updateSetting: <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => void;
  logoPreview: string;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Información de la Empresa
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Nombre de la Empresa</label>
          <input
            type="text"
            value={settings.company.name}
            onChange={e => updateSetting('name', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="CONSTRUCTORA WM/M&S"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Nombre Corto</label>
          <input
            type="text"
            value={settings.company.shortName}
            onChange={e => updateSetting('shortName', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="WM/M&S"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">NIT</label>
          <input
            type="text"
            value={settings.company.nit}
            onChange={e => updateSetting('nit', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="12345678-9"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Dirección</label>
          <input
            type="text"
            value={settings.company.address}
            onChange={e => updateSetting('address', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="Dirección fiscal"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Teléfono</label>
          <input
            type="text"
            value={settings.company.phone}
            onChange={e => updateSetting('phone', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="+502 1234-5678"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Email</label>
          <input
            type="email"
            value={settings.company.email}
            onChange={e => updateSetting('email', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="info@empresa.com"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Logo</label>
          <div className="flex items-center gap-3 sm:gap-4">
            {logoPreview ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-white/20">
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                <button
                  onClick={onRemoveLogo}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white/30" />
              </div>
            )}
            <div className="flex-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoUpload}
                  className="hidden"
                />
                <div className="glass-button px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
                  <Upload className="w-4 h-4" />
                  {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                </div>
              </label>
              <p className="text-[10px] sm:text-xs text-white/50 mt-1">PNG, JPG hasta 2MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialTab({ settings, updateSetting }: { 
  settings: UISettings; 
  updateSetting: <K extends keyof FinancialSettings>(key: K, value: FinancialSettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Configuración Financiera
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Moneda</label>
          <select
            value={settings.financial.currency}
            onChange={e => updateSetting('currency', e.target.value as 'GTQ' | 'USD' | 'EUR')}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
          >
            <option value="GTQ">Quetzal (GTQ)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Símbolo de Moneda</label>
          <input
            type="text"
            value={settings.financial.currencySymbol}
            onChange={e => updateSetting('currencySymbol', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="Q."
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Tasa de IVA (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.financial.vatRate}
            onChange={e => updateSetting('vatRate', Number(e.target.value))}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="12"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Margen de Ganancia Predeterminado (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.financial.profitMargin}
            onChange={e => updateSetting('profitMargin', Number(e.target.value))}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="20"
          />
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-white">Incluir IVA en Precios</p>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Los precios mostrados incluirán IVA</p>
          </div>
          <button
            onClick={() => updateSetting('includeVatInPrices', !settings.financial.includeVatInPrices)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.financial.includeVatInPrices ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.financial.includeVatInPrices ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Porcentaje de Indirectos (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.financial.indirectPercentage}
            onChange={e => updateSetting('indirectPercentage', Number(e.target.value))}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="15"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Porcentaje de Contingencia (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.financial.contingencyPercentage}
            onChange={e => updateSetting('contingencyPercentage', Number(e.target.value))}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Porcentaje de Utilidad Objetivo (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.financial.profitPercentage}
            onChange={e => updateSetting('profitPercentage', Number(e.target.value))}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
            placeholder="20"
          />
        </div>
      </div>
    </div>
  );
}

function ExportTab({ settings, updateSetting }: { 
  settings: UISettings; 
  updateSetting: <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Preferencias de Exportación
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h4 className="text-xs sm:text-sm font-medium text-white/80 mb-2">Exportación PDF</h4>
        
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-white">Incluir Logo</p>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Mostrar logo de empresa en PDF</p>
          </div>
          <button
            onClick={() => updateSetting('pdfIncludeLogo', !settings.export.pdfIncludeLogo)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.export.pdfIncludeLogo ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.export.pdfIncludeLogo ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-white">Incluir Firma</p>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Espacio para firma en PDF</p>
          </div>
          <button
            onClick={() => updateSetting('pdfIncludeSignature', !settings.export.pdfIncludeSignature)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.export.pdfIncludeSignature ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.export.pdfIncludeSignature ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-white">Desglose Detallado</p>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Incluir desglose completo de materiales</p>
          </div>
          <button
            onClick={() => updateSetting('pdfIncludeDetailedBreakdown', !settings.export.pdfIncludeDetailedBreakdown)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.export.pdfIncludeDetailedBreakdown ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.export.pdfIncludeDetailedBreakdown ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <h4 className="text-xs sm:text-sm font-medium text-white/80 mb-2 mt-4 sm:mt-6">Exportación CSV</h4>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Delimitador</label>
          <div className="grid grid-cols-2 gap-2">
            {([',' as const, ';' as const]).map(delimiter => (
              <button
                key={delimiter}
                onClick={() => updateSetting('csvDelimiter', delimiter)}
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.export.csvDelimiter === delimiter
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {delimiter === ',' ? 'Coma (,)' : 'Punto y Coma (;)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-white">Incluir Encabezados</p>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Primera fila con nombres de columnas</p>
          </div>
          <button
            onClick={() => updateSetting('csvIncludeHeaders', !settings.export.csvIncludeHeaders)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.export.csvIncludeHeaders ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.export.csvIncludeHeaders ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Formato de Fecha</label>
          <div className="grid grid-cols-3 gap-2">
            {(['DD/MM/YYYY' as const, 'MM/DD/YYYY' as const, 'YYYY-MM-DD' as const]).map(format => (
              <button
                key={format}
                onClick={() => updateSetting('dateFormat', format)}
                className={`px-2 sm:px-3 py-2 sm:py-3 rounded-lg border transition-all text-[10px] sm:text-xs ${
                  settings.export.dateFormat === format
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncTab({ settings, updateSetting }: { 
  settings: UISettings; 
  updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Sincronización
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-white">Sincronización Automática</p>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">Sincronizar datos automáticamente</p>
          </div>
          <button
            onClick={() => updateSetting('autoSync', !settings.autoSync)}
            className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
              settings.autoSync ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.autoSync ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Intervalo de Sincronización (minutos)</label>
          <div className="space-y-2 sm:space-y-3">
            <input
              type="range"
              min="1"
              max="60"
              value={settings.syncInterval}
              onChange={e => updateSetting('syncInterval', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              disabled={!settings.autoSync}
            />
            <div className="flex justify-between text-[10px] sm:text-sm text-white/60">
              <span>1 min</span>
              <span className={`text-cyan-400 font-medium ${!settings.autoSync ? 'opacity-50' : ''}`}>{settings.syncInterval} min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NUEVAS PESTAÑAS: Dashboard, Notificaciones, Acentos, Región
// ============================================================================

function DashboardTab({ settings, updateSetting }: {
  settings: UISettings;
  updateSetting: <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Personalización del Dashboard
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Columnas del Grid</label>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as const).map(cols => (
              <button
                key={cols}
                onClick={() => updateSetting('gridColumns', cols)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.dashboard.gridColumns === cols
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium text-white">Widgets Visibles</p>
          {([
            { key: 'showCharts' as const, label: 'Gráficos' },
            { key: 'showCalendar' as const, label: 'Calendario' },
            { key: 'showStats' as const, label: 'Estadísticas' },
            { key: 'showBudgetSummary' as const, label: 'Resumen de Presupuesto' },
          ]).map(widget => (
            <div key={widget.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs sm:text-sm text-white">{widget.label}</span>
              <button
                onClick={() => updateSetting(widget.key, !settings.dashboard[widget.key])}
                className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
                  settings.dashboard[widget.key] ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                  settings.dashboard[widget.key] ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ settings, updateSetting }: {
  settings: UISettings;
  updateSetting: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Configuración de Notificaciones
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-sm font-medium text-white/80 mb-2">Canales</p>
        {([
          { key: 'inAppEnabled' as const, label: 'En la App', desc: 'Notificaciones dentro de la plataforma' },
          { key: 'pushEnabled' as const, label: 'Push', desc: 'Notificaciones push en el navegador' },
          { key: 'emailEnabled' as const, label: 'Email', desc: 'Notificaciones por correo electrónico' },
        ]).map(channel => (
          <div key={channel.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-xs sm:text-sm font-medium text-white">{channel.label}</p>
              <p className="text-[10px] sm:text-xs text-white/60">{channel.desc}</p>
            </div>
            <button
              onClick={() => updateSetting(channel.key, !settings.notifications[channel.key])}
              className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
                settings.notifications[channel.key] ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.notifications[channel.key] ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`} />
            </button>
          </div>
        ))}

        <p className="text-xs sm:text-sm font-medium text-white/80 mb-2 mt-4">Eventos</p>
        {([
          { key: 'notifyOnSyncComplete' as const, label: 'Sincronización Completada' },
          { key: 'notifyOnError' as const, label: 'Errores del Sistema' },
          { key: 'notifyOnNewProject' as const, label: 'Nuevo Proyecto Creado' },
          { key: 'notifyOnLowStock' as const, label: 'Stock Bajo en Almacén' },
          { key: 'notifyOnBudgetExceeded' as const, label: 'Presupuesto Excedido' },
          { key: 'notifyOnPayrollDue' as const, label: 'Nómina por Vencer' },
        ]).map(event => (
          <div key={event.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs sm:text-sm text-white">{event.label}</span>
            <button
              onClick={() => updateSetting(event.key, !settings.notifications[event.key])}
              className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
                settings.notifications[event.key] ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${
                settings.notifications[event.key] ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccentsTab({ settings, updateSetting }: {
  settings: UISettings;
  updateSetting: <K extends keyof ThemeAccentSettings>(key: K, value: ThemeAccentSettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Acentos de Tema
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Bordes Redondeados</label>
          <div className="grid grid-cols-5 gap-2">
            {(['sm', 'md', 'lg', 'xl', 'full'] as const).map(radius => (
              <button
                key={radius}
                onClick={() => updateSetting('borderRadius', radius)}
                className={`px-2 py-2 rounded-lg border transition-all text-[10px] sm:text-xs ${
                  settings.accents.borderRadius === radius
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {radius === 'full' ? 'Full' : radius.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Espaciado</label>
          <div className="grid grid-cols-3 gap-2">
            {(['compact', 'normal', 'relaxed'] as const).map(spacing => (
              <button
                key={spacing}
                onClick={() => updateSetting('spacing', spacing)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.accents.spacing === spacing
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {spacing === 'compact' ? 'Compacto' : spacing === 'normal' ? 'Normal' : 'Relajado'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Estilo de Botones</label>
          <div className="grid grid-cols-3 gap-2">
            {(['glass', 'solid', 'outline'] as const).map(style => (
              <button
                key={style}
                onClick={() => updateSetting('buttonStyle', style)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.accents.buttonStyle === style
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {style === 'glass' ? 'Vidrio' : style === 'solid' ? 'Sólido' : 'Contorno'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Estilo de Tarjetas</label>
          <div className="grid grid-cols-3 gap-2">
            {(['glass', 'solid', 'border'] as const).map(style => (
              <button
                key={style}
                onClick={() => updateSetting('cardStyle', style)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.accents.cardStyle === style
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {style === 'glass' ? 'Vidrio' : style === 'solid' ? 'Sólido' : 'Borde'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Escala de Fuente</label>
          <div className="grid grid-cols-3 gap-2">
            {([0.875, 1, 1.125] as const).map(scale => (
              <button
                key={scale}
                onClick={() => updateSetting('fontScale', scale)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.accents.fontScale === scale
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {scale === 0.875 ? 'Pequeña' : scale === 1 ? 'Normal' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocaleTab({ settings, updateSetting }: {
  settings: UISettings;
  updateSetting: <K extends keyof LocaleSettings>(key: K, value: LocaleSettings[K]) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          Configuración Regional
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Idioma</label>
          <div className="grid grid-cols-2 gap-2">
            {(['es', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.locale.language === lang
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {lang === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Región</label>
          <div className="grid grid-cols-3 gap-2">
            {(['GT', 'US', 'EU'] as const).map(region => (
              <button
                key={region}
                onClick={() => updateSetting('region', region)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.locale.region === region
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {region === 'GT' ? 'Guatemala' : region === 'US' ? 'Estados Unidos' : 'Europa'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Formato de Números</label>
          <div className="grid grid-cols-3 gap-2">
            {(['es-GT', 'en-US', 'de-DE'] as const).map(nf => (
              <button
                key={nf}
                onClick={() => updateSetting('numberFormat', nf)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.locale.numberFormat === nf
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {nf === 'es-GT' ? '1,234.56' : nf === 'en-US' ? '1,234.56' : '1.234,56'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Primer Día de la Semana</label>
          <div className="grid grid-cols-2 gap-2">
            {([0, 1] as const).map(day => (
              <button
                key={day}
                onClick={() => updateSetting('firstDayOfWeek', day)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                  settings.locale.firstDayOfWeek === day
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {day === 0 ? 'Domingo' : 'Lunes'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-white mb-2">Zona Horaria</label>
          <select
            value={settings.locale.timezone}
            onChange={e => updateSetting('timezone', e.target.value)}
            className="w-full glass-input px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-white text-sm"
          >
            <option value="America/Guatemala">América/Guatemala (UTC-6)</option>
            <option value="America/New_York">América/Nueva York (UTC-5)</option>
            <option value="America/Chicago">América/Chicago (UTC-6)</option>
            <option value="America/Denver">América/Denver (UTC-7)</option>
            <option value="America/Los_Angeles">América/Los Ángeles (UTC-8)</option>
            <option value="Europe/Madrid">Europa/Madrid (UTC+1)</option>
            <option value="Europe/London">Europa/Londres (UTC+0)</option>
            <option value="Europe/Berlin">Europa/Berlín (UTC+1)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
