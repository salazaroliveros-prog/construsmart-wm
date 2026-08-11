-- Agregar campos de tracking local a tablas principales
-- Estos campos permiten persistir información de roadblocks y consumo warehouse

-- 1. Agregar campos de roadblock a projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS has_critical_roadblock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS roadblock_type TEXT CHECK (roadblock_type IN ('clima', 'material', 'personal', 'técnico', 'permiso', 'financiero', 'otro')),
ADD COLUMN IF NOT EXISTS roadblock_description TEXT,
ADD COLUMN IF NOT EXISTS roadblock_date DATE;

-- 2. Agregar campos de consumo warehouse a budget_items
ALTER TABLE public.budget_items
ADD COLUMN IF NOT EXISTS actual_consumption NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS consumption_variance NUMERIC DEFAULT 0;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN public.projects.has_critical_roadblock IS 'Indica si el proyecto tiene un roadblock crítico';
COMMENT ON COLUMN public.projects.roadblock_type IS 'Tipo de roadblock (clima, material, personal, técnico, permiso, financiero, otro)';
COMMENT ON COLUMN public.projects.roadblock_description IS 'Descripción del roadblock';
COMMENT ON COLUMN public.projects.roadblock_date IS 'Fecha del roadblock';

COMMENT ON COLUMN public.budget_items.actual_consumption IS 'Consumo real de material desde almacén';
COMMENT ON COLUMN public.budget_items.consumption_variance IS 'Diferencia entre estimado y actual (actual - estimated)';
