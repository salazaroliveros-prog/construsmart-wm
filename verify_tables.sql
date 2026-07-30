-- Verificar si las tablas de la aplicación existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'projects', 
  'budgets', 
  'budget_items', 
  'budget_item_breakdowns', 
  'financial_transactions', 
  'payroll_employees', 
  'payroll_records', 
  'warehouse_stock'
) 
ORDER BY table_name;
