-- Seed Data for CONSTRUCTORA WM/M&S
-- Execute this in Supabase Dashboard > SQL Editor

-- ==================== CLIENTS ====================
INSERT INTO clients (code, name, client_type, contact_person, phone, email, address, city, tax_id, notes, sync_status, created_at, updated_at)
VALUES
  ('CLI-001', 'Constructora Nova Guatemala', 'corporate', 'Juan Pérez', '502-2234-5678', 'contacto@novagt.com', 'Zona 10, Ciudad de Guatemala', 'Guatemala City', '1234567-0', 'Cliente principal de proyectos residenciales', 'synced', NOW(), NOW()),
  ('CLI-002', 'Inversiones del Pacífico', 'corporate', 'María García', '502-2367-8901', 'info@invpacifico.com', 'Zona 14, Ciudad de Guatemala', 'Guatemala City', '7654321-0', 'Desarrollos comerciales', 'synced', NOW(), NOW()),
  ('CLI-003', 'María Elena Rodríguez', 'individual', 'María Elena Rodríguez', '502-4567-8901', 'maria.rodriguez@email.com', 'Zona 15, Ciudad de Guatemala', 'Guatemala City', '9876543-0', 'Cliente residencial', 'synced', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ==================== PROJECTS ====================
INSERT INTO projects (code, name, client_name, location, typology, area_m2, quality_level, status, start_date, estimated_end_date, duration_days, total_budget, budget_total, calculated_duration, sync_status, created_at, updated_at)
VALUES
  ('PROJ-001', 'Edificio Residencial Las Torres', 'Constructora Nova Guatemala', 'Zona 10, Ciudad de Guatemala', 'residential', 2500, 'high', 'planning', NOW() + INTERVAL '30 days', NOW() + INTERVAL '180 days', 150, 850000, 850000, 150, 'synced', NOW(), NOW()),
  ('PROJ-002', 'Centro Comercial Plaza del Sol', 'Inversiones del Pacífico', 'Zona 12, Ciudad de Guatemala', 'commercial', 5000, 'medium', 'execution', NOW() - INTERVAL '60 days', NOW() + INTERVAL '120 days', 180, 2500000, 2500000, 180, 'synced', NOW(), NOW()),
  ('PROJ-003', 'Casa Familiar Los Alamos', 'María Elena Rodríguez', 'Zona 16, Ciudad de Guatemala', 'residential', 350, 'high', 'completed', NOW() - INTERVAL '180 days', NOW() - INTERVAL '30 days', 150, 420000, 420000, 150, 'synced', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ==================== BUDGETS ====================
INSERT INTO budgets (project_id, version, direct_cost, indirect_percentage, contingency_percentage, profit_percentage, total_amount, duration_days, sync_status, created_at, updated_at)
SELECT p.id, 1, 
  CASE p.code 
    WHEN 'PROJ-001' THEN 680000 
    WHEN 'PROJ-002' THEN 1785714 
    WHEN 'PROJ-003' THEN 336000 
  END,
  12, 5, 15,
  CASE p.code 
    WHEN 'PROJ-001' THEN 850000 
    WHEN 'PROJ-002' THEN 2500000 
    WHEN 'PROJ-003' THEN 420000 
  END,
  150, 'synced', NOW(), NOW()
FROM projects p
WHERE p.code IN ('PROJ-001', 'PROJ-002', 'PROJ-003')
ON CONFLICT (project_id, version) DO UPDATE SET
  total_amount = EXCLUDED.total_amount,
  updated_at = NOW();

-- ==================== BUDGET ITEMS ====================
INSERT INTO budget_items (budget_id, parent_id, code, description, unit, quantity, unit_cost, total_cost, item_order, is_custom, sync_status, created_at, updated_at)
SELECT b.id, NULL, '1.0', 'Trabajos Preliminares', 'global', 1, 85000, 85000, 1, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-001')
UNION ALL
SELECT b.id, NULL, '2.0', 'Obras de Concreto', 'global', 1, 340000, 340000, 2, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-001')
UNION ALL
SELECT b.id, NULL, '3.0', 'Acabados', 'global', 1, 170000, 170000, 3, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-001')
UNION ALL
SELECT b.id, NULL, '1.0', 'Obras Generales', 'global', 1, 892857, 892857, 1, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-002')
UNION ALL
SELECT b.id, NULL, '2.0', 'Instalaciones Eléctricas', 'global', 1, 446429, 446429, 2, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-002')
UNION ALL
SELECT b.id, NULL, '1.0', 'Construcción Principal', 'global', 1, 252000, 252000, 1, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-003')
UNION ALL
SELECT b.id, NULL, '2.0', 'Acabados y Pintura', 'global', 1, 84000, 84000, 2, false, 'synced', NOW(), NOW()
FROM budgets b WHERE b.project_id = (SELECT id FROM projects WHERE code = 'PROJ-003')
ON CONFLICT DO NOTHING;

-- ==================== FINANCIAL TRANSACTIONS ====================
INSERT INTO financial_transactions (project_id, type, category, description, quantity, unit, unit_cost, total_cost, date, receipt_url, sync_status, created_at, updated_at)
VALUES
  ((SELECT id FROM projects WHERE code = 'PROJ-001'), 'income', 'Anticipo', 'Anticipo inicial - Proyecto Las Torres', 1, 'global', 255000, 255000, NOW() - INTERVAL '5 days', '', 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-001'), 'expense', 'Materiales', 'Compra de cemento y acero', 50, 'bolsa', 120, 6000, NOW() - INTERVAL '3 days', '', 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-002'), 'income', 'Anticipo', 'Anticipo inicial - Plaza del Sol', 1, 'global', 750000, 750000, NOW() - INTERVAL '60 days', '', 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-002'), 'expense', 'Mano de Obra', 'Pago de planilla semanal', 1, 'semana', 45000, 45000, NOW() - INTERVAL '7 days', '', 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-002'), 'expense', 'Materiales', 'Compra de tubería y accesorios', 100, 'pieza', 250, 25000, NOW() - INTERVAL '10 days', '', 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-003'), 'income', 'Pago Final', 'Pago final - Casa Los Alamos', 1, 'global', 126000, 126000, NOW() - INTERVAL '30 days', '', 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-003'), 'expense', 'Materiales', 'Pintura y acabados finales', 1, 'lote', 15000, 15000, NOW() - INTERVAL '35 days', '', 'synced', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==================== PAYROLL EMPLOYEES ====================
