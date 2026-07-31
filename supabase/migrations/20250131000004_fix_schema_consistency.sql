-- CONSTRUCTORA WM/M&S - CORRECCIÓN DE CONSISTENCIA DE SCHEMA
-- Corrige inconsistencias detectadas en la auditoría:
-- 1. payroll_records pierde project_id (dropped por 20250131000001)
-- 2. Split-brain budget_item_breakdown (singular) vs budget_item_breakdowns (plural)
-- 3. budgets.version forzado a INTEGER
-- 4. warehouse_stock.item_code UNIQUE bloquea stock multi-proyecto
-- 5. RLS con TO authenticated bloquea la anon key usada por la app
-- 6. sync_status CHECK de módulos nuevos no admite created_offline
-- 7. Columnas faltantes para interfaces locales (clients, project_logs, purchase_order_items)

-- ============================================================================
-- 1. RESTAURAR project_id EN payroll_records
-- ============================================================================
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payroll_records' AND column_name='project_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON payroll_records(project_id);
  END IF;
END $$;

-- ============================================================================
-- 2. UNIFICAR TABLA DE DESGLOSE: budget_item_breakdowns (PLURAL) ES LA CANÓNICA
-- ============================================================================

-- Columnas que la interfaz LocalBudgetItemBreakdown espera y que la tabla plural no tiene
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS quantity_unitary NUMERIC(10, 4);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS total_quantity NUMERIC(12, 2);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS total_price NUMERIC(14, 2);
ALTER TABLE budget_item_breakdowns ADD COLUMN IF NOT EXISTS waste_percentage NUMERIC(5, 2) DEFAULT 5.0;

-- Migrar datos de la tabla singular (legado de 001/002) si existen, y eliminarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='budget_item_breakdown'
  ) THEN
    INSERT INTO budget_item_breakdowns
      (budget_item_id, resource_type, code, description, unit, quantity_unitary, total_quantity,
       unit_price, waste_percentage, total_price, unit_cost, total_cost, sync_status, created_at, updated_at)
    SELECT
      b.budget_item_id, b.resource_type, b.code, b.description, b.unit,
      b.quantity_unitary, b.total_quantity, b.unit_price, b.waste_percentage, b.total_price,
      b.unit_cost, b.total_cost, COALESCE(b.sync_status, 'synced'), NOW(), COALESCE(b.updated_at, NOW())
    FROM budget_item_breakdown b
    WHERE NOT EXISTS (
      SELECT 1 FROM budget_item_breakdowns p
      WHERE p.budget_item_id = b.budget_item_id AND p.description = b.description
    );

    DROP TABLE IF EXISTS budget_item_breakdown;
  END IF;
END $$;

-- ============================================================================
-- 3. budgets.version A INTEGER (si aún es TEXT)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='budgets' AND column_name='version'
      AND data_type IN ('text', 'character varying', 'character')
  ) THEN
    ALTER TABLE budgets ALTER COLUMN version TYPE INTEGER USING version::integer;
  END IF;
END $$;

-- ============================================================================
-- 4. QUITAR UNIQUE DE warehouse_stock.item_code (stock por proyecto)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'warehouse_stock_item_code_key' AND conrelid = 'warehouse_stock'::regclass
  ) THEN
    ALTER TABLE warehouse_stock DROP CONSTRAINT warehouse_stock_item_code_key;
  END IF;
END $$;

-- ============================================================================
-- 5. RLS ACCESIBLE CON ANON KEY PARA TABLAS DE MÓDULOS NUEVOS
-- Reemplaza políticas TO authenticated (que bloquean la anon key) por all-access
-- ============================================================================
DO $$
DECLARE
  t text;
  verb text;
  label text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'project_logs', 'suppliers', 'purchase_orders', 'purchase_order_items'] LOOP
    -- Determinar prefijo del nombre de la política según la tabla
    label := CASE t
      WHEN 'clients' THEN 'Clients are '
      WHEN 'project_logs' THEN 'Project logs are '
      WHEN 'suppliers' THEN 'Suppliers are '
      WHEN 'purchase_orders' THEN 'Purchase orders are '
      WHEN 'purchase_order_items' THEN 'Purchase order items are '
    END;

    -- Eliminar las 4 políticas restringidas a authenticated
    FOREACH verb IN ARRAY ARRAY['viewable', 'insertable', 'updatable', 'deletable'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', label || verb || ' by authenticated users', t);
    END LOOP;

    -- Crear política de acceso completo para todos los roles (incluida anon)
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable all access for ' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)', 'Enable all access for ' || t, t);
  END LOOP;
END $$;

-- ============================================================================
-- 6. AMPLIAR sync_status CHECK EN MÓDULOS NUEVOS (incluir created_offline)
-- ============================================================================
DO $$
DECLARE
  t text;
  cons text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'project_logs', 'suppliers', 'purchase_orders', 'purchase_order_items'] LOOP
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
       FROM unnest(ARRAY['synced','created_offline','updated_offline','pending','deleted']) v)
    );
  END LOOP;
END $$;

-- ============================================================================
-- 7. COLUMNAS FALTANTES PARA INTERFACES LOCALES
-- ============================================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE project_logs ADD COLUMN IF NOT EXISTS photos JSONB;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity NUMERIC(10, 2);

-- APU JSONB en budget_items (idempotente por si no existiera)
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS apu_result JSONB;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS apu_params JSONB;
