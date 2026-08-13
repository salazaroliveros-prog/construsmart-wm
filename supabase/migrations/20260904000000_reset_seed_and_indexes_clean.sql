-- SAFETY BLOCK: this historical reset/seed migration is intentionally disabled.
-- It contains TRUNCATE ... CASCADE and must never run against a real database.
DO $$
BEGIN
  RAISE EXCEPTION 'Disabled destructive migration 20260904000000_reset_seed_and_indexes_clean.sql';
END $$;

-- ============================================================================
-- CONSTRUCTORA WM/M&S - CONSTRUYENDO EL FUTURO
-- Reset + Seed limpio + Indices alineados al frontend
-- ============================================================================

-- RESET
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['purchase_order_items','budget_item_breakdowns','budget_items','budgets','financial_transactions','payroll_records','payroll_employees','warehouse_stock','project_logs','purchase_orders','subcontractors','suppliers','clients','projects','profiles','pending_deletes','apu_library'] LOOP
    BEGIN
      EXECUTE format('TRUNCATE TABLE %I CASCADE', t);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Tabla % no existe, se salta', t;
    END;
  END LOOP;
END $$;

INSERT INTO profiles (id, full_name, role, company_name, phone, sync_status, created_at, updated_at)
VALUES ('ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'Administrador WM', 'admin', 'CONSTRUCTORA WM/M&S', '+502 5555-0101', 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, user_id, code, name, company_name, contact_person, phone, email, address, city, client_type, notes, account_balance, credit_limit, payment_terms_days, is_delinquent, sync_status, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-CLI-001', 'Juan Pablo Gómez', 'Inversiones GT', 'Juan Pablo Gómez', '+502 5555-1001', 'juan@inversiones.gt', '4ta avenida 10-20, Zona 1', 'Guatemala', 'individual', 'Cliente VIP', 0, 50000, 30, false, 'synced', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-CLI-002', 'María Fernanda López', 'Grupo Atlántida', 'María Fernanda López', '+502 5555-1002', 'maria@atlantida.gt', 'Ruta Interamericana CA-1', 'Mixco', 'corporate', 'Grupo empresarial', 12500, 80000, 45, false, 'synced', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-CLI-003', 'Roberto Castillo', 'Constructora Sol', 'Roberto Castillo', '+502 5555-1003', 'roberto@csol.gt', 'Km 12 Carretera a El Salvador', 'Guatemala', 'individual', 'Alerta de mora', -3200, 20000, 15, true, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, user_id, code, name, contact_person, phone, email, address, city, payment_terms, notes, categories, is_preferred, sync_status, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-SUP-001', 'Ferretería El Constructor', 'Carlos Ruano', '+502 5555-2001', 'ventas@elconstructor.gt', '5ta calle 8-15, Zona 4', 'Guatemala', 'Contado', 'Mejor precio en cemento', ARRAY['materiales','ferreteria'], true, 'synced', now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-SUP-002', 'Distribuidora del Sur', 'Ana Mazariegos', '+502 5555-2002', 'ana@delsur.gt', 'Lotificación San Cristobal', 'Villa Nueva', 'Crédito 30 días', 'Acero estructural', ARRAY['acero','estructural'], true, 'synced', now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-SUP-003', 'Pinturas Premium', 'Luis Herrera', '+502 5555-2003', 'luis@pinturaspremium.gt', 'Zona 12', 'Guatemala', 'Contado', 'Pintura y acabados', ARRAY['pintura','acabados'], false, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcontractors (id, user_id, supplier_id, code, name, company_name, contact_person, phone, email, address, city, specialties, retention_rate, advance_amount, advance_balance, retention_balance, is_active, sync_status, created_at, updated_at)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SEED-SUB-001', 'Electricidad Industrial', 'Elec Industrial S.A.', 'Pedro Pérez', '+502 5555-3001', 'pedro@elecind.gt', 'Zona 6', 'Guatemala', ARRAY['electricidad','instalaciones'], 0.10, 5000, 1000, 250, true, 'synced', now(), now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'SEED-SUB-002', 'Pisos y Alfombras', 'Pisos del Norte', 'Sandra Ortiz', '+502 5555-3002', 'sandra@pisosnorte.gt', 'Carretera Norte', 'Guatemala', ARRAY['pisos','acabados'], 0.10, 3000, 0, 150, true, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, user_id, code, name, client_name, client_phone, client_email, location, typology, area_m2, quality_level, status, start_date, estimated_end_date, duration_days, total_budget, budget_total, calculated_duration, has_critical_roadblock, roadblock_type, roadblock_description, roadblock_date, completion_buffer_days, sync_status, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-PROJ-001', 'Torres del Atardecer', 'Juan Pablo Gómez', '+502 5555-1001', 'juan@inversiones.gt', 'Zona 15, Guatemala', 'residential', 2500, 'premium', 'execution', '2026-01-15', '2026-12-15', 365, 8500000, 8500000, 365, false, null, null, null, 0, 'synced', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-PROJ-002', 'Centro Empresarial Atlántida', 'María Fernanda López', '+502 5555-1002', 'maria@atlantida.gt', 'Ruta Interamericana CA-1, Mixco', 'commercial', 4200, 'moderate', 'planning', '2026-03-01', '2027-03-01', 365, 15600000, 15600000, 365, false, null, null, null, 0, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO budgets (id, user_id, project_id, version, direct_cost, indirect_percentage, contingency_percentage, profit_percentage, total_amount, duration_days, sync_status, created_at, updated_at)
VALUES
  ('11110000-1000-1000-1000-100000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000001', 1, 6500000, 12, 5, 15, 8500000, 365, 'synced', now(), now()),
  ('11110000-1000-1000-1000-100000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000002', 1, 12000000, 10, 4, 12, 15600000, 365, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO budget_items (id, user_id, budget_id, project_id, parent_id, item_order, code, description, unit, quantity, unit_cost, total_cost, is_custom, actual_consumption, consumption_variance, sync_status, created_at, updated_at)
VALUES
  ('22220000-2000-2000-2000-200000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '11110000-1000-1000-1000-100000000001', '00000000-0000-0000-0000-000000000001', null, 1, 'SEED-BI-001', 'Obra gruesa y cimientos', 'm2', 2500, 1200, 3000000, false, 0, 0, 'synced', now(), now()),
  ('22220000-2000-2000-2000-200000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '11110000-1000-1000-1000-100000000001', '00000000-0000-0000-0000-000000000001', null, 2, 'SEED-BI-002', 'Instalaciones eléctricas y plumbing', 'm2', 2500, 800, 2000000, false, 0, 0, 'synced', now(), now()),
  ('22220000-2000-2000-2000-200000000003', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '11110000-1000-1000-1000-100000000002', '00000000-0000-0000-0000-000000000002', null, 1, 'SEED-BI-003', 'Estructura metálica y acabados', 'm2', 4200, 2800, 11760000, false, 0, 0, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO budget_item_breakdowns (id, user_id, budget_item_id, resource_type, code, description, unit, quantity_unitary, total_quantity, unit_price, total_price, waste_percentage, sync_status, created_at, updated_at)
VALUES
  ('33330000-3000-3000-3000-300000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '22220000-2000-2000-2000-200000000001', 'material', 'SEED-BIB-001', 'Cemento y agregados', 'm3', 350, 350, 450, 157500, 5.0, 'synced', now(), now()),
  ('33330000-3000-3000-3000-300000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '22220000-2000-2000-2000-200000000002', 'material', 'SEED-BIB-002', 'Cableado y tubería', 'm', 1200, 1200, 120, 144000, 5.0, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO financial_transactions (id, user_id, project_id, type, category, description, quantity, unit, unit_cost, total_cost, date, receipt_url, reference, sync_status, created_at, updated_at)
VALUES
  ('55550000-5000-5000-5000-500000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000001', 'expense', 'materiales', 'Compra de cemento', 100, 'saco', 4500, 450000, '2026-02-01', null, 'FAC-001', 'synced', now(), now()),
  ('55550000-5000-5000-5000-500000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000001', 'expense', 'mano_de_obra', 'Pago de jornales', 80, 'dia', 4000, 320000, '2026-02-05', null, 'FAC-002', 'synced', now(), now()),
  ('55550000-5000-5000-5000-500000000003', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000002', 'income', 'aporte', 'Anticipo cliente', 1, 'global', 5000000, 5000000, '2026-03-01', null, 'ING-001', 'synced', now(), now()),
  ('55550000-5000-5000-5000-500000000004', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000002', 'expense', 'herramienta', 'Renta de maquinaria', 15, 'dia', 12000, 180000, '2026-03-10', null, 'FAC-003', 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO payroll_employees (id, user_id, name, position, daily_rate, category, department, hire_date, active, sync_status, created_at, updated_at)
VALUES
  ('aaa00000-aaa0-aaa0-aaa0-aaaaaaaaaaaa', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'Carlos Mendez', 'Supervisor de Obra', 450, 'obrero', 'Producción', '2025-06-01', true, 'synced', now(), now()),
  ('bbb00000-bbb0-bbb0-bbb0-bbbbbbbbbbbb', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'Ana Lucia Pérez', 'Contadora', 550, 'empleado', 'Finanzas', '2025-08-15', true, 'synced', now(), now()),
  ('ccc00000-ccc0-ccc0-ccc0-cccccccccccc', null, 'Jorge Estrada', 'Maestro de Obra', 400, 'obrero', 'Producción', '2025-07-10', true, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO payroll_records (id, user_id, employee_id, period_start, period_end, days_worked, overtime_hours, overtime_rate, bonuses, deductions, base_salary, overtime_pay, gross_salary, igss_deduction, aguinaldo_provision, vacaciones_provision, net_salary, project_id, total_hours, hourly_rate, planned_hours, is_overrun_warning_fired, budget_item_id, sync_status, created_at, updated_at)
VALUES
  ('77770000-7000-7000-7000-700000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'aaa00000-aaa0-aaa0-aaa0-aaaaaaaaaaaa', '2026-02-01', '2026-02-15', 15, 8, 1.5, 500, 200, 6750, 600, 7050, 300, 400, 200, 6550, '00000000-0000-0000-0000-000000000001', 128, 52.73, 160, false, null, 'synced', now(), now()),
  ('77770000-7000-7000-7000-700000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'bbb00000-bbb0-bbb0-bbb0-bbbbbbbbbbbb', '2026-02-01', '2026-02-15', 15, 0, 1, 0, 150, 8250, 0, 8250, 350, 450, 250, 8200, '00000000-0000-0000-0000-000000000002', 120, 68.75, 120, false, null, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO warehouse_stock (id, user_id, item_code, description, unit, current_stock, minimum_threshold, unit_cost, preferred_supplier_id, auto_generate_po, last_po_date, category, project_id, sync_status, created_at, updated_at)
VALUES
  ('44440000-4000-4000-4000-400000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-WH-001', 'Cemento Portland', 'saco', 500, 100, 125, null, false, null, 'materiales', '00000000-0000-0000-0000-000000000001', 'synced', now(), now()),
  ('44440000-4000-4000-4000-400000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-WH-002', 'Varilla de acero 3/8', 'varilla', 200, 50, 85, null, false, null, 'acero', '00000000-0000-0000-0000-000000000001', 'synced', now(), now()),
  ('44440000-4000-4000-4000-400000000003', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-WH-003', 'Pintura látex blanca', 'galón', 80, 20, 320, null, false, null, 'pintura', '00000000-0000-0000-0000-000000000002', 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_orders (id, user_id, code, supplier_id, project_id, order_date, expected_delivery_date, status, total_amount, notes, sync_status, created_at, updated_at)
VALUES
  ('88880000-8000-8000-8000-800000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-PO-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '2026-02-10', '2026-02-15', 'pending', 450000, 'Pedido inicial de materiales', 'synced', now(), now()),
  ('88880000-8000-8000-8000-800000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', 'SEED-PO-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002', '2026-03-05', '2026-03-12', 'approved', 180000, 'Acero para estructura', 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_order_items (id, user_id, purchase_order_id, item_code, description, quantity, unit, unit_price, total_price, received_quantity, notes, sync_status, created_at, updated_at)
VALUES
  ('99990000-9000-9000-9000-900000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '88880000-8000-8000-8000-800000000001', 'SEED-POI-001', 'Cemento Portland 50kg', 300, 'saco', 450, 135000, 0, 'Entrega parcial', 'synced', now(), now()),
  ('99990000-9000-9000-9000-900000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '88880000-8000-8000-8000-800000000002', 'SEED-POI-002', 'Varilla 3/8 x 9m', 200, 'varilla', 85, 170000, 0, '', 'synced', now(), now()),
  ('99990000-9000-9000-9000-900000000003', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '88880000-8000-8000-8000-800000000002', 'SEED-POI-003', 'Pintura látex galón', 50, 'galón', 320, 16000, 0, '', 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_logs (id, user_id, project_id, activity_type, description, physical_progress, financial_progress, log_date, created_by, notes, photos, severity, roadblock_category, is_critical_roadblock, sync_status, created_at, updated_at)
VALUES
  ('66660000-6000-6000-6000-600000000001', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000001', 'progress', 'Avance en cimientos 45% completado', 45.00, 30.00, '2026-02-15', 'Admin WM', 'Sin novedades', null, 'medium', null, false, 'synced', now(), now()),
  ('66660000-6000-6000-6000-600000000002', 'ef818cc0-3599-48f0-905d-6be4c8cf05e8', '00000000-0000-0000-0000-000000000002', 'issue', 'Retraso por lluvias en obra gris', 20.00, 15.00, '2026-03-02', 'Admin WM', 'Severo', null, 'high', 'clima', true, 'synced', now(), now())
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_sync_status ON public.projects(sync_status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id_status ON public.projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_sync_status ON public.budgets(sync_status);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON public.budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id_budget_id ON public.budget_items(project_id, budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_sync_status ON public.budget_items(sync_status);

CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_budget_item_id ON public.budget_item_breakdowns(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_breakdowns_sync_status ON public.budget_item_breakdowns(sync_status);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON public.financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id_date ON public.financial_transactions(project_id, date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_sync_status ON public.financial_transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_expense_project_date ON public.financial_transactions(project_id, date) WHERE type = 'expense';
CREATE INDEX IF NOT EXISTS idx_payroll_employees_category ON public.payroll_employees(category);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_department ON public.payroll_employees(department);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_sync_status ON public.payroll_employees(sync_status);

CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON public.payroll_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id_period_end ON public.payroll_records(project_id, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_records_sync_status ON public.payroll_records(sync_status);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_item_code ON public.warehouse_stock(item_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_project_id ON public.warehouse_stock(project_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_category ON public.warehouse_stock(category);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_sync_status ON public.warehouse_stock(sync_status);

CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON public.project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_log_date ON public.project_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id_log_date ON public.project_logs(project_id, log_date);
CREATE INDEX IF NOT EXISTS idx_project_logs_activity_type ON public.project_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_sync_status ON public.project_logs(sync_status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id_status ON public.purchase_orders(project_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_sync_status ON public.purchase_orders(sync_status);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sync_status ON public.purchase_order_items(sync_status);

CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_is_delinquent ON public.clients(is_delinquent);
CREATE INDEX IF NOT EXISTS idx_clients_sync_status ON public.clients(sync_status);

CREATE INDEX IF NOT EXISTS idx_suppliers_categories ON public.suppliers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON public.suppliers(is_preferred);
CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON public.suppliers(sync_status);

CREATE INDEX IF NOT EXISTS idx_subcontractors_user_id ON public.subcontractors(user_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_is_active ON public.subcontractors(is_active);
CREATE INDEX IF NOT EXISTS idx_subcontractors_supplier_id ON public.subcontractors(supplier_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_sync_status ON public.subcontractors(sync_status);


CREATE INDEX IF NOT EXISTS idx_budget_items_apu_result ON public.budget_items USING GIN(apu_result);
CREATE INDEX IF NOT EXISTS idx_budget_items_apu_params ON public.budget_items USING GIN(apu_params);
CREATE INDEX IF NOT EXISTS idx_project_logs_photos ON public.project_logs USING GIN(photos);
