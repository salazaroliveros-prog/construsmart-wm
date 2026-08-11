/**
 * CONSTRUCTORA WM/M&S - ESTADO GLOBAL CONSOLIDADO
 * Slogan: "CONSTRUYENDO EL FUTURO"
 *
 * Store global unificado usando Zustand
 * Reemplaza múltiples mecanismos de estado fragmentados:
 * - budgetState (localStorage)
 * - useBusinessSettings (context)
 * - useNotifications (context)
 *
 * Beneficios:
 * - Estado centralizado y predecible
 * - Persistencia automática en localStorage
 * - DevTools integrados para debugging
 * - TypeScript con inferencia completa
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectTypology } from '@/lib/types/apu';
import { ProjectTimeImpact } from '@/lib/calculators/renglonCalculator';

// ============================================================================
// TIPOS
// ============================================================================

export interface ActiveBudgetState {
  projectId?: string;
  budgetId?: string;
  typology: ProjectTypology;
  costDirectTotal: number;
  costTotalWithIndirects: number;
  breakdown: {
    materials: number;
    labor: number;
    machinery: number;
  };
  timeImpact?: ProjectTimeImpact;
  renglonTimeData?: Record<string, number>;
  topographyData?: {
    volumeCut: number;
    volumeFill: number;
    terrainArea: number;
    soilType: string;
  };
  calculatedAt: string;
}

export interface FinancialSettings {
  currency: string;
  locale: string;
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface GlobalState {
  // Estado de presupuesto activo
  activeBudget: ActiveBudgetState | null;
  setActiveBudget: (budget: ActiveBudgetState | null) => void;
  clearActiveBudget: () => void;

  // Configuración financiera
  financialSettings: FinancialSettings;
  setFinancialSettings: (settings: Partial<FinancialSettings>) => void;
  resetFinancialSettings: () => void;

  // Notificaciones
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;

  // Estado de UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

const defaultFinancialSettings: FinancialSettings = {
  currency: 'GTQ',
  locale: 'es-GT',
  indirectPercentage: 15,
  contingencyPercentage: 10,
  profitPercentage: 20,
};

// ============================================================================
// STORE
// ============================================================================

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // ==================== PRESUPUESTO ACTIVO ====================
      activeBudget: null,
      setActiveBudget: (budget) => set({ activeBudget: budget }),
      clearActiveBudget: () => set({ activeBudget: null }),

      // ==================== CONFIGURACIÓN FINANCIERA ====================
      financialSettings: defaultFinancialSettings,
      setFinancialSettings: (settings) =>
        set((state) => ({
          financialSettings: { ...state.financialSettings, ...settings },
        })),
      resetFinancialSettings: () => set({ financialSettings: defaultFinancialSettings }),

      // ==================== NOTIFICACIONES ====================
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50), // Mantener máximo 50 notificaciones
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // ==================== ESTADO DE UI ====================
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // ==================== THEME ====================
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'wm-global-store',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir ciertas partes del estado
      partialize: (state) => ({
        activeBudget: state.activeBudget,
        financialSettings: state.financialSettings,
        notifications: state.notifications.filter((n) => !n.read), // Solo no leídas
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);

// ============================================================================
// SELECTORS PARA OPTIMIZACIÓN
// ============================================================================

export const useActiveBudget = () => useGlobalStore((state) => state.activeBudget);
export const useFinancialSettings = () => useGlobalStore((state) => state.financialSettings);
export const useNotifications = () => useGlobalStore((state) => state.notifications);
export const useUnreadNotifications = () =>
  useGlobalStore((state) => state.notifications.filter((n) => !n.read));
export const useSidebarOpen = () => useGlobalStore((state) => state.sidebarOpen);
export const useTheme = () => useGlobalStore((state) => state.theme);

// ============================================================================
// HELPERS PARA MIGRACIÓN DESDE SISTEMAS ANTIGUOS
// ============================================================================

// Migrar desde budgetState antiguo
export const migrateFromBudgetState = () => {
  if (typeof window === 'undefined') return;
  try {
    const oldState = localStorage.getItem('wm_presupuesto_activo');
    if (oldState) {
      const parsed = JSON.parse(oldState);
      useGlobalStore.getState().setActiveBudget(parsed);
      localStorage.removeItem('wm_presupuesto_activo');
      console.log('✅ Migrado budgetState antiguo a globalStore');
    }
  } catch (error) {
    console.error('Error migrando budgetState:', error);
  }
};

// Migrar desde localStorage de settings antiguos
export const migrateFromOldSettings = () => {
  if (typeof window === 'undefined') return;
  try {
    const oldSettings = localStorage.getItem('wm_financial_settings');
    if (oldSettings) {
      const parsed = JSON.parse(oldSettings);
      useGlobalStore.getState().setFinancialSettings(parsed);
      localStorage.removeItem('wm_financial_settings');
      console.log('✅ Migrados settings antiguos a globalStore');
    }
  } catch (error) {
    console.error('Error migrando settings:', error);
  }
};

// Ejecutar migraciones automáticamente al importar
if (typeof window !== 'undefined') {
  migrateFromBudgetState();
  migrateFromOldSettings();
}
