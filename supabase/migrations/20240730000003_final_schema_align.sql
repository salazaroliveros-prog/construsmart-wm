-- CONSTRUCTORA WM/M&S - ALINEACIÓN FINAL DEL SCHEMA
-- Alinea la base de datos remota con las interfaces TypeScript locales

-- 1. CORREGIR CATEGORIAS EN financial_transactions
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;
ALTER TABLE financial_transactions 
ADD CONSTRAINT financial_transactions_category_check 
CHECK (category IN ('materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 
                    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'));

-- 2. RENOMBRAR COLUMNAS EN budgets (si aún existen con nombres antiguos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='base_budget') THEN
    ALTER TABLE budgets RENAME COLUMN base_budget TO direct_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='indirects') THEN
    ALTER TABLE budgets RENAME COLUMN indirects TO indirect_percentage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='contingencies') THEN
    ALTER TABLE budgets RENAME COLUMN contingencies TO contingency_percentage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='utility') THEN
    ALTER TABLE budgets RENAME COLUMN utility TO profit_percentage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='total_budget') THEN
    ALTER TABLE budgets RENAME COLUMN total_budget TO total_amount;
  END IF;
END $$;

-- 3. RENOMBRAR EN budget_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_items' AND column_name='unit_price') THEN
    ALTER TABLE budget_items RENAME COLUMN unit_price TO unit_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_items' AND column_name='total_price') THEN
    ALTER TABLE budget_items RENAME COLUMN total_price TO total_cost;
  END IF;
END $$;

-- 4. AGREGAR sync_status y updated_at a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. AGREGAR sync_status y updated_at a apu_library
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE apu_library ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. AGREGAR sync_status y updated_at a budget_item_breakdown
ALTER TABLE budget_item_breakdown ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE budget_item_breakdown ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. AGREGAR sync_status y updated_at a payroll_records
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. AGREGAR sync_status y updated_at a financial_transactions
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 9. AGREGAR sync_status y updated_at a warehouse_stock
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. AGREGAR quantity, unit, unit_cost a financial_transactions (si no existen)
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 1;
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'unid';
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2) DEFAULT 0;

-- 11. CORREGIR resource_type EN budget_item_breakdown
ALTER TABLE budget_item_breakdown DROP CONSTRAINT IF EXISTS budget_item_breakdown_resource_type_check;
ALTER TABLE budget_item_breakdown ADD CONSTRAINT budget_item_breakdown_resource_type_check CHECK (resource_type IN ('material', 'labor', 'equipment', 'subcontract'));

-- 12. AGREGAR unit_cost a budget_item_breakdown para compatibilidad
ALTER TABLE budget_item_breakdown ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2);
ALTER TABLE budget_item_breakdown ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15, 2);

-- 13. TRIGGERS para updated_at en tablas que no los tienen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_apu_library_updated_at') THEN
    CREATE TRIGGER update_apu_library_updated_at BEFORE UPDATE ON apu_library
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_budget_item_breakdown_updated_at') THEN
    CREATE TRIGGER update_budget_item_breakdown_updated_at BEFORE UPDATE ON budget_item_breakdown
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 14. CREAR TABLA payroll_employees si no existe
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

-- Índices payroll (solo si columnas existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_records' AND column_name = 'employee_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_records' AND column_name = 'period_start') THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_start, period_end);
  END IF;
END $$;

-- RLS para payroll_employees
ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all access for payroll_employees') THEN
        CREATE POLICY "Enable all access for payroll_employees" ON payroll_employees FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 15. AGREGAR ÍNDICES FALTANTES
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_item_id ON budget_item_breakdown(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
