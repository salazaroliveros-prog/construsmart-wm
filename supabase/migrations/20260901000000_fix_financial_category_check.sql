-- ============================================================================
-- FIX CATEGORY DE financial_transactions (enum o CHECK)
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- La integración Payroll → Financial crea transacciones con la categoría
-- 'Gastos Operativos / Nómina de Mano de Obra' (usada por PayrollManager y
-- useLaborCostOverrun).
--
-- En algunos ambientes `category` es un enum `expense_category` (11 valores) y
-- en otros es TEXT con CHECK. Esta versión maneja ambos casos de forma
-- idempotente:
--   1. Si es enum expense_category → agrega el valor faltante.
--   2. Si es TEXT+CHECK → reemplaza el CHECK para incluirlo.
-- ============================================================================

-- Caso A: columna tipo enum expense_category → agregar el valor faltante
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'category' AND udt_name = 'expense_category'
  ) THEN
    EXECUTE 'ALTER TYPE expense_category ADD VALUE IF NOT EXISTS ''Gastos Operativos / Nómina de Mano de Obra''';
  END IF;
END $$;

-- Caso B: columna tipo TEXT con CHECK → reemplazar el constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'category' AND data_type = 'text'
  ) THEN
    ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;
    ALTER TABLE financial_transactions
    ADD CONSTRAINT financial_transactions_category_check
    CHECK (category IN (
      'materiales',
      'mano_de_obra',
      'herramienta',
      'sub_contrato',
      'administrativo',
      'personal',
      'transporte',
      'fijos',
      'hogar',
      'aporte',
      'trabajos_extra',
      'Gastos Operativos / Nómina de Mano de Obra'
    ));
  END IF;
END $$;

-- ============================================================================
-- COMENTARIO DOCUMENTAL
-- ============================================================================
COMMENT ON COLUMN financial_transactions.category IS 'Transaction category: materiales, mano_de_obra, herramienta, sub_contrato, administrativo, personal, transporte, fijos, hogar, aporte, trabajos_extra, Gastos Operativos / Nómina de Mano de Obra';
