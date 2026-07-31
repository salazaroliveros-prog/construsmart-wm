'use client';

import { useState, useEffect } from 'react';
import { Settings, Palette, Sliders, Eye, EyeOff, Zap, Moon, Sun, RotateCcw, Check } from 'lucide-react';
import { DEFAULT_UI_SETTINGS, COLOR_PALETTES, UISettings, ColorPalette } from '@/lib/types/uiSettings';
import { useToast } from '@/components/ui/Toast';

export default function SettingsManager() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UISettings>(DEFAULT_UI_SETTINGS);
  const [activeTab, setActiveTab] = useState<'colors' | 'glass' | 'accessibility'>('colors');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('uiSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('uiSettings', JSON.stringify(settings));
      applySettings(settings);
      setHasChanges(false);
      showToast('success', 'Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Error al guardar la configuración');
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_UI_SETTINGS);
    setHasChanges(true);
    showToast('info', 'Configuración restablecida');
  };

  const applySettings = (newSettings: UISettings) => {
    const palette = COLOR_PALETTES.find(p => p.id === newSettings.colorPalette) || COLOR_PALETTES[0];

    // Apply color palette
    document.documentElement.style.setProperty('--primary-color', palette.primary);
    document.documentElement.style.setProperty('--secondary-color', palette.secondary);
    document.documentElement.style.setProperty('--accent-color', palette.accent);
    document.documentElement.style.setProperty('--background-start', palette.backgroundStart);
    document.documentElement.style.setProperty('--background-end', palette.backgroundEnd);

    // Apply CSS custom properties for dynamic values
    document.documentElement.style.setProperty('--glass-blur-intensity', `${newSettings.glassBlurIntensity}px`);
    document.documentElement.style.setProperty('--glass-grain-intensity', `${newSettings.glassGrainIntensity / 100}`);
    document.documentElement.style.setProperty('--card-transparency', `${newSettings.cardTransparency / 100}`);
    document.documentElement.style.setProperty('--border-opacity', `${newSettings.borderOpacity / 100}`);
    document.documentElement.style.setProperty('--shadow-intensity', `${newSettings.shadowIntensity / 100}`);
    document.documentElement.style.setProperty('--gradient-intensity', `${newSettings.backgroundGradientIntensity / 100}`);

    // Apply animation speed
    const animationDuration = newSettings.animationSpeed === 'slow' ? '0.5s' : newSettings.animationSpeed === 'fast' ? '0.15s' : '0.3s';
    document.documentElement.style.setProperty('--animation-duration', animationDuration);

    // Apply accessibility modes
    if (newSettings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (newSettings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  };

  const updateSetting = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const tabs = [
    { id: 'colors' as const, label: 'Colores', icon: Palette },
    { id: 'glass' as const, label: 'Efectos Glass', icon: Sliders },
    { id: 'accessibility' as const, label: 'Accesibilidad', icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configuración de Interfaz</h2>
            <p className="text-sm text-white/60">Personaliza la apariencia de la plataforma</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={resetSettings}
              className="px-4 py-2 rounded-lg glass-button text-white/60 hover:text-white flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
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
      <div className="glass-panel rounded-2xl p-6">
        {activeTab === 'colors' && <ColorsTab settings={settings} updateSetting={updateSetting} />}
        {activeTab === 'glass' && <GlassTab settings={settings} updateSetting={updateSetting} />}
        {activeTab === 'accessibility' && <AccessibilityTab settings={settings} updateSetting={updateSetting} />}
      </div>
    </div>
  );
}

function ColorsTab({ settings, updateSetting }: { settings: UISettings; updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          Paleta de Colores
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {COLOR_PALETTES.map(palette => (
            <button
              key={palette.id}
              onClick={() => updateSetting('colorPalette', palette.id)}
              className={`relative group rounded-xl overflow-hidden transition-all ${
                settings.colorPalette === palette.id
                  ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0f172a]'
                  : 'hover:scale-105'
              }`}
            >
              <div
                className="h-20 w-full"
                style={{
                  background: `linear-gradient(to bottom, ${palette.backgroundStart}, ${palette.backgroundEnd})`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
                    }}
                  />
                </div>
              </div>
              <div className="p-3 bg-[#0f172a]">
                <p className="text-sm font-medium text-white text-center">{palette.name}</p>
              </div>
              {settings.colorPalette === palette.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Intensidad del Gradiente de Fondo
        </h3>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.backgroundGradientIntensity}
            onChange={e => updateSetting('backgroundGradientIntensity', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-sm text-white/60">
            <span>Suave</span>
            <span className="text-cyan-400 font-medium">{settings.backgroundGradientIntensity}%</span>
            <span>Intenso</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassTab({ settings, updateSetting }: { settings: UISettings; updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          Efectos Glassmorphism
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Transparencia de Tarjetas</label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.cardTransparency}
            onChange={e => updateSetting('cardTransparency', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-sm text-white/60">
            <span>Opaco</span>
            <span className="text-cyan-400 font-medium">{settings.cardTransparency}%</span>
            <span>Transparente</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Intensidad del Desenfoque (Blur)</label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.glassBlurIntensity}
            onChange={e => updateSetting('glassBlurIntensity', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-sm text-white/60">
            <span>Nítido</span>
            <span className="text-cyan-400 font-medium">{settings.glassBlurIntensity}%</span>
            <span>Desenfocado</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Granulometría del Efecto (Grain)</label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.glassGrainIntensity}
            onChange={e => updateSetting('glassGrainIntensity', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-sm text-white/60">
            <span>Liso</span>
            <span className="text-cyan-400 font-medium">{settings.glassGrainIntensity}%</span>
            <span>Texturizado</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Opacidad de Bordes</label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.borderOpacity}
            onChange={e => updateSetting('borderOpacity', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-sm text-white/60">
            <span>Invisible</span>
            <span className="text-cyan-400 font-medium">{settings.borderOpacity}%</span>
            <span>Visible</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Intensidad de Sombras</label>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.shadowIntensity}
            onChange={e => updateSetting('shadowIntensity', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-sm text-white/60">
            <span>Suave</span>
            <span className="text-cyan-400 font-medium">{settings.shadowIntensity}%</span>
            <span>Profunda</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessibilityTab({ settings, updateSetting }: { settings: UISettings; updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          Accesibilidad
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium text-white">Modo Alto Contraste</p>
              <p className="text-sm text-white/60">Aumenta el contraste para mejor legibilidad</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.highContrast ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.highContrast ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-violet-400" />
            <div>
              <p className="font-medium text-white">Modo Compacto</p>
              <p className="text-sm text-white/60">Reduce espaciado para mostrar más contenido</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('compactMode', !settings.compactMode)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.compactMode ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.compactMode ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Velocidad de Animaciones</label>
        <div className="grid grid-cols-3 gap-2">
          {(['slow', 'normal', 'fast'] as const).map(speed => (
            <button
              key={speed}
              onClick={() => updateSetting('animationSpeed', speed)}
              className={`px-4 py-3 rounded-lg border transition-all ${
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
  );
}
