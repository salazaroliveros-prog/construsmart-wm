// ============================================================================
// Global Budget State Management
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
// Replaces st.session_state["presupuesto_activo"] from Streamlit spec
// ============================================================================

import { ProjectTypology } from '@/lib/types/apu';
import { ProjectTimeImpact } from '@/lib/calculators/renglonCalculator';

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

const STORAGE_KEY = 'wm_presupuesto_activo';

export const budgetState = {
  // Get active budget from localStorage
  get: (): ActiveBudgetState | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading budget state:', error);
      return null;
    }
  },

  // Set active budget to localStorage
  set: (state: ActiveBudgetState): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving budget state:', error);
    }
  },

  // Clear active budget
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing budget state:', error);
    }
  },

  // Check if budget exists for project
  existsForProject: (projectId: string): boolean => {
    const state = budgetState.get();
    return state?.projectId === projectId;
  },
};
