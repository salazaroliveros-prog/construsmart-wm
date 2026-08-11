-- ============================================================================
-- MIGRACIÓN CONSOLIDADA - CONSTRUCTORA WM/M&S
-- "CONSTRUYENDO EL FUTURO"
-- 
-- Esta migración consolida todas las tablas y esquemas necesarios para la suite.
-- Reemplaza todas las migraciones anteriores con una sola versión consolidada.
-- ============================================================================

begin;

-- ============================================================================
-- TABLAS PRINCIPALES
-- ============================================================================

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  budget_total DECIMAL(15, 2),
  calculated_duration INTEGER,
  has_critical_roadblock BOOLEAN DEFAULT false,
  roadblock_type TEXT CHECK (roadblock_type IN ('clima', 'material', 'personal', 'técnico', 'permiso', 'financiero', 'otro')),
  roadblock_description TEXT,
  roadblock_date DATE,
  completion_buffer_days INTEGER,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  direct_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  indirect_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  contingency_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  profit_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  duration_days INTEGER,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de presupuesto
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.budget_items(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL DEFAULT 0,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  length_m DECIMAL(10, 2),
  width_m DECIMAL(10, 2),
  depth_m DECIMAL(10, 2),
  height_m DECIMAL(10, 2),
  slab_type TEXT,
  category TEXT,
  unidades_comerciales_estimadas DECIMAL(10, 2),
  actual_consumption DECIMAL(10, 2),
  consumption_variance DECIMAL(10, 2),
  apu_result JSONB,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones financieras
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK (category IN ('materiales', 'mano_de_obra', 'maquinaria', 'subcontratos', 'otros', 'gastos_operativos_nomina')),
  description TEXT NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  reference TEXT,
  invoice_number TEXT,
  supplier_id UUID,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de empleados de nómina
CREATE TABLE IF NOT EXISTS public.payroll_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  daily_rate DECIMAL(15, 2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(15, 2),
  active BOOLEAN DEFAULT true,
  hire_date DATE,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de registros de nómina
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_worked INTEGER NOT NULL DEFAULT 0,
  hours_overtime DECIMAL(5, 2) DEFAULT 0,
  daily_rate DECIMAL(15, 2) NOT NULL,
  total_pay DECIMAL(15, 2) NOT NULL DEFAULT 0,
  benefits DECIMAL(15, 2) DEFAULT 0,
  igss_deduction DECIMAL(15, 2) DEFAULT 0,
  net_pay DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de stock de almacén
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  minimum_threshold DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  location TEXT,
  supplier_id UUID,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_type TEXT CHECK (client_type IN ('individual', 'corporate')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Guatemala',
  notes TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bitácora de proyectos
CREATE TABLE IF NOT EXISTS public.project_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  activity_type TEXT CHECK (activity_type IN ('progress', 'issue', 'milestone', 'note')),
  description TEXT NOT NULL,
  physical_progress DECIMAL(5, 2) CHECK (physical_progress >= 0 AND physical_progress <= 100),
  financial_progress DECIMAL(5, 2) CHECK (financial_progress >= 0 AND financial_progress <= 100),
  weather_conditions TEXT,
  team_present TEXT,
  photos JSONB,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  payment_terms TEXT,
  notes TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_approval', 'approved', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de órdenes de compra
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  received_quantity DECIMAL(10, 2) DEFAULT 0,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de subcontratos
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  specialty TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de usuario
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_sync_status ON public.projects(sync_status);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_sync_status ON public.budgets(sync_status);

CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON public.budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON public.budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_sync_status ON public.budget_items(sync_status);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON public.financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_sync_status ON public.financial_transactions(sync_status);

CREATE INDEX IF NOT EXISTS idx_payroll_employees_user_id ON public.payroll_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active ON public.payroll_employees(active);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_sync_status ON public.payroll_employees(sync_status);

CREATE INDEX IF NOT EXISTS idx_payroll_records_user_id ON public.payroll_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON public.payroll_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON public.payroll_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_records_sync_status ON public.payroll_records(sync_status);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_user_id ON public.warehouse_stock(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_project_id ON public.warehouse_stock(project_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_category ON public.warehouse_stock(category);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_sync_status ON public.warehouse_stock(sync_status);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_sync_status ON public.clients(sync_status);

CREATE INDEX IF NOT EXISTS idx_project_logs_user_id ON public.project_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON public.project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_date ON public.project_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_project_logs_activity_type ON public.project_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_sync_status ON public.project_logs(sync_status);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON public.suppliers(sync_status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON public.purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_sync_status ON public.purchase_orders(sync_status);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_user_id ON public.purchase_order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sync_status ON public.purchase_order_items(sync_status);

CREATE INDEX IF NOT EXISTS idx_subcontractors_user_id ON public.subcontractors(user_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_supplier_id ON public.subcontractors(supplier_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_sync_status ON public.subcontractors(sync_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proyectos
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para presupuestos
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para items de presupuesto
CREATE POLICY "Users can view own budget items" ON public.budget_items FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own budget items" ON public.budget_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget items" ON public.budget_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget items" ON public.budget_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para transacciones financieras
CREATE POLICY "Users can view own transactions" ON public.financial_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own transactions" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.financial_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.financial_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para empleados de nómina
CREATE POLICY "Users can view own employees" ON public.payroll_employees FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own employees" ON public.payroll_employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.payroll_employees FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.payroll_employees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para registros de nómina
CREATE POLICY "Users can view own payroll records" ON public.payroll_records FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own payroll records" ON public.payroll_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payroll records" ON public.payroll_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payroll records" ON public.payroll_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para stock de almacén (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own stock" ON public.warehouse_stock FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stock" ON public.warehouse_stock FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stock" ON public.warehouse_stock FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stock" ON public.warehouse_stock FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para clientes (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para bitácora de proyectos (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own logs" ON public.project_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.project_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.project_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.project_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para proveedores (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own suppliers" ON public.suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para órdenes de compra (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchase orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchase orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchase orders" ON public.purchase_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para items de órdenes de compra (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own purchase order items" ON public.purchase_order_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchase order items" ON public.purchase_order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchase order items" ON public.purchase_order_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchase order items" ON public.purchase_order_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para subcontratos (CORREGIDO: eliminar OR user_id IS NULL para mayor seguridad)
CREATE POLICY "Users can view own subcontractors" ON public.subcontractors FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subcontractors" ON public.subcontractors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subcontractors" ON public.subcontractors FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subcontractors" ON public.subcontractors FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para configuración de usuario
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS PARA updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_employees_updated_at BEFORE UPDATE ON public.payroll_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouse_stock_updated_at BEFORE UPDATE ON public.warehouse_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_logs_updated_at BEFORE UPDATE ON public.project_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HABILITAR REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payroll_employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payroll_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subcontractors;

commit;
