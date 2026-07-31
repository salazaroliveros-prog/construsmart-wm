-- FIX PAYROLL TABLES STRUCTURE
-- This migration ensures payroll tables have the correct structure

-- Create payroll_employees table if it doesn't exist
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

-- Add missing columns to payroll_employees if they don't exist
DO $$
BEGIN
  -- Add sync_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_employees' 
    AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE payroll_employees ADD COLUMN sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_employees' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE payroll_employees ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_employees' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payroll_employees ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create payroll_records table with proper structure
-- Drop the table if it exists to recreate with correct structure
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

-- Create indexes for payroll tables
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_records_sync_status ON payroll_records(sync_status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_updated_at ON payroll_records(updated_at);

-- Create RLS policies (assuming RLS is already enabled from previous migrations)
DROP POLICY IF EXISTS "Enable all access for payroll_employees" ON payroll_employees;
CREATE POLICY "Enable all access for payroll_employees" ON payroll_employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for payroll_records" ON payroll_records;
CREATE POLICY "Enable all access for payroll_records" ON payroll_records FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at on payroll_employees
DROP TRIGGER IF EXISTS update_payroll_employees_updated_at ON payroll_employees;
CREATE TRIGGER update_payroll_employees_updated_at BEFORE UPDATE ON payroll_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on payroll_records
DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
