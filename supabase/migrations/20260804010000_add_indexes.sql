-- ============================================================================
-- Índices para consultas frecuentes
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- Agrega índices sobre las columnas que se filtran / unen con mayor frecuencia
-- (aislamiento por owner, reportes de costo por proyecto, almacén por código).
-- Todas las columnas existen en el esquema actual (ver EXPECTED_COLUMNS).
-- ============================================================================

-- Aislamiento por propietario: filtrar proyectos por usuario
create index if not exists idx_projects_user_id on public.projects(user_id);

-- Transacciones financieras por proyecto y fecha (reportes EVM / tendencias)
create index if not exists idx_financial_transactions_project_date
  on public.financial_transactions(project_id, date);
create index if not exists idx_financial_transactions_type
  on public.financial_transactions(type);

-- Items de presupuesto por presupuesto y por proyecto
create index if not exists idx_budget_items_budget_id on public.budget_items(budget_id);
create index if not exists idx_budget_items_project_id on public.budget_items(project_id);

-- Almacén: búsqueda por código de material y por proyecto
create index if not exists idx_warehouse_stock_item_code on public.warehouse_stock(item_code);
create index if not exists idx_warehouse_stock_project_id on public.warehouse_stock(project_id);

-- Nómina por proyecto
create index if not exists idx_payroll_records_project_id on public.payroll_records(project_id);

-- Bitácora por proyecto y fecha
create index if not exists idx_project_logs_project_id on public.project_logs(project_id);
create index if not exists idx_project_logs_log_date on public.project_logs(log_date);

-- Órdenes de compra por proyecto y proveedor
create index if not exists idx_purchase_orders_project_id on public.purchase_orders(project_id);
create index if not exists idx_purchase_orders_supplier_id on public.purchase_orders(supplier_id);