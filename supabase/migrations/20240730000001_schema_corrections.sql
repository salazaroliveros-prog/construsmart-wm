-- CORRECCIONES DEL SCHEMA PARA COINCIDIR CON INTERFACES LOCALES

-- 1. Actualizar financial_transactions - Categorías
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;

ALTER TABLE financial_transactions 
ADD CONSTRAINT financial_transactions_category_check 
CHECK (category IN ('materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 
                    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'));

-- 2. Actualizar budgets - Renombrar campos uno por uno
ALTER TABLE budgets RENAME COLUMN base_budget TO direct_cost;
ALTER TABLE budgets RENAME COLUMN indirects TO indirect_percentage;
ALTER TABLE budgets RENAME COLUMN contingencies TO contingency_percentage;
ALTER TABLE budgets RENAME COLUMN utility TO profit_percentage;
ALTER TABLE budgets RENAME COLUMN total_budget TO total_amount;

-- Actualizar tipos de datos de porcentajes a DECIMAL(5,2)
ALTER TABLE budgets ALTER COLUMN indirect_percentage TYPE DECIMAL(5,2);
ALTER TABLE budgets ALTER COLUMN contingency_percentage TYPE DECIMAL(5,2);
ALTER TABLE budgets ALTER COLUMN profit_percentage TYPE DECIMAL(5,2);

-- 3. Actualizar budget_items - Renombrar campos uno por uno
ALTER TABLE budget_items RENAME COLUMN unit_price TO unit_cost;
ALTER TABLE budget_items RENAME COLUMN total_price TO total_cost;

-- 4. Actualizar budget_item_breakdowns - Renombrar campos uno por uno
ALTER TABLE budget_item_breakdowns RENAME COLUMN unit_price TO unit_cost;
ALTER TABLE budget_item_breakdowns RENAME COLUMN total_price TO total_cost;

-- 5. Actualizar financial_transactions - Cambiar amount a total_cost
ALTER TABLE financial_transactions RENAME COLUMN amount TO total_cost;
