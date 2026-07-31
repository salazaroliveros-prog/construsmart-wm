-- CONSTRUCTORA WM/M&S - OFFLINE SYNC COLUMNS MIGRATION
-- Slogan: "CONSTRUYENDO EL FUTURO"
-- Version: 1.1.0
-- Description: Add columns for offline-first sync functionality

-- Add offline sync columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS budget_total NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS calculated_duration INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add offline sync columns to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add offline sync columns to budget_items table
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS apu_result JSONB,
ADD COLUMN IF NOT EXISTS apu_params JSONB;

-- Add offline sync columns to budget_item_breakdown table
ALTER TABLE budget_item_breakdown 
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add offline sync columns to financial_transactions table
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add offline sync columns to payroll_records table
ALTER TABLE payroll_records 
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add offline sync columns to warehouse_stock table
ALTER TABLE warehouse_stock 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for project_id in warehouse_stock for better performance
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_project ON warehouse_stock(project_id);

-- Create index for sync_status across tables for better sync performance
CREATE INDEX IF NOT EXISTS idx_projects_sync_status ON projects(sync_status);
CREATE INDEX IF NOT EXISTS idx_budgets_sync_status ON budgets(sync_status);
CREATE INDEX IF NOT EXISTS idx_budget_items_sync_status ON budget_items(sync_status);
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdown_sync_status ON budget_item_breakdown(sync_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_sync_status ON financial_transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_sync_status ON payroll_records(sync_status);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_sync_status ON warehouse_stock(sync_status);

-- Create index for updated_at across tables for better sync performance
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_budgets_updated_at ON budgets(updated_at);
CREATE INDEX IF NOT EXISTS idx_budget_items_updated_at ON budget_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_updated_at ON financial_transactions(updated_at);
CREATE INDEX IF NOT EXISTS idx_payroll_records_updated_at ON payroll_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_updated_at ON warehouse_stock(updated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
DROP TRIGGER IF EXISTS update_warehouse_stock_updated_at ON warehouse_stock;

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_stock_updated_at BEFORE UPDATE ON warehouse_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN projects.budget_total IS 'Total budget calculated from budget module';
COMMENT ON COLUMN projects.calculated_duration IS 'Duration calculated from budget module in days';
COMMENT ON COLUMN projects.sync_status IS 'Sync status for offline-first functionality';
COMMENT ON COLUMN projects.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN budget_items.apu_result IS 'APU calculation result stored as JSONB';
COMMENT ON COLUMN budget_items.apu_params IS 'APU parameters used for calculation stored as JSONB';
COMMENT ON COLUMN warehouse_stock.project_id IS 'Project ID for project-specific warehouse stock';
