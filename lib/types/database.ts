/**
 * CONSTRUCTORA WM/M&S - TIPOS ESTRICTOS DE SUPABASE (Database Types)
 * Slogan: "CONSTRUYENDO EL FUTURO"
 *
 * Tipos manuales alineados con el esquema real de Supabase.
 * Respaldan payloads de mutación y respuestas de consultas.
 */

export type ProjectStatus = 'planning' | 'execution' | 'paused' | 'completed';
export type ProjectTypology = 'residential' | 'commercial' | 'industrial' | 'civil' | 'public';
export type QualityLevel = 'basic' | 'moderate' | 'premium';
export type SyncStatus = 'synced' | 'created_offline' | 'updated_offline' | 'syncing' | 'pending' | 'sync_failed';

export interface ProjectRow {
  id: string;
  user_id: string;
  code: string;
  name: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  location: string;
  typology: ProjectTypology;
  area_m2: number;
  quality_level: QualityLevel;
  status: ProjectStatus;
  start_date: string | null;
  estimated_end_date: string | null;
  duration_days: number;
  total_budget: number;
  budget_total: number | null;
  calculated_duration: number | null;
  has_critical_roadblock: boolean;
  roadblock_type: string | null;
  roadblock_description: string | null;
  roadblock_date: string | null;
  completion_buffer_days: number | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<ProjectRow, 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>>;

export interface BudgetRow {
  id: string;
  user_id: string;
  project_id: string;
  version: number;
  direct_cost: number;
  indirect_percentage: number;
  contingency_percentage: number;
  profit_percentage: number;
  total_amount: number;
  duration_days: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type BudgetInsert = Omit<BudgetRow, 'created_at' | 'updated_at'>;
export type BudgetUpdate = Partial<Omit<BudgetRow, 'id' | 'created_at' | 'updated_at'>>;

// Esquema de referencia agrupado (compatible con createClient<Database> de Supabase)
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      budgets: {
        Row: BudgetRow;
        Insert: BudgetInsert;
        Update: BudgetUpdate;
      };
    };
  };
}