INSERT INTO payroll_employees (name, position, daily_rate, category, department, hire_date, active, sync_status, created_at, updated_at)
VALUES
  ('Juan Carlos Pérez', 'Maestro de Obra', 500, 'obrero', 'Construcción', NOW() - INTERVAL '90 days', true, 'synced', NOW(), NOW()),
  ('Roberto Hernández', 'Ayudante General', 350, 'ayudante', 'Construcción', NOW() - INTERVAL '60 days', true, 'synced', NOW(), NOW()),
  ('Carlos Mendez', 'Electricista', 600, 'especialista', 'Instalaciones', NOW() - INTERVAL '45 days', true, 'synced', NOW(), NOW()),
  ('Luis García', 'Fontanero', 550, 'especialista', 'Instalaciones', NOW() - INTERVAL '45 days', true, 'synced', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==================== PAYROLL RECORDS ====================
INSERT INTO payroll_records (employee_id, project_id, period_start, period_end, days_worked, overtime_hours, overtime_rate, bonuses, deductions, base_salary, overtime_pay, gross_salary, igss_deduction, aguinaldo_provision, vacaciones_provision, net_salary, sync_status, created_at, updated_at)
SELECT e.id, p.id, NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days', 12, 8, 75, 500, 0, 6000, 600, 7100, 568, 355, 177.5, 6532, 'synced', NOW(), NOW()
FROM payroll_employees e, projects p 
WHERE e.name = 'Juan Carlos Pérez' AND p.code = 'PROJ-002'
UNION ALL
SELECT e.id, p.id, NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days', 14, 4, 52.5, 200, 0, 4900, 210, 5310, 424.8, 265.5, 132.75, 4885.2, 'synced', NOW(), NOW()
FROM payroll_employees e, projects p 
WHERE e.name = 'Roberto Hernández' AND p.code = 'PROJ-002'
UNION ALL
SELECT e.id, p.id, NOW() - INTERVAL '7 days', NOW(), 10, 0, 0, 0, 0, 6000, 0, 6000, 480, 300, 150, 5520, 'synced', NOW(), NOW()
FROM payroll_employees e, projects p 
WHERE e.name = 'Carlos Mendez' AND p.code = 'PROJ-001'
ON CONFLICT DO NOTHING;

-- ==================== WAREHOUSE STOCK ====================
INSERT INTO warehouse_stock (project_id, item_code, description, unit, current_stock, minimum_threshold, unit_cost, sync_status, created_at, updated_at)
VALUES
  ((SELECT id FROM projects WHERE code = 'PROJ-002'), 'MAT-001', 'Cemento Portland', 'bolsa', 500, 100, 120, 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-002'), 'MAT-002', 'Varilla de Acero 3/8"', 'pieza', 200, 50, 85, 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-002'), 'MAT-003', 'Bloque de Concreto', 'pieza', 1000, 200, 12, 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-001'), 'MAT-004', 'Pintura Blanca', 'galón', 50, 20, 350, 'synced', NOW(), NOW()),
  ((SELECT id FROM projects WHERE code = 'PROJ-003'), 'MAT-005', 'Cerámica para Piso', 'caja', 30, 10, 450, 'synced', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==================== SUPPLIERS ====================
INSERT INTO suppliers (code, name, contact_person, phone, email, address, city, payment_terms, notes, sync_status, created_at, updated_at)
VALUES
  ('SUP-001', 'Distribuidora de Materiales La Construcción', 'Pedro Gómez', '502-2345-6789', 'pedro@materialeslaconstruccion.com', 'Zona 7, Ciudad de Guatemala', 'Guatemala City', '30 días', 'Proveedor principal de cemento y acero', 'synced', NOW(), NOW()),
  ('SUP-002', 'Ferretería El Maestro', 'Ana López', '502-2456-7890', 'ana@ferreteriaelmaestro.com', 'Zona 3, Ciudad de Guatemala', 'Guatemala City', 'Contado', 'Herramientas y accesorios', 'synced', NOW(), NOW()),
  ('SUP-003', 'Electricidad y Tuberías S.A.', 'Miguel Torres', '502-2567-8901', 'miguel@electricidadytuberias.com', 'Zona 5, Ciudad de Guatemala', 'Guatemala City', '15 días', 'Materiales eléctricos y plomería', 'synced', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ==================== PURCHASE ORDERS ====================
INSERT INTO purchase_orders (code, supplier_id, project_id, order_date, expected_delivery_date, status, total_amount, notes, sync_status, created_at, updated_at)
SELECT 'PO-001', s.id, p.id, NOW() - INTERVAL '10 days', NOW() + INTERVAL '5 days', 'pending', 60000, 'Pedido inicial de materiales', 'synced', NOW(), NOW()
FROM suppliers s, projects p 
WHERE s.code = 'SUP-001' AND p.code = 'PROJ-002'
UNION ALL
SELECT 'PO-002', s.id, p.id, NOW() - INTERVAL '5 days', NOW() + INTERVAL '3 days', 'in_transit', 15000, 'Herramientas y equipos', 'synced', NOW(), NOW()
FROM suppliers s, projects p 
WHERE s.code = 'SUP-002' AND p.code = 'PROJ-002'
UNION ALL
SELECT 'PO-003', s.id, p.id, NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days', 'delivered', 8500, 'Materiales eléctricos', 'synced', NOW(), NOW()
FROM suppliers s, projects p 
WHERE s.code = 'SUP-003' AND p.code = 'PROJ-001'
ON CONFLICT (code) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- ==================== PURCHASE ORDER ITEMS ====================
INSERT INTO purchase_order_items (purchase_order_id, item_code, description, quantity, unit, unit_price, total_price, received_quantity, notes, sync_status, created_at, updated_at)
SELECT po.id, 'MAT-001', 'Cemento Portland', 500, 'bolsa', 120, 60000, 0, '', 'synced', NOW(), NOW()
FROM purchase_orders po WHERE po.code = 'PO-001'
UNION ALL
SELECT po.id, 'HERR-001', 'Juego de Herramientas', 10, 'juego', 1500, 15000, 10, 'Recibido completo', 'synced', NOW(), NOW()
FROM purchase_orders po WHERE po.code = 'PO-002'
UNION ALL
SELECT po.id, 'ELEC-001', 'Cable Eléctrico #12', 100, 'metro', 85, 8500, 100, 'Entregado', 'synced', NOW(), NOW()
FROM purchase_orders po WHERE po.code = 'PO-003'
ON CONFLICT DO NOTHING;

-- ==================== PROJECT LOGS ====================
INSERT INTO project_logs (project_id, activity_type, description, physical_progress, financial_progress, log_date, created_by, notes, sync_status, created_at, updated_at)
SELECT p.id, 'progress', 'Aprobación de planos arquitectónicos', 10, 5, NOW() - INTERVAL '10 days', 'Admin', 'Planos aprobados por cliente', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-001'
UNION ALL
SELECT p.id, 'milestone', 'Obtención de permisos municipales', 5, 2, NOW() - INTERVAL '5 days', 'Admin', 'En trámite', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-001'
UNION ALL
SELECT p.id, 'progress', 'Colocación de cimientos', 35, 30, NOW() - INTERVAL '30 days', 'Admin', 'Cimientos completados', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-002'
UNION ALL
SELECT p.id, 'progress', 'Levantamiento de estructura metálica', 55, 50, NOW() - INTERVAL '14 days', 'Admin', 'Estructura al 60%', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-002'
UNION ALL
SELECT p.id, 'milestone', 'Inspección de calidad', 60, 55, NOW() - INTERVAL '7 days', 'Admin', 'Inspección aprobada', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-002'
UNION ALL
SELECT p.id, 'milestone', 'Finalización de obra', 100, 100, NOW() - INTERVAL '30 days', 'Admin', 'Proyecto completado', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-003'
UNION ALL
SELECT p.id, 'milestone', 'Inspección final y entrega', 100, 100, NOW() - INTERVAL '28 days', 'Admin', 'Entregado a cliente', 'synced', NOW(), NOW()
FROM projects p WHERE p.code = 'PROJ-003'
ON CONFLICT DO NOTHING;

-- ==================== SUMMARY ====================
SELECT 
  'Data seeded successfully!' as status,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM budgets) as total_budgets,
  (SELECT COUNT(*) FROM budget_items) as total_budget_items,
  (SELECT COUNT(*) FROM financial_transactions) as total_transactions,
  (SELECT COUNT(*) FROM payroll_employees) as total_employees,
  (SELECT COUNT(*) FROM payroll_records) as total_payroll_records,
  (SELECT COUNT(*) FROM warehouse_stock) as total_stock_items,
  (SELECT COUNT(*) FROM suppliers) as total_suppliers,
  (SELECT COUNT(*) FROM purchase_orders) as total_purchase_orders,
  (SELECT COUNT(*) FROM project_logs) as total_project_logs;