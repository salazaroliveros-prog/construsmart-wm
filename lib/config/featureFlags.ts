// Sistema de feature flags para controlar funcionalidades

type FeatureFlag = 'newAuth' | 'advancedSync' | 'betaAnalytics' | 'virtualizedTables' | 'gestureNavigation';

interface FeatureFlags {
  [key: string]: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags;
  private storageKey = 'wm_feature_flags';

  constructor() {
    this.flags = this.loadFlags();
  }

  private loadFlags(): FeatureFlags {
    // Flags por defecto (todos desactivados por defecto)
    const defaultFlags: FeatureFlags = {
      newAuth: false,
      advancedSync: false,
      betaAnalytics: false,
      virtualizedTables: false,
      gestureNavigation: false,
    };

    // Cargar flags guardados
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          return { ...defaultFlags, ...JSON.parse(stored) };
        }
      } catch (error) {
        console.error('Error loading feature flags:', error);
      }
    }

    return defaultFlags;
  }

  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] || false;
  }

  enable(flag: FeatureFlag): void {
    this.flags[flag] = true;
    this.saveFlags();
  }

  disable(flag: FeatureFlag): void {
    this.flags[flag] = false;
    this.saveFlags();
  }

  toggle(flag: FeatureFlag): void {
    this.flags[flag] = !this.flags[flag];
    this.saveFlags();
  }

  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  private saveFlags(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
      } catch (error) {
        console.error('Error saving feature flags:', error);
      }
    }
  }

  // Reset a defaults
  reset(): void {
    this.flags = {
      newAuth: false,
      advancedSync: false,
      betaAnalytics: false,
      virtualizedTables: false,
      gestureNavigation: false,
    };
    this.saveFlags();
  }
}

export const featureFlags = new FeatureFlagManager();

// Hook para usar feature flags en componentes
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlags.isEnabled(flag);
}

// Helper para verificar múltiples flags
export function useFeatureFlags(flags: FeatureFlag[]): Record<FeatureFlag, boolean> {
  const result: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
  flags.forEach(flag => {
    result[flag] = featureFlags.isEnabled(flag);
  });
  return result;
}