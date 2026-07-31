-- ============================================================================
-- APU Integration Tables for CONSTRUCTORA WM/M&S
-- Adds support for APU (Análisis de Precios Unitarios) data in budget items
-- ============================================================================

-- Update budget_items table to include APU fields
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS apu_result JSONB,
ADD COLUMN IF NOT EXISTS apu_params JSONB;

-- Add comment to explain APU fields
COMMENT ON COLUMN budget_items.apu_result IS 'APU calculation results including breakdown (materials, labor, machinery)';
COMMENT ON COLUMN budget_items.apu_params IS 'APU input parameters for re-calculation';

-- Add index for budget_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);

-- Add index for project_id via budget for budget queries
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);

-- Enable Row Level Security (RLS) - uncomment if using RLS
-- ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON budget_items TO authenticated;
-- GRANT ALL ON budgets TO authenticated;
