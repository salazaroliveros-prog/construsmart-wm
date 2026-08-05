-- ============================================================================
-- MIGRACIÓN v9: subcontractors + pending_approval
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- - Agrega pending_approval al CHECK de purchase_orders.status
-- - Crea tabla subcontractors con índices, RLS, updated_at trigger y Realtime
-- ============================================================================

begin;

-- 1. Ajustar CHECK de purchase_orders.status para incluir pending_approval
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('pending', 'pending_approval', 'approved', 'ordered', 'received', 'cancelled'));

COMMENT ON COLUMN purchase_orders.status IS 'Estado de la orden: pending, pending_approval, approved, ordered, received, cancelled';

-- 2. Crear tabla subcontractors
CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  specialties TEXT[],
  retention_rate DECIMAL(5, 2) DEFAULT 0,
  advance_amount DECIMAL(15, 2) DEFAULT 0,
  advance_balance DECIMAL(15, 2) DEFAULT 0,
  retention_balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline', 'syncing', 'pending', 'sync_failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para subcontractors
CREATE INDEX IF NOT EXISTS idx_subcontractors_code ON subcontractors(code);
CREATE INDEX IF NOT EXISTS idx_subcontractors_user_id ON subcontractors(user_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_is_active ON subcontractors(is_active);

-- Comentarios para subcontractors
COMMENT ON TABLE subcontractors IS 'Tabla de subcontratistas para el módulo de subcontratistas';
COMMENT ON COLUMN subcontractors.code IS 'Código único del subcontratista (SUB-XXXX)';
COMMENT ON COLUMN subcontractors.supplier_id IS 'Referencia opcional a proveedor en suppliers';
COMMENT ON COLUMN subcontractors.retention_rate IS 'Porcentaje de retención de garantía';
COMMENT ON COLUMN subcontractors.advance_amount IS 'Anticipo otorgado';
COMMENT ON COLUMN subcontractors.advance_balance IS 'Saldo pendiente de amortizar del anticipo';
COMMENT ON COLUMN subcontractors.retention_balance IS 'Saldo retenido pendiente de liberación';

-- 3. Trigger updated_at para subcontractors
DROP TRIGGER IF EXISTS update_subcontractors_updated_at ON subcontractors;
CREATE TRIGGER update_subcontractors_updated_at BEFORE UPDATE ON subcontractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS para subcontractors
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subcontractors are viewable by authenticated users" ON subcontractors;
CREATE POLICY "Subcontractors are viewable by authenticated users"
  ON subcontractors FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Subcontractors are insertable by authenticated users" ON subcontractors;
CREATE POLICY "Subcontractors are insertable by authenticated users"
  ON subcontractors FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Subcontractors are updatable by authenticated users" ON subcontractors;
CREATE POLICY "Subcontractors are updatable by authenticated users"
  ON subcontractors FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Subcontractors are deletable by authenticated users" ON subcontractors;
CREATE POLICY "Subcontractors are deletable by authenticated users"
  ON subcontractors FOR DELETE
  TO authenticated
  USING (true);

-- 5. Realtime para subcontractors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'subcontractors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subcontractors;
  END IF;
END $$;

commit;
