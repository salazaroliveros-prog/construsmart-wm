#!/usr/bin/env node
/**
 * Seed Test Data for CONSTRUCTORA WM/M&S
 * 
 * Inserts complete test data into remote Supabase database:
 * - 3 projects (planning, execution, completed)
 * - Budgets, items, and breakdowns
 * - Financial transactions
 * - Payroll employees and records
 * - Warehouse stock
 * - Clients
 * - Suppliers and purchase orders
 * - Project logs with progress
 * 
 * Usage:
 *   node scripts/seed-test-data.js
 * 
 * Requires .env with SUPABASE_URL and SUPABASE_SECRET_KEY
 */

require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

// Helper to make REST API calls
async function supabaseRequest(table, method = 'GET', data = null) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': SUPABASE_SECRET_KEY,
    'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const options = { method, headers };
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  // Use PATCH with upsert to avoid duplicate key errors
  if (method === 'POST') {
    options.method = 'PATCH';
    headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
  }

  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok && res.status !== 201 && res.status !== 200) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  // Parse response
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // Empty response is ok for POST (201 Created with no body)
    return [];
  }

  // Supabase returns array for POST, or object/array for GET
  return Array.isArray(json) ? json : [json];
}

// Generate UUID
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get today's date
function today() {
  return new Date().toISOString().split('T')[0];
}

// Get date in the past
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

