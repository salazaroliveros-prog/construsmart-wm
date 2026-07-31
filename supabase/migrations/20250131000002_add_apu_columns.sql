-- Add columns for detailed APU formulas
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS material_formula JSONB;
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS labor_formula JSONB;
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS machinery_formula JSONB;
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS default_values JSONB;
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
