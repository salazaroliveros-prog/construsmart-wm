-- CONSTRUCTORA WM/M&S - AGREGAR CAMPOS PARA LÓGICA DE NEGOCIO INTERCONECTADA
-- Esta migración agrega los campos necesarios para la interconexión de módulos

-- 1. AGREGAR CAMPOS DE PRESUPUESTO A projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_total DECIMAL(15, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS calculated_duration INTEGER;

-- 2. AGREGAR project_id A warehouse_stock
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 3. AGREGAR project_id A payroll_records
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 4. AGREGAR CAMPOS ADICIONALES A budget_items (para calculadora de losas)
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS length_m DECIMAL(10, 2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS width_m DECIMAL(10, 2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS depth_m DECIMAL(10, 2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS height_m DECIMAL(10, 2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS slab_type TEXT;

-- 5. AGREGAR ÍNDICES PARA LOS NUEVOS CAMPOS (solo si columnas existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget_total') THEN
    CREATE INDEX IF NOT EXISTS idx_projects_budget_total ON projects(budget_total);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'calculated_duration') THEN
    CREATE INDEX IF NOT EXISTS idx_projects_calculated_duration ON projects(calculated_duration);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_stock' AND column_name = 'project_id') THEN
    CREATE INDEX IF NOT EXISTS idx_warehouse_stock_project_id ON warehouse_stock(project_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_records' AND column_name = 'project_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON payroll_records(project_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budget_items' AND column_name = 'is_custom') THEN
    CREATE INDEX IF NOT EXISTS idx_budget_items_is_custom ON budget_items(is_custom);
  END IF;
END $$;

-- 6. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON COLUMN projects.budget_total IS 'Total del presupuesto calculado por el módulo de presupuestos';
COMMENT ON COLUMN projects.calculated_duration IS 'Duración en días calculada por el módulo de presupuestos';
COMMENT ON COLUMN warehouse_stock.project_id IS 'ID del proyecto al que pertenece el material (para filtrado por proyecto)';
COMMENT ON COLUMN payroll_records.project_id IS 'ID del proyecto al que pertenece el registro de nómina (para filtrado por proyecto)';
COMMENT ON COLUMN budget_items.is_custom IS 'Indica si el item fue creado manualmente (true) o viene de la base de datos (false)';
COMMENT ON COLUMN budget_items.length_m IS 'Longitud en metros (para cálculos de losas)';
COMMENT ON COLUMN budget_items.width_m IS 'Ancho en metros (para cálculos de losas)';
COMMENT ON COLUMN budget_items.depth_m IS 'Profundidad en metros (para cálculos de losas)';
COMMENT ON COLUMN budget_items.height_m IS 'Altura en metros (para cálculos de losas)';
COMMENT ON COLUMN budget_items.slab_type IS 'Tipo de losa (solid, ribbed, waffle, etc.)';
