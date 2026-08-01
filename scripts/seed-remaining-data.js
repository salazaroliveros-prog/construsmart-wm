#!/usr/bin/env node
/**
 * Seed remaining test data using existing projects
 */

require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

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

async function main() {
  console.log('\n🌱 Seeding remaining data...\n');

  try {
    // Get existing projects
    console.log('📋 Getting existing projects...');
    const projectsRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,code,name,status`, {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    });
    const projects = await projectsRes.json();
    console.log(`  ✅ Found ${projects.length} projects`);

    const projectIds = projects.map(p => p.id);
    const project001 = projects.find(p => p.code === 'PROJ-001')?.id;
    const project002 = projects.find(p => p.code === 'PROJ-002')?.id;
    const project003 = projects.find(p => p.code === 'PROJ-003')?.id;

    // BUDGETS
    console.log('\n💰 Creating budgets...');
    const budgets = [
      { project_id: project001, version: 1, direct_cost: 850000, indirect_percentage: 12, contingency_percentage: 5, profit_percentage: 15, total_amount: 850000, duration_days: 150 },
      { project_id: project002, version: 1, direct_cost: 2500000, indirect_percentage: 10, contingency_percentage: 5, profit_percentage: 12, total_amount: 2500000, duration_days: 180 },
      { project_id: project003, version: 1, direct_cost: 420000, indirect_percentage: 12, contingency_percentage: 5, profit_percentage: 15, total_amount: 420000, duration_days: 150 }
    ];

    const budgetIds = [];
    for (const budget of budgets) {
      try {
        const [inserted] = await supabaseRequest('budgets', budget);
        budgetIds.push(inserted.id);
        console.log(`  ✅ Budget for ${budget.project_id}`);
      } catch (error) {
        console.log(`  ⚠️  Budget already exists for ${budget.project_id}`);
        // Get existing budget
        const existing = await fetch(`${SUPABASE_URL}/rest/v1/budgets?select=id&project_id=eq.${budget.project_id}`, {
          headers: { 'apikey': SUPABASE_SECRET_KEY, 'Authorization': `Bearer ${SUPABASE_SECRET_KEY}` }
        });
        const existingData = await existing.json();
        if (existingData.length > 0) budgetIds.push(existingData[0].id);
      }
    }

    // BUDGET ITEMS
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
      try {
        await supabaseRequest('budget_items', item);
        console.log(`  ✅ ${item.description}`);
      } catch (error) {
        console.log(`  ⚠️  ${item.description} already exists`);
      }
    }

    // FINANCIAL TRANSACTIONS
    console.log('\n💵 Creating financial transactions...');
    const transactions = [
      { project_id: project001, type: 'income', category: 'Anticipo', description: 'Anticipo inicial - Las Torres', quantity: 1, unit: 'global', unit_cost: 255000, total_cost: 255000, date: daysAgo(5) },
      { project_id: project001, type: 'expense', category: 'Materiales', description: 'Compra de cemento y acero', quantity: 50, unit: 'bolsa', unit_cost: 120, total_cost: 6000, date: daysAgo(3) },
      { project_id: project002, type: 'income', category: 'Anticipo', description: 'Anticipo inicial - Plaza del Sol', quantity: 1, unit: 'global', unit_cost: 750000, total_cost: 750000, date: daysAgo(60) },
      { project_id: project002, type: 'expense', category: 'Mano de Obra', description: 'Pago de planilla semanal', quantity: 1, unit: 'semana', unit_cost: 45000, total_cost: 45000, date: daysAgo(7) },
      { project_id: project002, type: 'expense', category: 'Materiales', description: 'Compra de tubería', quantity: 100, unit: 'pieza', unit_cost: 250, total_cost: 25000, date: daysAgo(10) },
      { project_id: project003, type: 'income', category: 'Pago Final', description: 'Pago final - Casa Los Alamos', quantity: 1, unit: 'global', unit_cost: 126000, total_cost: 126000, date: daysAgo(30) },
      { project_id: project003, type: 'expense', category: 'Materiales', description: 'Pintura y acabados', quantity: 1, unit: 'lote', unit_cost: 15000, total_cost: 15000, date: daysAgo(35) }
    ];

    for (const tx of transactions) {
      try {
        await supabaseRequest('financial_transactions', tx);
        console.log(`  ✅ ${tx.description}`);
      } catch (error) {
        console.log(`  ⚠️  Transaction already exists`);
      }
    }

    // PAYROLL EMPLOYEES
    console.log('\n👷 Creating payroll employees...');
    const employees = [
      { name: 'Juan Carlos Pérez', position: 'Maestro de Obra', daily_rate: 500, category: 'obrero', department: 'Construcción', hire_date: daysAgo(90), active: true },
      { name: 'Roberto Hernández', position: 'Ayudante General', daily_rate: 350, category: 'ayudante', department: 'Construcción', hire_date: daysAgo(60), active: true },
      { name: 'Carlos Mendez', position: 'Electricista', daily_rate: 600, category: 'especialista', department: 'Instalaciones', hire_date: daysAgo(45), active: true },
      { name: 'Luis García', position: 'Fontanero', daily_rate: 550, category: 'especialista', department: 'Instalaciones', hire_date: daysAgo(45), active: true }
    ];

    const employeeIds = [];
    for (const emp of employees) {
      try {
        const [inserted] = await supabaseRequest('payroll_employees', emp);
        employeeIds.push(inserted.id);
        console.log(`  ✅ ${emp.name}`);
      } catch (error) {
        console.log(`  ⚠️  Employee already exists: ${emp.name}`);
        // Get existing employee
        const existing = await fetch(`${SUPABASE_URL}/rest/v1/payroll_employees?select=id&name=eq.${encodeURIComponent(emp.name)}`, {
          headers: { 'apikey': SUPABASE_SECRET_KEY, 'Authorization': `Bearer ${SUPABASE_SECRET_KEY}` }
        });
        const existingData = await existing.json();
        if (existingData.length > 0) employeeIds.push(existingData[0].id);
      }
    }

    // WAREHOUSE STOCK
    console.log('\n📦 Creating warehouse stock...');
    const stockItems = [
      { project_id: project002, item_code: 'MAT-001', description: 'Cemento Portland', unit: 'bolsa', current_stock: 500, minimum_threshold: 100, unit_cost: 120 },
      { project_id: project002, item_code: 'MAT-002', description: 'Varilla de Acero 3/8"', unit: 'pieza', current_stock: 200, minimum_threshold: 50, unit_cost: 85 },
      { project_id: project002, item_code: 'MAT-003', description: 'Bloque de Concreto', unit: 'pieza', current_stock: 1000, minimum_threshold: 200, unit_cost: 12 },
      { project_id: project001, item_code: 'MAT-004', description: 'Pintura Blanca', unit: 'galón', current_stock: 50, minimum_threshold: 20, unit_cost: 350 },
      { project_id: project003, item_code: 'MAT-005', description: 'Cerámica para Piso', unit: 'caja', current_stock: 30, minimum_threshold: 10, unit_cost: 450 }
    ];

    for (const item of stockItems) {
      try {
        await supabaseRequest('warehouse_stock', item);
        console.log(`  ✅ ${item.description}`);
      } catch (error) {
        console.log(`  ⚠️  Stock already exists: ${item.description}`);
      }
    }

    // SUPPLIERS
    console.log('\n🚚 Creating suppliers...');
    const suppliers = [
      { code: 'SUP-001', name: 'Distribuidora de Materiales La Construcción', contact_person: 'Pedro Gómez', phone: '502-2345-6789', email: 'pedro@materialeslaconstruccion.com', address: 'Zona 7, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: '30 días' },
      { code: 'SUP-002', name: 'Ferretería El Maestro', contact_person: 'Ana López', phone: '502-2456-7890', email: 'ana@ferreteriaelmaestro.com', address: 'Zona 3, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: 'Contado' },
      { code: 'SUP-003', name: 'Electricidad y Tuberías S.A.', contact_person: 'Miguel Torres', phone: '502-2567-8901', email: 'miguel@electricidadytuberias.com', address: 'Zona 5, Ciudad de Guatemala', city: 'Guatemala City', payment_terms: '15 días' }
    ];

    const supplierIds = [];
    for (const supplier of suppliers) {
      try {
        const [inserted] = await supabaseRequest('suppliers', supplier);
        supplierIds.push(inserted.id);
        console.log(`  ✅ ${supplier.name}`);
      } catch (error) {
        console.log(`  ⚠️  Supplier already exists: ${supplier.name}`);
        const existing = await fetch(`${SUPABASE_URL}/rest/v1/suppliers?select=id&code=eq.${supplier.code}`, {
          headers: { 'apikey': SUPABASE_SECRET_KEY, 'Authorization': `Bearer ${SUPABASE_SECRET_KEY}` }
        });
        const existingData = await existing.json();
        if (existingData.length > 0) supplierIds.push(existingData[0].id);
      }
    }

    // PROJECT LOGS
    console.log('\n📝 Creating project logs...');
    const projectLogs = [
      { project_id: project001, activity_type: 'progress', description: 'Aprobación de planos', physical_progress: 10, financial_progress: 5, log_date: daysAgo(10), created_by: 'Admin' },
      { project_id: project001, activity_type: 'milestone', description: 'Permisos municipales', physical_progress: 5, financial_progress: 2, log_date: daysAgo(5), created_by: 'Admin' },
      { project_id: project002, activity_type: 'progress', description: 'Colocación de cimientos', physical_progress: 35, financial_progress: 30, log_date: daysAgo(30), created_by: 'Admin' },
      { project_id: project002, activity_type: 'progress', description: 'Estructura metálica', physical_progress: 55, financial_progress: 50, log_date: daysAgo(14), created_by: 'Admin' },
      { project_id: project002, activity_type: 'milestone', description: 'Inspección de calidad', physical_progress: 60, financial_progress: 55, log_date: daysAgo(7), created_by: 'Admin' },
      { project_id: project003, activity_type: 'milestone', description: 'Finalización de obra', physical_progress: 100, financial_progress: 100, log_date: daysAgo(30), created_by: 'Admin' },
      { project_id: project003, activity_type: 'milestone', description: 'Inspección final', physical_progress: 100, financial_progress: 100, log_date: daysAgo(28), created_by: 'Admin' }
    ];

    for (const log of projectLogs) {
      try {
        await supabaseRequest('project_logs', log);
        console.log(`  ✅ ${log.activity_type}`);
      } catch (error) {
        console.log(`  ⚠️  Log already exists`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`  - ${projects.length} projects`);
    console.log(`  - ${budgets.length} budgets`);
    console.log(`  - ${budgetItems.length} budget items`);
    console.log(`  - ${transactions.length} financial transactions`);
    console.log(`  - ${employees.length} payroll employees`);
    console.log(`  - ${stockItems.length} warehouse stock items`);
    console.log(`  - ${suppliers.length} suppliers`);
    console.log(`  - ${projectLogs.length} project logs`);
    console.log('\n🎯 Open the dashboard to verify!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();