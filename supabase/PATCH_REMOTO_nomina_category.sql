-- ============================================================================
-- PATCH SEGURO PARA DB REMOTA: Categoría de Nómina en financial_transactions
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- ⚠️  EJECUTAR EN: Supabase Dashboard → SQL Editor (proyecto yibjsruoxjlgdnkgylld)
--
-- Motivo: la integración Payroll → Financial crea transacciones con la
-- categoría 'Gastos Operativos / Nómina de Mano de Obra'. Si la DB remota usa
-- el enum `expense_category` (11 valores) o un CHECK de 11 valores, el insert
-- de nómina FALLA en producción.
--
-- Este script es 100% idempotente y NO elimina/renombra datos. Solo agrega el
-- valor faltante (enum) o amplía el CHECK (text). Ejecutable todas las veces.
-- ============================================================================

-- Caso A: `category` es el enum expense_category → agregar el valor faltante
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'category' AND udt_name = 'expense_category'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'expense_category'
      AND e.enumlabel = 'Gastos Operativos / Nómina de Mano de Obra'
  ) THEN
    ALTER TYPE expense_category
      ADD VALUE 'Gastos Operativos / Nómina de Mano de Obra';
  END IF;
END $$;

-- Caso B: `category` es TEXT con CHECK → reemplazar el CHECK para incluir la
-- categoría de nómina.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
      AND column_name = 'category' AND data_type = 'text'
  ) THEN
    ALTER TABLE financial_transactions
      DROP CONSTRAINT IF EXISTS financial_transactions_category_check;
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

-- Actualizar el comentario documental (idempotente)
COMMENT ON COLUMN financial_transactions.category IS 'Transaction category: materiales, mano_de_obra, herramienta, sub_contrato, administrativo, personal, transporte, fijos, hogar, aporte, trabajos_extra, Gastos Operativos / Nómina de Mano de Obra';

-- ============================================================================
-- VERIFICACIÓN: ejecuta tras el patch para confirmar
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'expense_category'::regtype;
-- ============================================================================
