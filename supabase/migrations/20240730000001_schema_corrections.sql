-- CORRECCIONES DEL SCHEMA PARA COINCIDIR CON INTERFACES LOCALES

-- 1. Actualizar financial_transactions - Categorías
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;

ALTER TABLE financial_transactions
ADD CONSTRAINT financial_transactions_category_check
CHECK (category IN ('materiales', 'mano_de_obra', 'herramienta', 'sub_contrato',
                    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'));

-- 2. Actualizar budgets - Renombrar campos uno por uno (solo si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'base_budget') THEN
    ALTER TABLE budgets RENAME COLUMN base_budget TO direct_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'indirects') THEN
    ALTER TABLE budgets RENAME COLUMN indirects TO indirect_percentage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'contingencies') THEN
    ALTER TABLE budgets RENAME COLUMN contingencies TO contingency_percentage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'utility') THEN
    ALTER TABLE budgets RENAME COLUMN utility TO profit_percentage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'total_budget') THEN
    ALTER TABLE budgets RENAME COLUMN total_budget TO total_amount;
  END IF;
END $$;

-- Actualizar tipos de datos de porcentajes a DECIMAL(5,2) (solo si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'indirect_percentage') THEN
    ALTER TABLE budgets ALTER COLUMN indirect_percentage TYPE DECIMAL(5,2);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'contingency_percentage') THEN
    ALTER TABLE budgets ALTER COLUMN contingency_percentage TYPE DECIMAL(5,2);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'profit_percentage') THEN
    ALTER TABLE budgets ALTER COLUMN profit_percentage TYPE DECIMAL(5,2);
  END IF;
END $$;

-- 3. Actualizar budget_items - Renombrar campos uno por uno (solo si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'unit_price') THEN
    ALTER TABLE budget_items RENAME COLUMN unit_price TO unit_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'total_price') THEN
    ALTER TABLE budget_items RENAME COLUMN total_price TO total_cost;
  END IF;
END $$;

-- 4. Actualizar budget_item_breakdowns - Renombrar campos uno por uno (solo si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_item_breakdowns' AND column_name = 'unit_price') THEN
    ALTER TABLE budget_item_breakdowns RENAME COLUMN unit_price TO unit_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_item_breakdowns' AND column_name = 'total_price') THEN
    ALTER TABLE budget_item_breakdowns RENAME COLUMN total_price TO total_cost;
  END IF;
END $$;

-- 5. Actualizar financial_transactions - Cambiar amount a total_cost (solo si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'amount') THEN
    ALTER TABLE financial_transactions RENAME COLUMN amount TO total_cost;
  END IF;
END $$;
