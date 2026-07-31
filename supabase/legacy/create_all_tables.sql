-- ============================================================================
-- Complete Database Schema for CONSTRUCTORA WM/M&S ERP
-- Slogan: "CONSTRUYENDO EL FUTURO"
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_email VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  typology VARCHAR(20) NOT NULL CHECK (typology IN ('residential', 'commercial', 'industrial', 'civil', 'public')),
  area_m2 DECIMAL(10, 2) NOT NULL,
  quality_level VARCHAR(20) NOT NULL CHECK (quality_level IN ('basic', 'moderate', 'premium')),
  status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'execution', 'paused', 'completed')),
  start_date DATE,
  estimated_end_date DATE,
  duration_days INTEGER NOT NULL,
  total_budget DECIMAL(15, 2) NOT NULL,
  budget_total DECIMAL(15, 2),
  calculated_duration INTEGER,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_typology ON projects(typology);
CREATE INDEX IF NOT EXISTS idx_projects_client_name ON projects(client_name);

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  direct_cost DECIMAL(15, 2) NOT NULL,
  indirect_percentage DECIMAL(5, 2) NOT NULL,
  contingency_percentage DECIMAL(5, 2) NOT NULL,
  profit_percentage DECIMAL(5, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_version ON budgets(project_id, version);

-- ============================================================================
-- BUDGET ITEMS TABLE (with APU Integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(15, 2) NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  length_m DECIMAL(10, 2),
  width_m DECIMAL(10, 2),
  depth_m DECIMAL(10, 2),
  height_m DECIMAL(10, 2),
  slab_type VARCHAR(50),
  -- APU Integration Fields
  apu_result JSONB,
  apu_params JSONB,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_parent_id ON budget_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_code ON budget_items(code);

-- Comments for APU fields
COMMENT ON COLUMN budget_items.apu_result IS 'APU calculation results including breakdown (materials, labor, machinery)';
COMMENT ON COLUMN budget_items.apu_params IS 'APU input parameters for re-calculation';

-- ============================================================================
-- BUDGET ITEM BREAKDOWN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_item_breakdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('material', 'labor', 'equipment', 'subcontract')),
  code VARCHAR(50),
  description TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity_unitary DECIMAL(10, 2) NOT NULL,
  total_quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  waste_percentage DECIMAL(5, 2) DEFAULT 0,
  total_price DECIMAL(15, 2) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_budget_item_id ON budget_item_breakdowns(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_resource_type ON budget_item_breakdowns(resource_type);

-- ============================================================================
-- FINANCIAL TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);

-- ============================================================================
-- PAYROLL EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payroll_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100) NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('obrero', 'empleado')),
  department VARCHAR(100),
  hire_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active ON payroll_employees(active);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_category ON payroll_employees(category);

-- ============================================================================
-- PAYROLL RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_worked INTEGER NOT NULL,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_rate DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(15, 2) DEFAULT 0,
  deductions DECIMAL(15, 2) DEFAULT 0,
  base_salary DECIMAL(15, 2) NOT NULL,
  overtime_pay DECIMAL(15, 2) DEFAULT 0,
  gross_salary DECIMAL(15, 2) NOT NULL,
  igss_deduction DECIMAL(15, 2) DEFAULT 0,
  aguinaldo_provision DECIMAL(15, 2) DEFAULT 0,
  vacaciones_provision DECIMAL(15, 2) DEFAULT 0,
  net_salary DECIMAL(15, 2) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON payroll_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_start, period_end);

-- ============================================================================
-- WAREHOUSE STOCK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_code VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  minimum_threshold DECIMAL(10, 2) NOT NULL DEFAULT 10,
  unit_cost DECIMAL(15, 2) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_project_id ON warehouse_stock(project_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_item_code ON warehouse_stock(item_code);

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  payment_terms TEXT,
  notes TEXT,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ============================================================================
-- PURCHASE ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- ============================================================================
-- PURCHASE ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_code VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  received_quantity DECIMAL(10, 2) DEFAULT 0,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  client_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (client_type IN ('individual', 'corporate')),
  notes TEXT,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);

-- ============================================================================
-- PROJECT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  responsible_person VARCHAR(255),
  notes TEXT,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_date ON project_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_project_logs_activity_type ON project_logs(activity_type);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_item_breakdowns_updated_at ON budget_item_breakdowns;
CREATE TRIGGER update_budget_item_breakdowns_updated_at BEFORE UPDATE ON budget_item_breakdowns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_employees_updated_at ON payroll_employees;
CREATE TRIGGER update_payroll_employees_updated_at BEFORE UPDATE ON payroll_employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_stock_updated_at ON warehouse_stock;
CREATE TRIGGER update_warehouse_stock_updated_at BEFORE UPDATE ON warehouse_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_order_items_updated_at ON purchase_order_items;
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_logs_updated_at ON project_logs;
CREATE TRIGGER update_project_logs_updated_at ON project_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Uncomment if using RLS
-- ============================================================================
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budget_item_breakdowns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT PERMISSIONS (Adjust as needed)
-- ============================================================================
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
