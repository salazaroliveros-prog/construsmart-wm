-- ============================================================================
-- CONSTRUCTORA WM/M&S - REMOTE DB VERIFICATION SCRIPT
-- Execute this in Supabase Dashboard -> SQL Editor
-- Project: yibjsruoxjlgdnkgylld
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- ============================================================================
SELECT 
  tablename,
  CASE WHEN tablename IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  )
ORDER BY tablename;

-- ============================================================================
-- SECTION 2: COLUMN VERIFICATION PER TABLE
-- ============================================================================

-- projects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- budgets
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'budgets'
ORDER BY ordinal_position;

-- budget_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'budget_items'
ORDER BY ordinal_position;

-- budget_item_breakdowns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'budget_item_breakdowns'
ORDER BY ordinal_position;

-- financial_transactions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'financial_transactions'
ORDER BY ordinal_position;

-- payroll_employees
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payroll_employees'
ORDER BY ordinal_position;

-- payroll_records
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payroll_records'
ORDER BY ordinal_position;

-- warehouse_stock
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'warehouse_stock'
ORDER BY ordinal_position;

-- clients
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'clients'
ORDER BY ordinal_position;

-- project_logs
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'project_logs'
ORDER BY ordinal_position;

-- suppliers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'suppliers'
ORDER BY ordinal_position;

-- purchase_orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'purchase_orders'
ORDER BY ordinal_position;

-- purchase_order_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'purchase_order_items'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 3: INDEX VERIFICATION
-- ============================================================================
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 4: RLS STATUS
-- ============================================================================
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class 
WHERE relname IN (
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  )
ORDER BY relname;

-- ============================================================================
-- SECTION 5: RLS POLICIES CHECK
-- ============================================================================
SELECT 
  tablename,
  policyname,
  roles,
  cmd AS operation,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  )
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SECTION 6: REALTIME PUBLICATION CHECK
-- ============================================================================
SELECT 
  tablename,
  pubname AS publication
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
    'financial_transactions', 'payroll_employees', 'payroll_records',
    'warehouse_stock', 'clients', 'project_logs', 'suppliers',
    'purchase_orders', 'purchase_order_items'
  )
ORDER BY tablename;

-- ============================================================================
-- SECTION 7: TRIGGER VERIFICATION (updated_at)
-- ============================================================================
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name
FROM pg_trigger 
WHERE NOT tgisinternal
  AND tgrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN (
      'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
      'financial_transactions', 'payroll_employees', 'payroll_records',
      'warehouse_stock', 'clients', 'project_logs', 'suppliers',
      'purchase_orders', 'purchase_order_items'
    )
  )
ORDER BY table_name, trigger_name;

-- ============================================================================
-- SECTION 8: CONSTRAINT CHECKS (sync_status, category, etc.)
-- ============================================================================

-- Check sync_status constraints
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN (
      'projects', 'budgets', 'budget_items', 'budget_item_breakdowns',
      'financial_transactions', 'payroll_employees', 'payroll_records',
      'warehouse_stock', 'clients', 'project_logs', 'suppliers',
      'purchase_orders', 'purchase_order_items'
    )
  )
  AND pg_get_constraintdef(oid) LIKE '%sync_status%'
ORDER BY table_name, constraint_name;

-- Check category constraints
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN (
      'budgets', 'budget_items', 'budget_item_breakdowns',
      'financial_transactions', 'payroll_employees', 'payroll_records',
      'warehouse_stock', 'clients', 'project_logs', 'suppliers',
      'purchase_orders', 'purchase_order_items'
    )
  )
  AND pg_get_constraintdef(oid) LIKE '%category%'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- SECTION 9: DATA SAMPLE CHECK (optional)
-- ============================================================================
SELECT 'projects' AS table_name, COUNT(*) AS row_count FROM projects
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL
SELECT 'budget_items', COUNT(*) FROM budget_items
UNION ALL
SELECT 'budget_item_breakdowns', COUNT(*) FROM budget_item_breakdowns
UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM financial_transactions
UNION ALL
SELECT 'payroll_employees', COUNT(*) FROM payroll_employees
UNION ALL
SELECT 'payroll_records', COUNT(*) FROM payroll_records
UNION ALL
SELECT 'warehouse_stock', COUNT(*) FROM warehouse_stock
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'project_logs', COUNT(*) FROM project_logs
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'purchase_order_items', COUNT(*) FROM purchase_order_items
ORDER BY table_name;
