-- ============================================================================
-- ALINEAR CASCADE DELETE CON SET NULL
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- Esta migración alinea el comportamiento de CASCADE DELETE entre el servidor
-- y el cliente (offlineDB) para mantener consistencia de datos.
--
-- Cambios:
-- - financial_transactions: ON DELETE SET NULL (ya estaba así)
-- - payroll_records: ON DELETE SET NULL (ya estaba así)
-- - warehouse_stock: ON DELETE SET NULL (ya estaba así)
-- - purchase_orders: ON DELETE SET NULL (ya estaba así)
-- - AGREGADO: Comments documentando la alineación
-- ============================================================================

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON COLUMN financial_transactions.project_id IS 'SET NULL when project is deleted - preserves financial history';
COMMENT ON COLUMN payroll_records.project_id IS 'SET NULL when project is deleted - preserves payroll history';
COMMENT ON COLUMN warehouse_stock.project_id IS 'SET NULL when project is deleted - preserves stock history';
COMMENT ON COLUMN purchase_orders.project_id IS 'SET NULL when project is deleted - preserves order history';

-- ============================================================================
-- VERIFICACIÓN DE CONSISTENCIA
-- ============================================================================

-- Esta migración es solo documental, ya que las restricciones ya están correctas
-- El código cliente (offlineSync.ts) ha sido actualizado para usar SET NULL
-- en lugar de DELETE para alinear con el comportamiento del servidor

-- Las siguientes tablas usan CASCADE DELETE (correcto):
-- - budgets → budget_items (CASCADE)
-- - budget_items → budget_item_breakdowns (CASCADE)
-- - project_logs (CASCADE en projects)
-- - payroll_records → payroll_employees (CASCADE)
-- - purchase_orders → purchase_order_items (CASCADE)
-- - purchase_orders → suppliers (RESTRICT - requiere borrar POs antes)

-- Las siguientes tablas usan SET NULL (alineado con cliente):
-- - financial_transactions → projects (SET NULL)
-- - payroll_records → projects (SET NULL)
-- - warehouse_stock → projects (SET NULL)
-- - purchase_orders → projects (SET NULL)
