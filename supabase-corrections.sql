-- CORRECCIONES DEL SCHEMA PARA COINCIDIR CON INTERFACES LOCALES
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar financial_transactions - Categorías
-- Primero eliminar la restricción CHECK existente
ALTER TABLE financial_transactions DROP CONSTRAINT financial_transactions_category_check;

-- Agregar nueva restricción con categorías locales
ALTER TABLE financial_transactions 
ADD CONSTRAINT financial_transactions_category_check 
CHECK (category IN ('materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 
                    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'));

-- 2. Actualizar budgets - Renombrar campos para coincidir con local
ALTER TABLE budgets 
RENAME COLUMN base_budget TO direct_cost,
RENAME COLUMN indirects TO indirect_percentage,
RENAME COLUMN contingencies TO contingency_percentage,
RENAME COLUMN utility TO profit_percentage,
RENAME COLUMN total_budget TO total_amount;

-- Actualizar tipos de datos de porcentajes a DECIMAL(5,2) para permitir valores como 15.50
ALTER TABLE budgets 
ALTER COLUMN indirect_percentage TYPE DECIMAL(5,2),
ALTER COLUMN contingency_percentage TYPE DECIMAL(5,2),
ALTER COLUMN profit_percentage TYPE DECIMAL(5,2);

-- 3. Actualizar budget_items - Renombrar campos para coincidir con local
ALTER TABLE budget_items 
RENAME COLUMN unit_price TO unit_cost,
RENAME COLUMN total_price TO total_cost;

-- 4. Actualizar budget_item_breakdowns - Renombrar campos para coincidir con local
ALTER TABLE budget_item_breakdowns 
RENAME COLUMN unit_price TO unit_cost,
RENAME COLUMN total_price TO total_cost;

-- 5. Actualizar financial_transactions - Cambiar amount a total_cost para coincidir con local
ALTER TABLE financial_transactions 
RENAME COLUMN amount TO total_cost;

-- 6. Verificar los cambios
SELECT 
    'financial_transactions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'financial_transactions' 
ORDER BY ordinal_position;

SELECT 
    'budgets' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

SELECT 
    'budget_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'budget_items' 
ORDER BY ordinal_position;
