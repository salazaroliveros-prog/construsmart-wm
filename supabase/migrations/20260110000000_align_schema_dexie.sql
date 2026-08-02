-- CONSTRUCTORA WM/M&S - ALINEAR SCHEMA SQL CON INTERFACES DEXIE
-- Completa la alineación del esquema remoto con las interfaces locales (offlineStore.ts).
-- Cubre los puntos 4.1-4.4 del plan de corrección de inconsistencias:
--   * 4.1 budgets.version → INTEGER (ya corregido en 20250131000004, se refuerza aquí)
--   * 4.2 budgets: agregar direct_cost, indirect_percentage, contingency_percentage,
--        profit_percentage, total_amount (usados por LocalBudget en Dexie)
--   * 4.3 financial_transactions: agregar total_cost (quantity/unit/unit_cost ya existen)
--   * 4.4 warehouse_stock: UNIQUE compuesto (item_code, project_id) en vez de UNIQUE global
-- Idempotente: seguro de ejecutar múltiples veces.

-- ============================================================================
-- 4.1 REFORZAR budgets.version COMO INTEGER
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
-- 4.2 AGREGAR CAMPOS DEXIE A budgets
-- LocalBudget usa: direct_cost, indirect_percentage, contingency_percentage,
-- profit_percentage, total_amount, duration_days
-- ============================================================================
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS direct_cost NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS indirect_percentage NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS contingency_percentage NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS profit_percentage NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0;

-- Sincronizar datos heredados: rellenar los campos nuevos con valores por defecto
-- si vienen de una versión anterior del esquema (sin base_budget/total_budget).
UPDATE budgets SET
  direct_cost = COALESCE(direct_cost, 0),
  total_amount = COALESCE(total_amount, direct_cost, 0),
  indirect_percentage = COALESCE(indirect_percentage, 0),
  contingency_percentage = COALESCE(contingency_percentage, 0),
  profit_percentage = COALESCE(profit_percentage, 0),
  duration_days = COALESCE(duration_days, 0)
WHERE direct_cost IS NULL OR total_amount IS NULL;

-- Índice para búsquedas por total_amount (común en reportes)
CREATE INDEX IF NOT EXISTS idx_budgets_total_amount ON budgets(total_amount);

-- ============================================================================
-- 4.3 AGREGAR total_cost A financial_transactions
-- LocalFinancialTransaction usa: quantity, unit, unit_cost, total_cost
-- (quantity/unit/unit_cost ya fueron agregados en migraciones previas)
-- ============================================================================
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15, 2) DEFAULT 0;

-- Backfill: si no hay total_cost, derivarlo de quantity*unit_cost
UPDATE financial_transactions SET
  total_cost = COALESCE(total_cost, quantity * unit_cost, 0)
WHERE total_cost IS NULL OR total_cost = 0;

-- ============================================================================
-- 4.4 warehouse_stock: UNIQUE COMPUESTO (item_code, project_id)
-- El UNIQUE global sobre item_code fue removido en 20250131000004.
-- Ahora agregamos una restricción que permita el mismo código en distintos
-- proyectos (Dexie lo permite) pero impida duplicados dentro del mismo proyecto.
-- ============================================================================
DO $$
BEGIN
  -- Remover cualquier UNIQUE global sobre item_code que haya quedado
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'warehouse_stock_item_code_key'
      AND conrelid = 'warehouse_stock'::regclass
  ) THEN
    ALTER TABLE warehouse_stock DROP CONSTRAINT warehouse_stock_item_code_key;
  END IF;

  -- Crear índice UNIQUE compuesto solo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'warehouse_stock'
      AND indexname = 'idx_warehouse_stock_project_item_code'
  ) THEN
    -- Nota: PostgreSQL trata NULLs como distintos en índices UNIQUE, así que
    -- múltiples filas sin proyecto (project_id NULL) con el mismo item_code
    -- son permitidas. Para proyectos asignados, la unicidad es por proyecto.
    CREATE UNIQUE INDEX idx_warehouse_stock_project_item_code
      ON warehouse_stock(item_code, project_id);
  END IF;
END $$;

-- Índice adicional para el filtro común por item_code
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_item_code ON warehouse_stock(item_code);

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================
COMMENT ON COLUMN budgets.direct_cost IS 'Costo directo total (Dexie: LocalBudget.direct_cost)';
COMMENT ON COLUMN budgets.indirect_percentage IS 'Porcentaje de indirectos (Dexie: indirect_percentage)';
COMMENT ON COLUMN budgets.contingency_percentage IS 'Porcentaje de contingencia (Dexie: contingency_percentage)';
COMMENT ON COLUMN budgets.profit_percentage IS 'Porcentaje de utilidad (Dexie: profit_percentage)';
COMMENT ON COLUMN budgets.total_amount IS 'Monto total del presupuesto (Dexie: LocalBudget.total_amount)';
COMMENT ON COLUMN budgets.duration_days IS 'Duración estimada en días (Dexie: LocalBudget.duration_days)';
COMMENT ON COLUMN financial_transactions.total_cost IS 'Costo total = quantity * unit_cost (Dexie: LocalFinancialTransaction.total_cost)';
COMMENT ON INDEX idx_warehouse_stock_project_item_code IS 'Permite mismo item_code en distintos proyectos, único dentro del mismo proyecto';

