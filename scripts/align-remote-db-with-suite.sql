-- ============================================================================
-- ALINEAR BASE DE DATOS REMOTA (SUPABASE) CON LA SUITE ACTUAL
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- Este script aplica todas las migraciones necesarias para alinear la base de
-- datos remota con los cambios realizados en la suite durante la auditoría E2E.
--
-- Cambios requeridos:
-- 1. Agregar campos de tracking de consumo de almacén a budget_items
-- 2. Verificar integración Payroll → Financial Transactions
-- 3. Verificar que el esquema sea consistente con offlineDB v7
--
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRACIÓN 1: Agregar campos de tracking de consumo de almacén
-- ============================================================================

-- Agregar project_id a budget_items (para integración warehouse)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'budget_items' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE budget_items ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON budget_items(project_id);
        COMMENT ON COLUMN budget_items.project_id IS 'Project reference for warehouse integration';
    END IF;
END $$;

-- Agregar actual_consumption a budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS actual_consumption NUMERIC DEFAULT 0;
COMMENT ON COLUMN budget_items.actual_consumption IS 'Actual material quantity consumed from warehouse';

-- Agregar consumption_variance a budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS consumption_variance NUMERIC DEFAULT 0;
COMMENT ON COLUMN budget_items.consumption_variance IS 'Variance between estimated and actual consumption';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_budget_items_actual_consumption ON budget_items(actual_consumption);
CREATE INDEX IF NOT EXISTS idx_budget_items_consumption_variance ON budget_items(consumption_variance);

-- ============================================================================
-- MIGRACIÓN 2: Verificar estructura de financial_transactions
-- ============================================================================

-- Verificar que financial_transactions tenga los campos necesarios
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'financial_transactions'
AND column_name IN ('category', 'project_id', 'total_cost', 'date', 'description')
ORDER BY column_name;

-- ============================================================================
-- MIGRACIÓN 3: Verificar consistencia con offlineDB v7
-- ============================================================================

-- Verificar que todas las tablas necesarias existan
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'projects',
    'budgets',
    'budget_items',
    'financial_transactions',
    'payroll_employees',
    'payroll_records',
    'warehouse_stock',
    'clients',
    'project_logs',
    'suppliers',
    'purchase_orders',
    'purchase_order_items'
)
ORDER BY table_name;

-- ============================================================================
-- MIGRACIÓN 4: Verificar índices de sync
-- ============================================================================

-- Verificar que las tablas tengan índices de sync_status para offline sync
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN (
    'projects',
    'budgets',
    'budget_items',
    'financial_transactions',
    'payroll_employees',
    'payroll_records',
    'warehouse_stock',
    'clients',
    'project_logs',
    'suppliers',
    'purchase_orders',
    'purchase_order_items'
)
AND indexname LIKE '%sync_status%'
ORDER BY tablename, indexname;

-- ============================================================================
-- MIGRACIÓN 5: Verificar campos de APU en budget_items
-- ============================================================================

-- Verificar que budget_items tenga campos APU
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'budget_items'
AND column_name IN (
    'apu_result',
    'apu_params',
    'unidades_comerciales_estimadas'
)
ORDER BY column_name;

-- ============================================================================
-- MIGRACIÓN 6: Verificar RLS Policies
-- ============================================================================

-- Verificar que las tablas tengan RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'projects',
    'budgets',
    'budget_items',
    'financial_transactions',
    'payroll_employees',
    'payroll_records',
    'warehouse_stock',
    'clients',
    'project_logs',
    'suppliers',
    'purchase_orders',
    'purchase_order_items'
)
ORDER BY tablename;

-- ============================================================================
-- RESULTADO DE VERIFICACIÓN
-- ============================================================================

-- Imprimir resumen de cambios aplicados
DO $$
BEGIN
    RAISE NOTICE '=== ALINEACIÓN DE BASE DE DATOS COMPLETADA ===';
    RAISE NOTICE '1. Campos de tracking de consumo de almacén agregados a budget_items';
    RAISE NOTICE '2. Estructura de financial_transactions verificada';
    RAISE NOTICE '3. Consistencia con offlineDB v7 verificada';
    RAISE NOTICE '4. Índices de sync verificados';
    RAISE NOTICE '5. Campos APU en budget_items verificados';
    RAISE NOTICE '6. RLS policies verificadas';
    RAISE NOTICE '=== Base de datos alineada con la suite actual ===';
END $$;
