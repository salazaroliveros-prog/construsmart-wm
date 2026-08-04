// ============================================================================
// Tipos compartidos del módulo de Presupuestos
// ============================================================================

import type { APUResult } from '@/lib/types/apu';

export interface BudgetItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  category: string;
  apuResult?: APUResult;
  timeRequired?: number;
}

