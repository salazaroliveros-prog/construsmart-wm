-- ============================================================================
-- AGREGAR CAMPOS DE TRACKING DE CONSUMO DE ALMACÉN
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- Esta migración agrega campos para el tracking de consumo de materiales
-- desde el almacén hacia los items de presupuesto, cerrando el loop de
-- integración Warehouse → Budget.
--
-- Cambios:
-- - budget_items: Agregar project_id (para integración con warehouse)
-- - budget_items: Agregar actual_consumption (consumo real de materiales)
-- - budget_items: Agregar consumption_variance (diferencia estimado vs real)
-- ============================================================================

-- ============================================================================
-- AGREGAR project_id A budget_items (si no existe)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'budget_items' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE budget_items ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
        
        -- Crear índice para búsquedas por project_id
        CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON budget_items(project_id);
        
        -- Comentario
        COMMENT ON COLUMN budget_items.project_id IS 'Project reference for warehouse integration - enables tracking material consumption per project';
    END IF;
END $$;

-- ============================================================================
-- AGREGAR actual_consumption A budget_items
-- ============================================================================

ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS actual_consumption NUMERIC DEFAULT 0;

COMMENT ON COLUMN budget_items.actual_consumption IS 'Actual material quantity consumed from warehouse (commercial units: bags, quintales, etc.)';

-- ============================================================================
-- AGREGAR consumption_variance A budget_items
-- ============================================================================

ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS consumption_variance NUMERIC DEFAULT 0;

COMMENT ON COLUMN budget_items.consumption_variance IS 'Variance between estimated and actual consumption (estimated - actual). Positive = under consumption, Negative = over consumption';

-- ============================================================================
-- AGREGAR ÍNDICES PARA OPTIMIZAR CONSULTAS DE CONSUMO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_budget_items_actual_consumption ON budget_items(actual_consumption);
CREATE INDEX IF NOT EXISTS idx_budget_items_consumption_variance ON budget_items(consumption_variance);

-- ============================================================================
-- ACTUALIZAR RLS POLICIES PARA NUEVOS CAMPOS
-- ============================================================================

-- Asegurar que las políticas existentes permitan leer/actualizar los nuevos campos
-- (Las políticas genéricas de RLS ya deberían cubrir estos campos, pero verificamos)

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'budget_items'
AND column_name IN ('project_id', 'actual_consumption', 'consumption_variance')
ORDER BY column_name;
