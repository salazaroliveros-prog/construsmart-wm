-- ============================================================================
-- FIX CHECK CONSTRAINT financial_transactions.category
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- La integración Payroll → Financial crea transacciones con la categoría
-- 'Gastos Operativos / Nómina de Mano de Obra' (usada por PayrollManager y
-- useLaborCostOverrun). El CHECK definido en 20240730000003 no la incluía, por
-- lo que los inserts de nómina fallaban en Supabase.
--
-- Esta migración reemplaza el constraint para admitir la categoría de nómina.
-- Idempotente: seguro de ejecutar múltiples veces.
-- ============================================================================

-- Eliminar el CHECK existente (si existe)
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;

-- Recrear el CHECK con la categoría de nómina incluida
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

-- ============================================================================
-- COMENTARIO DOCUMENTAL
-- ============================================================================
COMMENT ON COLUMN financial_transactions.category IS 'Transaction category: materiales, mano_de_obra, herramienta, sub_contrato, administrativo, personal, transporte, fijos, hogar, aporte, trabajos_extra, Gastos Operativos / Nómina de Mano de Obra';
