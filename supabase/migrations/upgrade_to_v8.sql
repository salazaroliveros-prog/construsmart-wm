-- CONSTRUCTORA WM/M&S - SUPABASE MIGRATION SCRIPT
-- Version: 7 → 8
-- Slogan: "CONSTRUYENDO EL FUTURO"
-- 
-- This migration script aligns the Supabase database with the exponential upgrade changes
-- Execute in Supabase SQL Editor or via Supabase CLI

-- ============================================
-- PROJECTS TABLE - Roadblock Detection Fields
-- ============================================

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS has_critical_roadblock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS roadblock_type TEXT CHECK (roadblock_type IN ('clima', 'material', 'personal', 'técnico', 'permiso', 'financiero', 'otro')),
ADD COLUMN IF NOT EXISTS roadblock_description TEXT,
ADD COLUMN IF NOT EXISTS roadblock_date DATE,
ADD COLUMN IF NOT EXISTS completion_buffer_days INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_has_critical_roadblock ON projects(has_critical_roadblock);
CREATE INDEX IF NOT EXISTS idx_projects_roadblock_type ON projects(roadblock_type);

-- ============================================
-- CLIENTS TABLE - Financial Information Fields
-- ============================================

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS account_balance DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS is_delinquent BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_account_balance ON clients(account_balance);
CREATE INDEX IF NOT EXISTS idx_clients_is_delinquent ON clients(is_delinquent);

-- ============================================
-- WAREHOUSE_STOCK TABLE - Auto-PO Fields
-- ============================================

ALTER TABLE warehouse_stock
ADD COLUMN IF NOT EXISTS preferred_supplier_id UUID,
ADD COLUMN IF NOT EXISTS auto_generate_po BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_po_date DATE,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_preferred_supplier ON warehouse_stock(preferred_supplier_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_auto_generate_po ON warehouse_stock(auto_generate_po);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_category ON warehouse_stock(category);

-- Add foreign key constraint for preferred supplier
-- Note: Type conversion from TEXT to UUID if needed
DO $$
BEGIN
  -- Check if column is TEXT type and convert to UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouse_stock' 
    AND column_name = 'preferred_supplier_id' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE warehouse_stock ALTER COLUMN preferred_supplier_id TYPE UUID USING preferred_supplier_id::uuid;
  END IF;
END $$;

ALTER TABLE warehouse_stock
ADD CONSTRAINT fk_warehouse_stock_supplier 
FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================
-- SUPPLIERS TABLE - Category and Preferred Fields
-- ============================================

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_categories ON suppliers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON suppliers(is_preferred);

-- ============================================
-- PAYROLL_RECORDS TABLE - Cost Overrun Fields
-- ============================================

ALTER TABLE payroll_records
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS planned_hours DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS budget_item_id UUID,
ADD COLUMN IF NOT EXISTS cost_overrun_amount DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_overrun_warning_fired BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_records_budget_item ON payroll_records(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_overrun_warning ON payroll_records(is_overrun_warning_fired);

-- Add foreign key constraint for budget item
-- Note: Type conversion from TEXT to UUID if needed
DO $$
BEGIN
  -- Check if column is TEXT type and convert to UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_records' 
    AND column_name = 'budget_item_id' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE payroll_records ALTER COLUMN budget_item_id TYPE UUID USING budget_item_id::uuid;
  END IF;
END $$;

ALTER TABLE payroll_records
ADD CONSTRAINT fk_payroll_records_budget_item 
FOREIGN KEY (budget_item_id) REFERENCES budget_items(id) ON DELETE SET NULL;

-- ============================================
-- PROJECT_LOGS TABLE - Roadblock Detection Fields
-- ============================================

ALTER TABLE project_logs
ADD COLUMN IF NOT EXISTS is_critical_roadblock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS roadblock_category TEXT CHECK (roadblock_category IN ('clima', 'material', 'personal', 'técnico', 'permiso', 'financiero', 'otro')),
ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_logs_is_critical_roadblock ON project_logs(is_critical_roadblock);
CREATE INDEX IF NOT EXISTS idx_project_logs_roadblock_category ON project_logs(roadblock_category);
CREATE INDEX IF NOT EXISTS idx_project_logs_severity ON project_logs(severity);

-- ============================================
-- FINANCIAL_TRANSACTIONS TABLE - Reference Field
-- ============================================

ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference);

-- ============================================
-- PENDING_DELETES TABLE - Ensure Exists
-- ============================================

CREATE TABLE IF NOT EXISTS pending_deletes (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  server_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_deletes_table ON pending_deletes(table_name);
CREATE INDEX IF NOT EXISTS idx_pending_deletes_created_at ON pending_deletes(created_at);

-- ============================================
-- VALIDATION AND DATA MIGRATION
-- ============================================

-- Update existing projects with default values for new fields
UPDATE projects 
SET 
  has_critical_roadblock = FALSE,
  completion_buffer_days = 0
WHERE has_critical_roadblock IS NULL;

-- Update existing clients with default values for new fields
UPDATE clients
SET
  account_balance = 0.00,
  credit_limit = 0.00,
  payment_terms_days = 30,
  is_delinquent = FALSE
WHERE account_balance IS NULL;

-- Update existing warehouse stock with default values for new fields
UPDATE warehouse_stock
SET
  auto_generate_po = FALSE
WHERE auto_generate_po IS NULL;

-- Update existing suppliers with default values for new fields
UPDATE suppliers
SET
  is_preferred = FALSE
WHERE is_preferred IS NULL;

-- Update existing payroll records with calculated values for new fields
UPDATE payroll_records
SET
  total_hours = (days_worked * 8) + COALESCE(overtime_hours, 0),
  hourly_rate = daily_rate / 8,
  planned_hours = days_worked * 8,
  is_overrun_warning_fired = FALSE
WHERE total_hours IS NULL;

-- Update existing project logs with default values for new fields
UPDATE project_logs
SET
  is_critical_roadblock = FALSE,
  severity = 'low'
WHERE is_critical_roadblock IS NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_deletes ENABLE ROW LEVEL SECURITY;

-- Create policies for new columns (example - adjust based on your auth strategy)
-- Note: These are example policies - adjust based on your actual authentication setup

-- Projects policies
CREATE POLICY "Users can view projects" ON projects FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (auth.uid()::text = user_id::text);

-- Similar policies for other tables would be added here based on your auth strategy

-- ============================================
-- MIGRATION COMPLETION
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to version 8 completed successfully';
  RAISE NOTICE 'Added exponential upgrade fields to all tables';
  RAISE NOTICE 'Indexes created for performance optimization';
  RAISE NOTICE 'RLS policies updated';
END $$;
