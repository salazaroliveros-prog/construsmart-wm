-- ============================================================================
-- CONSTRUCTORA WM/M&S - AUTO-REPAIR SCRIPT FOR REMOTE DB
-- Execute this in Supabase Dashboard -> SQL Editor AFTER running verify-remote-db.sql
--
-- This script repairs common schema mismatches between local migrations and
-- the remote Supabase database.
-- ============================================================================

-- ============================================================================
-- 1. Ensure update_updated_at_column function exists
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Ensure RLS is enabled on all tables
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  ] LOOP
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ============================================================================
-- 3. Drop and recreate anon all-access policies for core tables
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "Enable all access for %s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- 4. Drop and recreate anon all-access policies for new modules
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'project_logs', 'suppliers', 'purchase_orders', 'purchase_order_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "Enable all access for %s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- 5. Ensure updated_at triggers exist on all tables
-- ============================================================================
DO $$
DECLARE
  t text;
  trigger_name text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  ] LOOP
    trigger_name := 'update_' || t || '_updated_at';
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', trigger_name, t);
  END LOOP;
END $$;

-- ============================================================================
-- 6. Ensure sync_status constraints allow offline values
-- ============================================================================
DO $$
DECLARE
  t text;
  cons text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  ] LOOP
    FOR cons IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE rel.relname = t AND n.nspname = 'public' AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) LIKE '%sync_status%'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', t, cons);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I CHECK (sync_status IN (%s))',
      t,
      t || '_sync_status_check',
      (SELECT string_agg(quote_literal(v), ',' ORDER BY v)
       FROM unnest(ARRAY['synced','created_offline','updated_offline']::text[]) v)
    );
  END LOOP;
END $$;

-- ============================================================================
-- 7. Add missing columns if needed (idempotent)
-- ============================================================================

-- projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS calculated_duration INTEGER DEFAULT 0;

-- budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS length_m DECIMAL(10,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS width_m DECIMAL(10,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS depth_m DECIMAL(10,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS height_m DECIMAL(10,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS slab_type TEXT;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS apu_result JSONB;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS apu_params JSONB;

-- budget_item_breakdowns
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS quantity_unitary NUMERIC(10,4);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS total_quantity NUMERIC(12,2);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS waste_percentage NUMERIC(5,2) DEFAULT 5.0;

-- financial_transactions
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2) DEFAULT 1;
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unid';
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15,2) DEFAULT 0;

-- warehouse_stock
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- payroll_records
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;

-- project_logs
ALTER TABLE project_logs ADD COLUMN IF NOT EXISTS photos JSONB;

-- purchase_order_items
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity NUMERIC(10,2);

-- ============================================================================
-- 8. Ensure Realtime publication includes all tables
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 9. Create recommended indexes if missing
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_typology ON projects(typology);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_parent_id ON budget_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_item_id ON budget_item_breakdowns(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON payroll_records(project_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_project ON warehouse_stock(project_id);
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_activity_type ON project_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_log_date ON project_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_code ON purchase_orders(code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item_code ON purchase_order_items(item_code);

-- ============================================================================
-- 10. Final verification summary
-- ============================================================================
SELECT 
  'Auto-repair completed. Please re-run verify-remote-db.sql to confirm all checks pass.' AS status;
