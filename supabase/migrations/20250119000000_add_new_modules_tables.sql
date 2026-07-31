-- CONSTRUCTORA WM/M&S - TABLAS PARA NUEVOS MÓDULOS
-- Esta migración agrega las tablas para CRM, Bitácora, Proveedores y Órdenes de Compra

-- 1. TABLA: clients (CRM - Gestión de Clientes)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('individual', 'corporate')),
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'updated_offline', 'deleted'))
);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_sync_status ON clients(sync_status);

-- Comentarios para clients
COMMENT ON TABLE clients IS 'Tabla de clientes para el módulo CRM - Gestión de Clientes';
COMMENT ON COLUMN clients.code IS 'Código único del cliente (CLI-XXXX)';
COMMENT ON COLUMN clients.client_type IS 'Tipo de cliente: individual o corporate';
COMMENT ON COLUMN clients.tax_id IS 'NIT/RFC para facturación';

-- 2. TABLA: project_logs (Bitácora de Proyectos)
CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('progress', 'issue', 'milestone', 'note')),
  description TEXT NOT NULL,
  physical_progress DECIMAL(5, 2) DEFAULT 0,
  financial_progress DECIMAL(5, 2) DEFAULT 0,
  log_date DATE NOT NULL,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'updated_offline', 'deleted'))
);

-- Índices para project_logs
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_activity_type ON project_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_log_date ON project_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_project_logs_sync_status ON project_logs(sync_status);

-- Comentarios para project_logs
COMMENT ON TABLE project_logs IS 'Tabla de bitácora para el seguimiento de proyectos';
COMMENT ON COLUMN project_logs.activity_type IS 'Tipo de actividad: progress, issue, milestone, note';
COMMENT ON COLUMN project_logs.physical_progress IS 'Avance físico en porcentaje (0-100)';
COMMENT ON COLUMN project_logs.financial_progress IS 'Avance financiero en porcentaje (0-100)';

-- 3. TABLA: suppliers (Proveedores)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'updated_offline', 'deleted'))
);

-- Índices para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status);

-- Comentarios para suppliers
COMMENT ON TABLE suppliers IS 'Tabla de proveedores para el módulo de almacén';
COMMENT ON COLUMN suppliers.code IS 'Código único del proveedor (SUP-XXXX)';
COMMENT ON COLUMN suppliers.payment_terms IS 'Condiciones de pago (ej: 30 días, 50% anticipo)';

-- 4. TABLA: purchase_orders (Órdenes de Compra)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'updated_offline', 'deleted'))
);

-- Índices para purchase_orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_code ON purchase_orders(code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_sync_status ON purchase_orders(sync_status);

-- Comentarios para purchase_orders
COMMENT ON TABLE purchase_orders IS 'Tabla de órdenes de compra para el módulo de almacén';
COMMENT ON COLUMN purchase_orders.code IS 'Código único de la orden (OC-XXXX)';
COMMENT ON COLUMN purchase_orders.status IS 'Estado de la orden: pending, approved, ordered, received, cancelled';

-- 5. TABLA: purchase_order_items (Items de Órdenes de Compra)
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'updated_offline', 'deleted'))
);

-- Índices para purchase_order_items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item_code ON purchase_order_items(item_code);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sync_status ON purchase_order_items(sync_status);

-- Comentarios para purchase_order_items
COMMENT ON TABLE purchase_order_items IS 'Tabla de items de órdenes de compra';
COMMENT ON COLUMN purchase_order_items.total_price IS 'Precio total calculado (quantity * unit_price)';

-- 6. ACTUALIZAR función de updated_at para las nuevas tablas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática de updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_logs_updated_at ON project_logs;
CREATE TRIGGER update_project_logs_updated_at BEFORE UPDATE ON project_logs
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

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Policies para clients (lectura pública para authenticated)
DROP POLICY IF EXISTS "Clients are viewable by authenticated users" ON clients;
CREATE POLICY "Clients are viewable by authenticated users"
    ON clients FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Clients are insertable by authenticated users" ON clients;
CREATE POLICY "Clients are insertable by authenticated users"
    ON clients FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Clients are updatable by authenticated users" ON clients;
CREATE POLICY "Clients are updatable by authenticated users"
    ON clients FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Clients are deletable by authenticated users" ON clients;
CREATE POLICY "Clients are deletable by authenticated users"
    ON clients FOR DELETE
    TO authenticated
    USING (true);

-- Policies para project_logs
DROP POLICY IF EXISTS "Project logs are viewable by authenticated users" ON project_logs;
CREATE POLICY "Project logs are viewable by authenticated users"
    ON project_logs FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Project logs are insertable by authenticated users" ON project_logs;
CREATE POLICY "Project logs are insertable by authenticated users"
    ON project_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Project logs are updatable by authenticated users" ON project_logs;
CREATE POLICY "Project logs are updatable by authenticated users"
    ON project_logs FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Project logs are deletable by authenticated users" ON project_logs;
CREATE POLICY "Project logs are deletable by authenticated users"
    ON project_logs FOR DELETE
    TO authenticated
    USING (true);

-- Policies para suppliers
DROP POLICY IF EXISTS "Suppliers are viewable by authenticated users" ON suppliers;
CREATE POLICY "Suppliers are viewable by authenticated users"
    ON suppliers FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Suppliers are insertable by authenticated users" ON suppliers;
CREATE POLICY "Suppliers are insertable by authenticated users"
    ON suppliers FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Suppliers are updatable by authenticated users" ON suppliers;
CREATE POLICY "Suppliers are updatable by authenticated users"
    ON suppliers FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Suppliers are deletable by authenticated users" ON suppliers;
CREATE POLICY "Suppliers are deletable by authenticated users"
    ON suppliers FOR DELETE
    TO authenticated
    USING (true);

-- Policies para purchase_orders
DROP POLICY IF EXISTS "Purchase orders are viewable by authenticated users" ON purchase_orders;
CREATE POLICY "Purchase orders are viewable by authenticated users"
    ON purchase_orders FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Purchase orders are insertable by authenticated users" ON purchase_orders;
CREATE POLICY "Purchase orders are insertable by authenticated users"
    ON purchase_orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Purchase orders are updatable by authenticated users" ON purchase_orders;
CREATE POLICY "Purchase orders are updatable by authenticated users"
    ON purchase_orders FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Purchase orders are deletable by authenticated users" ON purchase_orders;
CREATE POLICY "Purchase orders are deletable by authenticated users"
    ON purchase_orders FOR DELETE
    TO authenticated
    USING (true);

-- Policies para purchase_order_items
DROP POLICY IF EXISTS "Purchase order items are viewable by authenticated users" ON purchase_order_items;
CREATE POLICY "Purchase order items are viewable by authenticated users"
    ON purchase_order_items FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Purchase order items are insertable by authenticated users" ON purchase_order_items;
CREATE POLICY "Purchase order items are insertable by authenticated users"
    ON purchase_order_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Purchase order items are updatable by authenticated users" ON purchase_order_items;
CREATE POLICY "Purchase order items are updatable by authenticated users"
    ON purchase_order_items FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Purchase order items are deletable by authenticated users" ON purchase_order_items;
CREATE POLICY "Purchase order items are deletable by authenticated users"
    ON purchase_order_items FOR DELETE
    TO authenticated
    USING (true);
