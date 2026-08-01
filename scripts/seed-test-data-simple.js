#!/usr/bin/env node
/**
 * Simple Seed Test Data - INSERT ONLY
 * No upserts, just insert new data
 */

require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function supabaseRequest(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': SUPABASE_SECRET_KEY,
    'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return JSON.parse(text);
}

function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

function daysFromNow(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('\n🌱 Seeding Test Data (Simple INSERT)\n');

  try {
    // ==================== PROJECTS ====================
    console.log('🏗️  Creating projects...');
    const projects = [
      {
        code: 'PROJ-001',
        name: 'Edificio Residencial Las Torres',
        client_name: 'Constructora Nova Guatemala',
        location: 'Zona 10, Ciudad de Guatemala',
        typology: 'residential',
        area_m2: 2500,
        quality_level: 'premium',
        status: 'planning',
        start_date: daysFromNow(30),
        estimated_end_date: daysFromNow(180),
        duration_days: 150,
        total_budget: 850000,
        budget_total: 850000,
        calculated_duration: 150,
        sync_status: 'synced'
      },
      {
        code: 'PROJ-002',
        name: 'Centro Comercial Plaza del Sol',
        client_name: 'Inversiones del Pacífico',
        location: 'Zona 12, Ciudad de Guatemala',
        typology: 'commercial',
        area_m2: 5000,
        quality_level: 'moderate',
        status: 'execution',
        start_date: daysAgo(60),
        estimated_end_date: daysFromNow(120),
        duration_days: 180,
        total_budget: 2500000,
        budget_total: 2500000,
        calculated_duration: 180,
        sync_status: 'synced'
      },
      {
        code: 'PROJ-003',
        name: 'Casa Familiar Los Alamos',
        client_name: 'María Elena Rodríguez',
        location: 'Zona 16, Ciudad de Guatemala',
        typology: 'residential',
        area_m2: 350,
        quality_level: 'basic',
        status: 'completed',
        start_date: daysAgo(180),
        estimated_end_date: daysAgo(30),
        duration_days: 150,
        total_budget: 420000,
        budget_total: 420000,
        calculated_duration: 150,
        sync_status: 'synced'
      }
    ];

    const projectIds = [];
    for (const project of projects) {
      const [inserted] = await supabaseRequest('projects', project);
      projectIds.push(inserted.id);
      console.log(`  ✅ ${project.name} (${project.status})`);
    }

    // ==================== BUDGETS ====================
    console.log('\n💰 Creating budgets...');
    const budgets = [
      { project_id: projectIds[0], version: 1, direct_cost: 850000, indirect_percentage: 12, contingency_percentage: 5, profit_percentage: 15, total_amount: 850000, duration_days: 150 },
      { project_id: projectIds[1], version: 1, direct_cost: 2500000, indirect_percentage: 10, contingency_percentage: 5, profit_percentage: 12, total_amount: 2500000, duration_days: 180 },
      { project_id: projectIds[2], version: 1, direct_cost: 420000, indirect_percentage: 12, contingency_percentage: 5, profit_percentage: 15, total_amount: 420000, duration_days: 150 }
    ];

    const budgetIds = [];
    for (const budget of budgets) {
      const [inserted] = await supabaseRequest('budgets', budget);
      budgetIds.push(inserted.id);
      console.log(`  ✅ Budget v${budget.version} for project ${budget.project_id}`);
    }

    // ==================== BUDGET ITEMS ====================
    console.log('\n📋 Creating budget items...');
    const budgetItems = [
      { budget_id: budgetIds[0], code: '1.0', description: 'Trabajos Preliminares', unit: 'global', quantity: 1, unit_cost: 85000, total_cost: 85000, item_order: 1 },
      { budget_id: budgetIds[0], code: '2.0', description: 'Obras de Concreto', unit: 'global', quantity: 1, unit_cost: 340000, total_cost: 340000, item_order: 2 },
      { budget_id: budgetIds[0], code: '3.0', description: 'Acabados', unit: 'global', quantity: 1, unit_cost: 170000, total_cost: 170000, item_order: 3 },
      { budget_id: budgetIds[1], code: '1.0', description: 'Obras Generales', unit: 'global', quantity: 1, unit_cost: 892857, total_cost: 892857, item_order: 1 },
      { budget_id: budgetIds[1], code: '2.0', description: 'Instalaciones Eléctricas', unit: 'global', quantity: 1, unit_cost: 446429, total_cost: 446429, item_order: 2 },
      { budget_id: budgetIds[2], code: '1.0', description: 'Construcción Principal', unit: 'global', quantity: 1, unit_cost: 252000, total_cost: 252000, item_order: 1 },
      { budget_id: budgetIds[2], code: '2.0', description: 'Acabados y Pintura', unit: 'global', quantity: 1, unit_cost: 84000, total_cost: 84000, item_order: 2 }
    ];

    for (const item of budgetItems) {
      await supabaseRequest('budget_items', item);
      console.log(`  ✅ ${item.description}`);
    }

    // ==================== FINANCIAL TRANSACTIONS ====================
    console.log('\n💵 Creating financial transactions...');
    const transactions = [
      { project_id: projectIds[0], type: 'income', category: 'Anticipo', description: 'Anticipo inicial - Las Torres', quantity: 1, unit: 'global', unit_cost: 255000, total_cost: 255000, date: daysAgo(5) },
      { project_id: projectIds[0], type: 'expense', category: 'Materiales', description: 'Compra de cemento y acero', quantity: 50, unit: 'bolsa', unit_cost: 120, total_cost: 6000, date: daysAgo(3) },
      { project_id: projectIds[1], type: 'income', category: 'Anticipo', description: 'Anticipo inicial - Plaza del Sol', quantity: 1, unit: 'global', unit_cost: 750000, total_cost: 750000, date: daysAgo(60) },
      { project_id: projectIds[1], type: 'expense', category: 'Mano de Obra', description: 'Pago de planilla semanal', quantity: 1, unit: 'semana', unit_cost: 45000, total_cost: 45000, date: daysAgo(7) },
      { project_id: projectIds[1], type: 'expense', category: 'Materiales', description: 'Compra de tubería', quantity: 100, unit: 'pieza', unit_cost: 250, total_cost: 25000, date: daysAgo(10) },
      { project_id: projectIds[2], type: 'income', category: 'Pago Final', description: 'Pago final - Casa Los Alamos', quantity: 1, unit: 'global', unit_cost: 126000, total_cost: 126000, date: daysAgo(30) },
      { project_id: projectIds[2], type: 'expense', category: 'Materiales', description: 'Pintura y acabados', quantity: 1, unit: 'lote', unit_cost: 15000, total_cost: 15000, date: daysAgo(35) }
    ];

    for (const tx of transactions) {
      await supabaseRequest('financial_transactions', tx);
      console.log(`  ✅ ${tx.description}`);
    }

    // ==================== PAYROLL EMPLOYEES ====================
    console.log('\n👷 Creating payroll employees...');
    const employees = [
      { name: 'Juan Carlos Pérez', position: 'Maestro de Obra', daily_rate: 500, category: 'obrero', department: 'Construcción', hire_date: daysAgo(90), active: true },
      { name: 'Roberto Hernández', position: 'Ayudante General', daily_rate: 350, category: 'ayudante', department: 'Construcción', hire_date: daysAgo(60), active: true },
      { name: 'Carlos Mendez', position: 'Electricista', daily_rate: 600, category: 'especialista', department: 'Instalaciones', hire_date: daysAgo(45), active: true },
      { name: 'Luis García', position: 'Fontanero', daily_rate: 550, category: 'especialista', department: 'Instalaciones', hire_date: daysAgo(45), active: true }
    ];

    const employeeIds = [];
    for (const emp of employees) {
      const [inserted] = await supabaseRequest('payroll_employees', emp);
      employeeIds.push(inserted.id);
      console.log(`  ✅ ${emp.name}`);
    }

    // ==================== PAYROLL RECORDS ====================
    console.log('\n💼 Creating payroll records...');
    const payrollRecords = [
      { employee_id: employeeIds[0], project_id: projectIds[1], period_start: daysAgo(14), period_end: daysAgo(7), days_worked: 12, overtime_hours: 8, overtime_rate: 75, bonuses: 500, deductions: 0, base_salary: 6000, overtime_pay: 600, gross_salary: 7100, igss_deduction: 568, aguinaldo_provision: 355, vacaciones_provision: 177.5, net_salary: 6532 },
      { employee_id: employeeIds[1], project_id: projectIds[1], period_start: daysAgo(14), period_end: daysAgo(7), days_worked: 14, overtime_hours: 4, overtime_rate: 52.5, bonuses: 200, deductions: 0, base_salary: 4900, overtime_pay: 210, gross_salary: 5310, igss_deduction: 424.8, aguinaldo_provision: 265.5, vacaciones_provision: 132.75, net_salary: 4885.2 },
      { employee_id: employeeIds[2], project_id: projectIds[0], period_start: daysAgo(7), period_end: daysAgo(0), days_worked: 10, overtime_hours: 0, overtime_rate: 0, bonuses: 0, deductions: 0, base_salary: 6000, overtime_pay: 0, gross_salary: 6000, igss_deduction: 480, aguinaldo_provision: 300, vacaciones_provision: 150, net_salary: 5520 }
    ];

    for (const record of payrollRecords) {
      await supabaseRequest('payroll_records', record);
      console.log(`  ✅ Payroll record`);
    }

    // ==================== WAREHOUSE STOCK ====================
    console.log('\n📦 Creating warehouse stock...');
    const stockItems = [
      { project_id: projectIds[1], item_code: 'MAT-001', description: 'Cemento Portland', unit: 'bolsa', current_stock: 500, minimum_threshold: 100, unit_cost: 120 },
      { project_id: projectIds[1], item_code: 'MAT-002', description: 'Varilla de Acero 3/8"', unit: 'pieza', current_stock: 200, minimum_threshold: 50, unit_cost: 85 },
      { project_id: projectIds[1], item_code: 'MAT-003', description: 'Bloque de Concreto', unit: 'pieza', current_stock: 1000, minimum_threshold: 200, unit_cost: 12 },
      { project_id: projectIds[0], item_code: 'MAT-004', description: 'Pintura Blanca', unit: 'galón', current_stock: 50, minimum_threshold: 20, unit_cost: 350 },
      { project_id: projectIds[2], item_code: 'MAT-005', description: 'Cerámica para Piso', unit: 'caja', current_stock: 30, minimum_threshold: 10, unit_cost: 450 }
    ];

    for (const item of stockItems) {
      await supabaseRequest('warehouse_stock', item);
      console.log(`  ✅ ${item.description}`);
    }

    // ==================== SUPPLIERS ====================
    console.log('\n🚚 Creating suppliers...');
    const suppliers = [
      { code: 'SUP-001', name: 'Distribuidora de Materiales La Construcción', contact_person: 'Pedro Gómez', phone: '502-2345-6789', email: 'pedro@materialeslaconstruccion.com', address: 'Zona 7, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: '30 días' },
      { code: 'SUP-002', name: 'Ferretería El Maestro', contact_person: 'Ana López', phone: '502-2456-7890', email: 'ana@ferreteriaelmaestro.com', address: 'Zona 3, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: 'Contado' },
      { code: 'SUP-003', name: 'Electricidad y Tuberías S.A.', contact_person: 'Miguel Torres', phone: '502-2567-8901', email: 'miguel@electricidadytuberias.com', address: 'Zona 5, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: '15 días' }
    ];

    const supplierIds = [];
    for (const supplier of suppliers) {
      const [inserted] = await supabaseRequest('suppliers', supplier);
      supplierIds.push(inserted.id);
      console.log(`  ✅ ${supplier.name}`);
    }

    // ==================== PURCHASE ORDERS ====================
    console.log('\n🛒 Creating purchase orders...');
    const purchaseOrders = [
      { code: 'PO-001', supplier_id: supplierIds[0], project_id: projectIds[1], order_date: daysAgo(10), expected_delivery_date: daysFromNow(5), status: 'pending', total_amount: 60000 },
      { code: 'PO-002', supplier_id: supplierIds[1], project_id: projectIds[1], order_date: daysAgo(5), expected_delivery_date: daysFromNow(3), status: 'in_transit', total_amount: 15000 },
      { code: 'PO-003', supplier_id: supplierIds[2], project_id: projectIds[0], order_date: daysAgo(3), expected_delivery_date: daysFromNow(2), status: 'delivered', total_amount: 8500 }
    ];

    const poIds = [];
    for (const po of purchaseOrders) {
      const [inserted] = await supabaseRequest('purchase_orders', po);
      poIds.push(inserted.id);
      console.log(`  ✅ ${po.code}`);
    }

    // ==================== PURCHASE ORDER ITEMS ====================
    console.log('\n📦 Creating purchase order items...');
    const poItems = [
      { purchase_order_id: poIds[0], item_code: 'MAT-001', description: 'Cemento Portland', quantity: 500, unit: 'bolsa', unit_price: 120, total_price: 60000 },
      { purchase_order_id: poIds[1], item_code: 'HERR-001', description: 'Juego de Herramientas', quantity: 10, unit: 'juego', unit_price: 1500, total_price: 15000 },
      { purchase_order_id: poIds[2], item_code: 'ELEC-001', description: 'Cable Eléctrico #12', quantity: 100, unit: 'metro', unit_price: 85, total_price: 8500 }
    ];

    for (const item of poItems) {
      await supabaseRequest('purchase_order_items', item);
      console.log(`  ✅ ${item.description}`);
    }

    // ==================== PROJECT LOGS ====================
    console.log('\n📝 Creating project logs...');
    const projectLogs = [
      { project_id: projectIds[0], activity_type: 'progress', description: 'Aprobación de planos', physical_progress: 10, financial_progress: 5, log_date: daysAgo(10), created_by: 'Admin' },
      { project_id: projectIds[0], activity_type: 'milestone', description: 'Permisos municipales', physical_progress: 5, financial_progress: 2, log_date: daysAgo(5), created_by: 'Admin' },
      { project_id: projectIds[1], activity_type: 'progress', description: 'Colocación de cimientos', physical_progress: 35, financial_progress: 30, log_date: daysAgo(30), created_by: 'Admin' },
      { project_id: projectIds[1], activity_type: 'progress', description: 'Estructura metálica', physical_progress: 55, financial_progress: 50, log_date: daysAgo(14), created_by: 'Admin' },
      { project_id: projectIds[1], activity_type: 'milestone', description: 'Inspección de calidad', physical_progress: 60, financial_progress: 55, log_date: daysAgo(7), created_by: 'Admin' },
      { project_id: projectIds[2], activity_type: 'milestone', description: 'Finalización de obra', physical_progress: 100, financial_progress: 100, log_date: daysAgo(30), created_by: 'Admin' },
      { project_id: projectIds[2], activity_type: 'milestone', description: 'Inspección final', physical_progress: 100, financial_progress: 100, log_date: daysAgo(28), created_by: 'Admin' }
    ];

    for (const log of projectLogs) {
      await supabaseRequest('project_logs', log);
      console.log(`  ✅ ${log.activity_type}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test data seeded successfully!');
    console.log('\n📊 Summary:');
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
    console.log('\n🎯 Open the dashboard to verify the data!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

main();