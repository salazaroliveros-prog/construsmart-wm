-- Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  location TEXT NOT NULL,
  typology TEXT NOT NULL CHECK (typology IN ('residential', 'commercial', 'industrial', 'civil', 'public')),
  area_m2 DECIMAL(10, 2) NOT NULL,
  quality_level TEXT NOT NULL CHECK (quality_level IN ('basic', 'moderate', 'premium')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'execution', 'paused', 'completed')),
  start_date DATE,
  estimated_end_date DATE,
  duration_days INTEGER,
  total_budget DECIMAL(15, 2),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de presupuestos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  base_budget DECIMAL(15, 2),
  indirects DECIMAL(15, 2),
  contingencies DECIMAL(15, 2),
  utility DECIMAL(15, 2),
  total_budget DECIMAL(15, 2),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de items de presupuesto
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(15, 2),
  total_price DECIMAL(15, 2),
  item_order INTEGER,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de desglose de items
CREATE TABLE IF NOT EXISTS budget_item_breakdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('material', 'labor', 'equipment')),
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(15, 2),
  total_price DECIMAL(15, 2),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de transacciones financieras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK (category IN ('materials', 'labor', 'equipment', 'transport', 'subcontractors', 'fees', 'insurance', 'taxes', 'utilities', 'maintenance', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de empleados de nómina
CREATE TABLE IF NOT EXISTS payroll_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  daily_rate DECIMAL(15, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('obrero', 'empleado')),
  department TEXT NOT NULL,
  hire_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de registros de nómina
-- Note: This table may be recreated in subsequent migrations if structure changes
DROP TABLE IF EXISTS payroll_records CASCADE;
CREATE TABLE payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES payroll_employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_worked INTEGER NOT NULL,
  overtime_hours DECIMAL(10, 2) DEFAULT 0,
  overtime_rate DECIMAL(15, 2) DEFAULT 0,
  bonuses DECIMAL(15, 2) DEFAULT 0,
  deductions DECIMAL(15, 2) DEFAULT 0,
  base_salary DECIMAL(15, 2),
  overtime_pay DECIMAL(15, 2),
  gross_salary DECIMAL(15, 2),
  igss_deduction DECIMAL(15, 2),
  aguinaldo_provision DECIMAL(15, 2),
  vacaciones_provision DECIMAL(15, 2),
  net_salary DECIMAL(15, 2),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de stock de almacén
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  minimum_threshold DECIMAL(10, 2) DEFAULT 10,
  unit_cost DECIMAL(15, 2) DEFAULT 0,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_typology ON projects(typology);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_item_id ON budget_item_breakdowns(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
-- Create indexes for payroll_records only if columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_records' 
    AND column_name = 'employee_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_records' 
    AND column_name = 'period_start'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_start, period_end);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_item_code ON warehouse_stock(item_code);

-- Habilitar Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_item_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_records') THEN
    ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (para desarrollo - permitir todo con anon key)
DROP POLICY IF EXISTS "Enable all access for projects" ON projects;
CREATE POLICY "Enable all access for projects" ON projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for budgets" ON budgets;
CREATE POLICY "Enable all access for budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for budget_items" ON budget_items;
CREATE POLICY "Enable all access for budget_items" ON budget_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for budget_item_breakdowns" ON budget_item_breakdowns;
CREATE POLICY "Enable all access for budget_item_breakdowns" ON budget_item_breakdowns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for financial_transactions" ON financial_transactions;
CREATE POLICY "Enable all access for financial_transactions" ON financial_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for payroll_employees" ON payroll_employees;
CREATE POLICY "Enable all access for payroll_employees" ON payroll_employees FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_records') THEN
    DROP POLICY IF EXISTS "Enable all access for payroll_records" ON payroll_records;
    CREATE POLICY "Enable all access for payroll_records" ON payroll_records FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP POLICY IF EXISTS "Enable all access for warehouse_stock" ON warehouse_stock;
CREATE POLICY "Enable all access for warehouse_stock" ON warehouse_stock FOR ALL USING (true) WITH CHECK (true);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para updated_at
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_records') THEN
    DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
    CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_warehouse_stock_updated_at ON warehouse_stock;
CREATE TRIGGER update_warehouse_stock_updated_at BEFORE UPDATE ON warehouse_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
