-- ============================================================================
-- VERIFICAR INTEGRACIÓN PAYROLL → FINANCIAL TRANSACTIONS
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- Esta migración verifica que la tabla financial_transactions tenga los campos
-- necesarios para soportar la integración automática de payroll.
--
-- La integración se maneja en el cliente (PayrollManager.tsx) creando
-- transacciones financieras automáticamente cuando se guardan registros de nómina.
--
-- No se requieren cambios de esquema porque financial_transactions ya tiene
-- todos los campos necesarios (category 'mano_de_obra', project_id, etc.)
-- ============================================================================

-- ============================================================================
-- VERIFICAR ESTRUCTURA DE financial_transactions
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'financial_transactions'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICAR QUE LA CATEGORÍA 'mano_de_obra' ESTÉ SOPORTADA
-- ============================================================================

-- El campo category es TEXT, por lo que acepta cualquier valor incluyendo 'mano_de_obra'
-- Verificar que existan transacciones con esta categoría (si hay datos)

SELECT 
    category,
    COUNT(*) as count
FROM financial_transactions
WHERE category = 'mano_de_obra'
GROUP BY category;

-- ============================================================================
-- VERIFICAR RELACIÓN CON projects
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'financial_transactions'
AND column_name = 'project_id';

-- ============================================================================
-- VERIFICAR RLS POLICIES
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'financial_transactions';

-- ============================================================================
-- COMENTARIOS DOCUMENTALES
-- ============================================================================

COMMENT ON TABLE financial_transactions IS 'Financial transactions including payroll expenses (category: mano_de_obra) automatically created from payroll_records';
COMMENT ON COLUMN financial_transactions.category IS 'Transaction category: materiales, mano_de_obra, herramienta, sub_contrato, administrativo, personal, transporte, fijos, hogar, aporte, trabajos_extra';
COMMENT ON COLUMN financial_transactions.project_id IS 'Reference to project - SET NULL when project is deleted to preserve financial history';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Esta migración es solo de verificación. No se requieren cambios de esquema
-- porque financial_transactions ya soporta la integración Payroll → Financial.
-- 
-- La integración se implementa en el código cliente (PayrollManager.tsx) que:
-- 1. Crea automáticamente transacciones con category='mano_de_obra'
-- 2. Asigna el project_id del registro de nómina
-- 3. Calcula total_cost basado en gross_salary
-- 4. Sincroniza con Supabase usando el motor de sync existente