// Get date in the future
function daysFromNow(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('\n🌱 Seeding Test Data for CONSTRUCTORA WM/M&S\n');
  console.log('='.repeat(60));

  try {
    // ==================== CLIENTS ====================
    console.log('\n👥 Creating clients...');
    const clients = [
      { code: 'CLI-001', name: 'Constructora Nova Guatemala', client_type: 'corporate', contact_person: 'Juan Pérez', phone: '502-2234-5678', email: 'contacto@novagt.com', address: 'Zona 10, Ciudad de Guatemala', city: 'Guatemala City', tax_id: '1234567-0', notes: 'Cliente principal de proyectos residenciales' },
      { code: 'CLI-002', name: 'Inversiones del Pacífico', client_type: 'corporate', contact_person: 'María García', phone: '502-2367-8901', email: 'info@invpacifico.com', address: 'Zona 14, Ciudad de Guatemala', city: 'Guatemala City', tax_id: '7654321-0', notes: 'Desarrollos comerciales' },
      { code: 'CLI-003', name: 'María Elena Rodríguez', client_type: 'individual', contact_person: 'María Elena Rodríguez', phone: '502-4567-8901', email: 'maria.rodriguez@email.com', address: 'Zona 15, Ciudad de Guatemala', city: 'Guatemala City', tax_id: '9876543-0', notes: 'Cliente residencial' }
    ];

    const clientIds = [];
    for (const client of clients) {
      const inserted = await supabaseRequest('clients', 'POST', {
        ...client,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (!inserted || inserted.length === 0 || !inserted[0] || !inserted[0].id) {
        console.error(`  ⚠️  Client response:`, inserted);
        throw new Error(`Failed to insert client: ${client.name}`);
      }
      clientIds.push(inserted[0].id);
      console.log(`  ✅ Client: ${client.name} (id: ${inserted[0].id})`);
    }

    // ==================== PROJECTS ====================
    console.log('\n🏗️  Creating projects...');
    const projects = [
      {
        code: 'PROJ-001',
        name: 'Edificio Residencial Las Torres',
        client_name: clients[0].name,
        location: 'Zona 10, Ciudad de Guatemala',
        typology: 'residential',
        area_m2: 2500,
        quality_level: 'high',
        status: 'planning',
        start_date: daysFromNow(30),
        estimated_end_date: daysFromNow(180),
        duration_days: 150,
        total_budget: 850000,
        budget_total: 850000,
        calculated_duration: 150,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        code: 'PROJ-002',
        name: 'Centro Comercial Plaza del Sol',
        client_name: clients[1].name,
        location: 'Zona 12, Ciudad de Guatemala',
        typology: 'commercial',
        area_m2: 5000,
        quality_level: 'medium',
        status: 'execution',
        start_date: daysAgo(60),
        estimated_end_date: daysFromNow(120),
        duration_days: 180,
        total_budget: 2500000,
        budget_total: 2500000,
        calculated_duration: 180,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        code: 'PROJ-003',
        name: 'Casa Familiar Los Alamos',
        client_name: clients[2].name,
        location: 'Zona 16, Ciudad de Guatemala',
        typology: 'residential',
        area_m2: 350,
        quality_level: 'high',
        status: 'completed',
        start_date: daysAgo(180),
        estimated_end_date: daysAgo(30),
        duration_days: 150,
        total_budget: 420000,
        budget_total: 420000,
        calculated_duration: 150,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const projectIds = [];
    for (const project of projects) {
      const inserted = await supabaseRequest('projects', 'POST', project);
      if (!inserted || inserted.length === 0 || !inserted[0] || !inserted[0].id) {
        console.error(`  ⚠️  Project response:`, inserted);
        throw new Error(`Failed to insert project: ${project.name}`);
      }
      projectIds.push(inserted[0].id);
      console.log(`  ✅ Project: ${project.name} (${project.status})`);
    }

    // ==================== BUDGETS ====================
    console.log('\n💰 Creating budgets...');
    const budgets = [
      {
        project_id: projectIds[0],
        version: 1,
        direct_cost: 680000,
        indirect_percentage: 12,
        contingency_percentage: 5,
        profit_percentage: 15,
        total_amount: 850000,
        duration_days: 150,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        project_id: projectIds[1],
        version: 1,
        direct_cost: 1785714,
        indirect_percentage: 10,
        contingency_percentage: 5,
        profit_percentage: 12,
        total_amount: 2500000,
        duration_days: 180,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        project_id: projectIds[2],
        version: 1,
        direct_cost: 336000,
        indirect_percentage: 12,
        contingency_percentage: 5,
        profit_percentage: 15,
        total_amount: 420000,
        duration_days: 150,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const budgetIds = [];
    for (const budget of budgets) {
      const inserted = await supabaseRequest('budgets', 'POST', budget);
      if (!inserted || inserted.length === 0 || !inserted[0] || !inserted[0].id) {
        console.error(`  ⚠️  Budget response:`, inserted);
        throw new Error(`Failed to insert budget for project: ${budget.project_id}`);
      }
      budgetIds.push(inserted[0].id);
      console.log(`  ✅ Budget for project: ${budget.project_id}`);
    }

    // ==================== BUDGET ITEMS ====================
    console.log('\n📋 Creating budget items...');
    const budgetItems = [
      // Budget 1 items
      { budget_id: budgetIds[0], parent_id: null, code: '1.0', description: 'Trabajos Preliminares', unit: 'global', quantity: 1, unit_cost: 85000, total_cost: 85000, item_order: 1, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { budget_id: budgetIds[0], parent_id: null, code: '2.0', description: 'Obras de Concreto', unit: 'global', quantity: 1, unit_cost: 340000, total_cost: 340000, item_order: 2, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { budget_id: budgetIds[0], parent_id: null, code: '3.0', description: 'Acabados', unit: 'global', quantity: 1, unit_cost: 170000, total_cost: 170000, item_order: 3, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      // Budget 2 items
      { budget_id: budgetIds[1], parent_id: null, code: '1.0', description: 'Obras Generales', unit: 'global', quantity: 1, unit_cost: 892857, total_cost: 892857, item_order: 1, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { budget_id: budgetIds[1], parent_id: null, code: '2.0', description: 'Instalaciones Eléctricas', unit: 'global', quantity: 1, unit_cost: 446429, total_cost: 446429, item_order: 2, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      // Budget 3 items
      { budget_id: budgetIds[2], parent_id: null, code: '1.0', description: 'Construcción Principal', unit: 'global', quantity: 1, unit_cost: 252000, total_cost: 252000, item_order: 1, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { budget_id: budgetIds[2], parent_id: null, code: '2.0', description: 'Acabados y Pintura', unit: 'global', quantity: 1, unit_cost: 84000, total_cost: 84000, item_order: 2, is_custom: false, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const budgetItemIds = [];
    for (const item of budgetItems) {
      const inserted = await supabaseRequest('budget_items', 'POST', item);
      if (!inserted || inserted.length === 0 || !inserted[0] || !inserted[0].id) {
        console.error(`  ⚠️  Budget item response:`, inserted);
        throw new Error(`Failed to insert budget item: ${item.description}`);
      }
      budgetItemIds.push(inserted[0].id);
      console.log(`  ✅ Budget item: ${item.description}`);
    }

    // ==================== FINANCIAL TRANSACTIONS ====================
    console.log('\n💵 Creating financial transactions...');
    const transactions = [
      { project_id: projectIds[0], type: 'income', category: 'Anticipo', description: 'Anticipo inicial - Proyecto Las Torres', quantity: 1, unit: 'global', unit_cost: 255000, total_cost: 255000, date: daysAgo(5), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[0], type: 'expense', category: 'Materiales', description: 'Compra de cemento y acero', quantity: 50, unit: 'bolsa', unit_cost: 120, total_cost: 6000, date: daysAgo(3), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], type: 'income', category: 'Anticipo', description: 'Anticipo inicial - Plaza del Sol', quantity: 1, unit: 'global', unit_cost: 750000, total_cost: 750000, date: daysAgo(60), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], type: 'expense', category: 'Mano de Obra', description: 'Pago de planilla semanal', quantity: 1, unit: 'semana', unit_cost: 45000, total_cost: 45000, date: daysAgo(7), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], type: 'expense', category: 'Materiales', description: 'Compra de tubería y accesorios', quantity: 100, unit: 'pieza', unit_cost: 250, total_cost: 25000, date: daysAgo(10), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[2], type: 'income', category: 'Pago Final', description: 'Pago final - Casa Los Alamos', quantity: 1, unit: 'global', unit_cost: 126000, total_cost: 126000, date: daysAgo(30), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[2], type: 'expense', category: 'Materiales', description: 'Pintura y acabados finales', quantity: 1, unit: 'lote', unit_cost: 15000, total_cost: 15000, date: daysAgo(35), receipt_url: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    for (const tx of transactions) {
      await supabaseRequest('financial_transactions', 'POST', tx);
      console.log(`  ✅ Transaction: ${tx.description}`);
    }

    // ==================== PAYROLL EMPLOYEES ====================
    console.log('\n👷 Creating payroll employees...');
    const employees = [
      { name: 'Juan Carlos Pérez', position: 'Maestro de Obra', daily_rate: 500, category: 'obrero', department: 'Construcción', hire_date: daysAgo(90), active: true, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Roberto Hernández', position: 'Ayudante General', daily_rate: 350, category: 'ayudante', department: 'Construcción', hire_date: daysAgo(60), active: true, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Carlos Mendez', position: 'Electricista', daily_rate: 600, category: 'especialista', department: 'Instalaciones', hire_date: daysAgo(45), active: true, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Luis García', position: 'Fontanero', daily_rate: 550, category: 'especialista', department: 'Instalaciones', hire_date: daysAgo(45), active: true, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const employeeIds = [];
    for (const emp of employees) {
      const [inserted] = await supabaseRequest('payroll_employees', 'POST', emp);
      employeeIds.push(inserted[0].id);
      console.log(`  ✅ Employee: ${emp.name}`);
    }

    // ==================== PAYROLL RECORDS ====================
    console.log('\n💼 Creating payroll records...');
    const payrollRecords = [
      { employee_id: employeeIds[0], project_id: projectIds[1], period_start: daysAgo(14), period_end: daysAgo(7), days_worked: 12, overtime_hours: 8, overtime_rate: 75, bonuses: 500, deductions: 0, base_salary: 6000, overtime_pay: 600, gross_salary: 7100, igss_deduction: 568, aguinaldo_provision: 355, vacaciones_provision: 177.5, net_salary: 6532, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { employee_id: employeeIds[1], project_id: projectIds[1], period_start: daysAgo(14), period_end: daysAgo(7), days_worked: 14, overtime_hours: 4, overtime_rate: 52.5, bonuses: 200, deductions: 0, base_salary: 4900, overtime_pay: 210, gross_salary: 5310, igss_deduction: 424.8, aguinaldo_provision: 265.5, vacaciones_provision: 132.75, net_salary: 4885.2, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { employee_id: employeeIds[2], project_id: projectIds[0], period_start: daysAgo(7), period_end: daysAgo(0), days_worked: 10, overtime_hours: 0, overtime_rate: 0, bonuses: 0, deductions: 0, base_salary: 6000, overtime_pay: 0, gross_salary: 6000, igss_deduction: 480, aguinaldo_provision: 300, vacaciones_provision: 150, net_salary: 5520, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    for (const record of payrollRecords) {
      await supabaseRequest('payroll_records', 'POST', record);
      console.log(`  ✅ Payroll record for employee ${record.employee_id}`);
    }

    // ==================== WAREHOUSE STOCK ====================
    console.log('\n📦 Creating warehouse stock...');
    const stockItems = [
      { project_id: projectIds[1], item_code: 'MAT-001', description: 'Cemento Portland', unit: 'bolsa', current_stock: 500, minimum_threshold: 100, unit_cost: 120, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], item_code: 'MAT-002', description: 'Varilla de Acero 3/8"', unit: 'pieza', current_stock: 200, minimum_threshold: 50, unit_cost: 85, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], item_code: 'MAT-003', description: 'Bloque de Concreto', unit: 'pieza', current_stock: 1000, minimum_threshold: 200, unit_cost: 12, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[0], item_code: 'MAT-004', description: 'Pintura Blanca', unit: 'galón', current_stock: 50, minimum_threshold: 20, unit_cost: 350, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[2], item_code: 'MAT-005', description: 'Cerámica para Piso', unit: 'caja', current_stock: 30, minimum_threshold: 10, unit_cost: 450, sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    for (const item of stockItems) {
      await supabaseRequest('warehouse_stock', 'POST', item);
      console.log(`  ✅ Stock: ${item.description} (${item.current_stock} ${item.unit})`);
    }

    // ==================== SUPPLIERS ====================
    console.log('\n🚚 Creating suppliers...');
    const suppliers = [
      { code: 'SUP-001', name: 'Distribuidora de Materiales La Construcción', contact_person: 'Pedro Gómez', phone: '502-2345-6789', email: 'pedro@materialeslaconstruccion.com', address: 'Zona 7, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: '30 días', notes: 'Proveedor principal de cemento y acero', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { code: 'SUP-002', name: 'Ferretería El Maestro', contact_person: 'Ana López', phone: '502-2456-7890', email: 'ana@ferreteriaelmaestro.com', address: 'Zona 3, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: 'Contado', notes: 'Herramientas y accesorios', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { code: 'SUP-003', name: 'Electricidad y Tuberías S.A.', contact_person: 'Miguel Torres', phone: '502-2567-8901', email: 'miguel@electricidadytuberias.com', address: 'Zona 5, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: '15 días', notes: 'Materiales eléctricos y plomería', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const supplierIds = [];
    for (const supplier of suppliers) {
      const [inserted] = await supabaseRequest('suppliers', 'POST', supplier);
      supplierIds.push(inserted[0].id);
      console.log(`  ✅ Supplier: ${supplier.name}`);
    }

    // ==================== PURCHASE ORDERS ====================
    console.log('\n🛒 Creating purchase orders...');
    const purchaseOrders = [
      { code: 'PO-001', supplier_id: supplierIds[0], project_id: projectIds[1], order_date: daysAgo(10), expected_delivery_date: daysFromNow(5), status: 'pending', total_amount: 60000, notes: 'Pedido inicial de materiales', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { code: 'PO-002', supplier_id: supplierIds[1], project_id: projectIds[1], order_date: daysAgo(5), expected_delivery_date: daysFromNow(3), status: 'in_transit', total_amount: 15000, notes: 'Herramientas y equipos', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { code: 'PO-003', supplier_id: supplierIds[2], project_id: projectIds[0], order_date: daysAgo(3), expected_delivery_date: daysFromNow(2), status: 'delivered', total_amount: 8500, notes: 'Materiales eléctricos', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const poIds = [];
    for (const po of purchaseOrders) {
      const [inserted] = await supabaseRequest('purchase_orders', 'POST', po);
      poIds.push(inserted[0].id);
      console.log(`  ✅ Purchase Order: ${po.code}`);
    }

    // ==================== PURCHASE ORDER ITEMS ====================
    console.log('\n📦 Creating purchase order items...');
    const poItems = [
      { purchase_order_id: poIds[0], item_code: 'MAT-001', description: 'Cemento Portland', quantity: 500, unit: 'bolsa', unit_price: 120, total_price: 60000, received_quantity: 0, notes: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { purchase_order_id: poIds[1], item_code: 'HERR-001', description: 'Juego de Herramientas', quantity: 10, unit: 'juego', unit_price: 1500, total_price: 15000, received_quantity: 10, notes: 'Recibido completo', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { purchase_order_id: poIds[2], item_code: 'ELEC-001', description: 'Cable Eléctrico #12', quantity: 100, unit: 'metro', unit_price: 85, total_price: 8500, received_quantity: 100, notes: 'Entregado', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    for (const item of poItems) {
      await supabaseRequest('purchase_order_items', 'POST', item);
      console.log(`  ✅ PO Item: ${item.description}`);
    }

    // ==================== PROJECT LOGS ====================
    console.log('\n📝 Creating project logs...');
    const projectLogs = [
      // Project 1 logs (planning) - activity_type: progress, issue, milestone, note
      { project_id: projectIds[0], activity_type: 'progress', description: 'Aprobación de planos arquitectónicos', physical_progress: 10, financial_progress: 5, log_date: daysAgo(10), created_by: 'Admin', notes: 'Planos aprobados por cliente', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[0], activity_type: 'milestone', description: 'Obtención de permisos municipales', physical_progress: 5, financial_progress: 2, log_date: daysAgo(5), created_by: 'Admin', notes: 'En trámite', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      // Project 2 logs (execution)
      { project_id: projectIds[1], activity_type: 'progress', description: 'Colocación de cimientos', physical_progress: 35, financial_progress: 30, log_date: daysAgo(30), created_by: 'Admin', notes: 'Cimientos completados', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], activity_type: 'progress', description: 'Levantamiento de estructura metálica', physical_progress: 55, financial_progress: 50, log_date: daysAgo(14), created_by: 'Admin', notes: 'Estructura al 60%', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[1], activity_type: 'milestone', description: 'Inspección de calidad', physical_progress: 60, financial_progress: 55, log_date: daysAgo(7), created_by: 'Admin', notes: 'Inspección aprobada', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      // Project 3 logs (completed)
      { project_id: projectIds[2], activity_type: 'milestone', description: 'Finalización de obra', physical_progress: 100, financial_progress: 100, log_date: daysAgo(30), created_by: 'Admin', notes: 'Proyecto completado', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { project_id: projectIds[2], activity_type: 'milestone', description: 'Inspección final y entrega', physical_progress: 100, financial_progress: 100, log_date: daysAgo(28), created_by: 'Admin', notes: 'Entregado a cliente', photos: '', sync_status: 'synced', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    for (const log of projectLogs) {
      await supabaseRequest('project_logs', 'POST', log);
      console.log(`  ✅ Log: ${log.activity_type} - ${log.project_id}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - ${clients.length} clients`);
    console.log(`  - ${projects.length} projects (1 planning, 1 execution, 1 completed)`);
    console.log(`  - ${budgets.length} budgets`);
    console.log(`  - ${budgetItems.length} budget items`);
    console.log(`  - ${transactions.length} financial transactions`);
    console.log(`  - ${employees.length} payroll employees`);
    console.log(`  - ${payrollRecords.length} payroll records`);
    console.log(`  - ${stockItems.length} warehouse stock items`);
    console.log(`  - ${suppliers.length} suppliers`);
    console.log(`  - ${purchaseOrders.length} purchase orders`);
    console.log(`  - ${poItems.length} purchase order items`);
    console.log(`  - ${projectLogs.length} project logs`);
    console.log('\n🎯 Open the dashboard and verify:');
    console.log('  1. KPIs show correct totals');
    console.log('  2. Project overview shows all 3 projects');
    console.log('  3. Financial charts display transactions');
    console.log('  4. Budget calculator shows budget items');
    console.log('  5. Warehouse shows stock levels');
    console.log('  6. Suppliers and purchase orders visible');
    console.log('  7. Project logs show progress');
    console.log('  8. Realtime updates when data changes');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

main();