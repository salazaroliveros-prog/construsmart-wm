-- AGREGAR CAMPOS FALTANTES PARA COINCIDIR CON INTERFACES LOCALES

-- 1. Agregar campos faltantes a financial_transactions
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unid',
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2) DEFAULT 0;

-- 2. Agregar 'subcontract' a los valores permitidos en budget_item_breakdowns
ALTER TABLE budget_item_breakdowns 
DROP CONSTRAINT IF EXISTS budget_item_breakdowns_resource_type_check;

ALTER TABLE budget_item_breakdowns 
ADD CONSTRAINT budget_item_breakdowns_resource_type_check 
CHECK (resource_type IN ('material', 'labor', 'equipment', 'subcontract'));

-- 3. Verificar que unit_cost y total_cost existan en budget_item_breakdowns
ALTER TABLE budget_item_breakdowns 
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15, 2);