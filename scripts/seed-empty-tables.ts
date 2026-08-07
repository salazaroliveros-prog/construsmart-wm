/**
 * CONSTRUCTORA WM/M&S - SEED TABLAS VACÍAS
 * "CONSTRUYENDO EL FUTURO"
 *
 * Inserta datos solo en las tablas vacías detectadas por verify-remote-db-supabase.ts:
 * - projects, budgets, budget_items, financial_transactions, project_logs,
 * - purchase_orders, purchase_order_items, payroll_records
 *
 * Uso:
 *   npx tsx scripts/seed-empty-tables.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Faltan variables de Supabase en .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('Proyecto:', SUPABASE_URL!.replace(/^https:\/\//, ''));

  const { data: existingEmployees } = await admin.from('payroll_employees').select('id').limit(10);
  const { data: existingClients } = await admin.from('clients').select('id').limit(10);
  const { data: existingSuppliers } = await admin.from('suppliers').select('id').limit(10);
  const { data: existingWarehouse } = await admin.from('warehouse_stock').select('id').limit(10);

  const employeeId = existingEmployees?.[0]?.id;
  const clientId = existingClients?.[0]?.id;
  const supplierId = existingSuppliers?.[0]?.id;
  const warehouseItemId = existingWarehouse?.[0]?.id;

  if (!employeeId || !clientId || !supplierId || !warehouseItemId) {
    console.log('Faltan registros base. Ejecuta primero seed-test-data-simple.js o seed-remaining-data.js');
    process.exit(1);
  }

  console.log('Creando proyectos...');
  const projects = [
    { code: 'PROJ-001', name: 'Edificio Residencial Las Torres', client_name: 'Constructora Nova Guatemala', location: 'Zona 10, Guatemala', typology: 'residential', area_m2: 2500, quality_level: 'premium', status: 'planning', start_date: daysFromNow(30), estimated_end_date: daysFromNow(180), duration_days: 150, total_budget: 850000, budget_total: 850000, calculated_duration: 150, sync_status: 'synced' },
    { code: 'PROJ-002', name: 'Centro Comercial Plaza del Sol', client_name: 'Inversiones del Pacífico', location: 'Zona 12, Guatemala', typology: 'commercial', area_m2: 5000, quality_level: 'moderate', status: 'execution', start_date: daysAgo(60), estimated_end_date: daysFromNow(120), duration_days: 180, total_budget: 2500000, budget_total: 2500000, calculated_duration: 180, sync_status: 'synced' },
    { code: 'PROJ-003', name: 'Casa Familiar Los Alamos', client_name: 'María Elena Rodríguez', location: 'Zona 16, Guatemala', typology: 'residential', area_m2: 350, quality_level: 'basic', status: 'completed', start_date: daysAgo(180), estimated_end_date: daysAgo(30), duration_days: 150, total_budget: 420000, budget_total: 420000, calculated_duration: 150, sync_status: 'synced' }
  ];

  const projectIds: string[] = [];
  for (const p of projects) {
    const { data, error } = await admin.from('projects').insert(p).select('id').single();
    if (error) {
      console.log('  warning', p.code + ' ya existe');
      const existing = await admin.from('projects').select('id').eq('code', p.code).single();
      if (existing.data) projectIds.push(existing.data.id);
    } else {
      projectIds.push(data.id);
      console.log('  ok ' + p.code + ' - ' + p.name);
    }
  }

  if (projectIds.length === 0) {
    console.log('No hay proyectos nuevos. Abortando seed.');
    process.exit(0);
  }

  console.log('Creando presupuestos...');
  const budgetsPayload = [
    { project_id: projectIds[0], version: 1, direct_cost: 850000, indirect_percentage: 12, contingency_percentage: 5, profit_percentage: 15, total_amount: 850000, duration_days: 150, sync_status: 'synced' },
    { project_id: projectIds[1], version: 1, direct_cost: 2500000, indirect_percentage: 10, contingency_percentage: 5, profit_percentage: 12, total_amount: 2500000, duration_days: 180, sync_status: 'synced' },
    { project_id: projectIds[2], version: 1, direct_cost: 420000, indirect_percentage: 12, contingency_percentage: 5, profit_percentage: 15, total_amount: 420000, duration_days: 150, sync_status: 'synced' }
  ];

  const budgetIds: string[] = [];
  for (const b of budgetsPayload) {
    const { data, error } = await admin.from('budgets').insert(b).select('id').single();
    if (error) {
      console.log('  warning Presupuesto ya existe para proyecto ' + b.project_id);
      const existing = await admin.from('budgets').select('id').eq('project_id', b.project_id).single();
      if (existing.data) budgetIds.push(existing.data.id);
    } else {
      budgetIds.push(data.id);
      console.log('  ok Presupuesto ' + data.id);
    }
  }

  if (budgetIds.length === 0) {
    console.log('No hay presupuestos nuevos. Abortando seed.');
    process.exit(0);
  }

  console.log('Creando renglones...');
  const budgetItemsPayload = [
    { budget_id: budgetIds[0], project_id: projectIds[0], code: '1.0', description: 'Trabajos Preliminares', unit: 'global', quantity: 1, unit_cost: 85000, total_cost: 85000, item_order: 1, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[0], project_id: projectIds[0], code: '2.0', description: 'Obras de Concreto', unit: 'global', quantity: 1, unit_cost: 340000, total_cost: 340000, item_order: 2, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[0], project_id: projectIds[0], code: '3.0', description: 'Acabados', unit: 'global', quantity: 1, unit_cost: 170000, total_cost: 170000, item_order: 3, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[0], project_id: projectIds[0], code: '4.0', description: 'Instalaciones Eléctricas', unit: 'global', quantity: 1, unit_cost: 130000, total_cost: 130000, item_order: 4, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[0], project_id: projectIds[0], code: '5.0', description: 'Instalaciones Hidráulicas', unit: 'global', quantity: 1, unit_cost: 125000, total_cost: 125000, item_order: 5, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[1], project_id: projectIds[1], code: '1.0', description: 'Cimentación', unit: 'global', quantity: 1, unit_cost: 700000, total_cost: 700000, item_order: 1, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[1], project_id: projectIds[1], code: '2.0', description: 'Estructura Metálica', unit: 'global', quantity: 1, unit_cost: 1100000, total_cost: 1100000, item_order: 2, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[1], project_id: projectIds[1], code: '3.0', description: 'Mampostería y Acabados', unit: 'global', quantity: 1, unit_cost: 450000, total_cost: 450000, item_order: 3, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[1], project_id: projectIds[1], code: '4.0', description: 'Instalaciones', unit: 'global', quantity: 1, unit_cost: 250000, total_cost: 250000, item_order: 4, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[2], project_id: projectIds[2], code: '1.0', description: 'Excavación', unit: 'global', quantity: 1, unit_cost: 42000, total_cost: 42000, item_order: 1, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[2], project_id: projectIds[2], code: '2.0', description: 'Concreto', unit: 'global', quantity: 1, unit_cost: 126000, total_cost: 126000, item_order: 2, is_custom: false, sync_status: 'synced' },
    { budget_id: budgetIds[2], project_id: projectIds[2], code: '3.0', description: 'Acabados Básicos', unit: 'global', quantity: 1, unit_cost: 168000, total_cost: 168000, item_order: 3, is_custom: false, sync_status: 'synced' }
  ];

  for (const item of budgetItemsPayload) {
    const { error } = await admin.from('budget_items').insert(item);
    if (error) console.log('  warning Item duplicado ' + item.code);
    else console.log('  ok ' + item.code + ' - ' + item.description);
  }

  console.log('Creando transacciones...');
  const transactionsPayload = [
    { project_id: projectIds[0], type: 'income', category: 'Anticipo', amount: 255000, date: daysAgo(5), description: 'Anticipo 30% Edificio Las Torres', sync_status: 'synced' },
    { project_id: projectIds[0], type: 'expense', category: 'Materiales', amount: 120000, date: daysAgo(3), description: 'Compra de cemento y acero', sync_status: 'synced' },
    { project_id: projectIds[1], type: 'income', category: 'Anticipo', amount: 750000, date: daysAgo(20), description: 'Anticipo 30% Plaza del Sol', sync_status: 'synced' },
    { project_id: projectIds[1], type: 'expense', category: 'Mano de obra', amount: 420000, date: daysAgo(10), description: 'Nómina cimentación', sync_status: 'synced' },
    { project_id: projectIds[2], type: 'income', category: 'Venta', amount: 420000, date: daysAgo(45), description: 'Pago final Casa Los Alamos', sync_status: 'synced' },
    { project_id: projectIds[2], type: 'expense', category: 'Materiales', amount: 98000, date: daysAgo(50), description: 'Compra de acabados', sync_status: 'synced' }
  ];

  for (const t of transactionsPayload) {
    const { error } = await admin.from('financial_transactions').insert(t);
    if (error) console.log('  warning Transacción duplicada');
    else console.log('  ok ' + (t.type === 'income' ? 'Ingreso' : 'Gasto') + ': ' + t.description);
  }

  console.log('Creando registros de nómina...');
  const payrollRecordsPayload = [
    { employee_id: employeeId, project_id: projectIds[0], period_start: daysAgo(14), period_end: daysAgo(7), base_salary: 3500, overtime: 250, deductions: 200, net_pay: 3550, payment_date: daysAgo(6), sync_status: 'synced' },
    { employee_id: employeeId, project_id: projectIds[1], period_start: daysAgo(14), period_end: daysAgo(7), base_salary: 4200, overtime: 0, deductions: 300, net_pay: 3900, payment_date: daysAgo(6), sync_status: 'synced' },
    { employee_id: employeeId, project_id: projectIds[2], period_start: daysAgo(30), period_end: daysAgo(23), base_salary: 2800, overtime: 180, deductions: 150, net_pay: 2830, payment_date: daysAgo(22), sync_status: 'synced' }
  ];

  for (const r of payrollRecordsPayload) {
    const { error } = await admin.from('payroll_records').insert(r);
    if (error) console.log('  warning Registro de nómina duplicado');
    else console.log('  ok Nómina Q' + r.net_pay.toFixed(2));
  }

  console.log('Creando órdenes de compra...');
  const purchaseOrdersPayload = [
    { code: 'PO-001', supplier_id: supplierId, project_id: projectIds[0], status: 'pending', order_date: daysAgo(2), total_amount: 125000, notes: 'Materiales proyecto 1', sync_status: 'synced' },
    { code: 'PO-002', supplier_id: supplierId, project_id: projectIds[1], status: 'approved', order_date: daysAgo(7), total_amount: 340000, notes: 'Estructura metálica', sync_status: 'synced' },
    { code: 'PO-003', supplier_id: supplierId, project_id: projectIds[2], status: 'received', order_date: daysAgo(15), total_amount: 85000, notes: 'Acabados básicos', sync_status: 'synced' }
  ];

  const poIds: string[] = [];
  for (const po of purchaseOrdersPayload) {
    const { data, error } = await admin.from('purchase_orders').insert(po).select('id').single();
    if (error) {
      console.log('  warning ' + po.code + ' ya existe');
      const existing = await admin.from('purchase_orders').select('id').eq('code', po.code).single();
      if (existing.data) poIds.push(existing.data.id);
    } else {
      poIds.push(data.id);
      console.log('  ok ' + po.code + ' - Q' + po.total_amount.toFixed(2));
    }
  }

  if (poIds.length > 0) {
    console.log('Creando items de órdenes...');
    const poItemsPayload = [
      { purchase_order_id: poIds[0], item_code: 'MAT-001', description: 'Cemento Portland', quantity: 500, unit: 'bolsa', unit_price: 120, total_price: 60000, sync_status: 'synced' },
      { purchase_order_id: poIds[0], item_code: 'ACERO-001', description: 'Varilla #5', quantity: 200, unit: 'pieza', unit_price: 85, total_price: 17000, sync_status: 'synced' },
      { purchase_order_id: poIds[1], item_code: 'TUB-001', description: 'Tubo galvanizado', quantity: 100, unit: 'pieza', unit_price: 210, total_price: 21000, sync_status: 'synced' }
    ];

    for (const item of poItemsPayload) {
      const { error } = await admin.from('purchase_order_items').insert(item);
      if (error) console.log('  warning Item de PO duplicado');
      else console.log('  ok ' + item.description);
    }
  }

  console.log('Creando bitácoras...');
  const projectLogsPayload = [
    { project_id: projectIds[0], activity_type: 'progress', description: 'Aprobación de planos', physical_progress: 10, financial_progress: 5, log_date: daysAgo(10), created_by: 'Admin', sync_status: 'synced' },
    { project_id: projectIds[0], activity_type: 'milestone', description: 'Permisos municipales', physical_progress: 5, financial_progress: 2, log_date: daysAgo(5), created_by: 'Admin', sync_status: 'synced' },
    { project_id: projectIds[1], activity_type: 'progress', description: 'Colocación de cimientos', physical_progress: 35, financial_progress: 30, log_date: daysAgo(30), created_by: 'Admin', sync_status: 'synced' },
    { project_id: projectIds[1], activity_type: 'progress', description: 'Estructura metálica', physical_progress: 55, financial_progress: 50, log_date: daysAgo(14), created_by: 'Admin', sync_status: 'synced' },
    { project_id: projectIds[1], activity_type: 'milestone', description: 'Inspección de calidad', physical_progress: 60, financial_progress: 55, log_date: daysAgo(7), created_by: 'Admin', sync_status: 'synced' },
    { project_id: projectIds[2], activity_type: 'milestone', description: 'Finalización de obra', physical_progress: 100, financial_progress: 100, log_date: daysAgo(30), created_by: 'Admin', sync_status: 'synced' },
    { project_id: projectIds[2], activity_type: 'milestone', description: 'Inspección final', physical_progress: 100, financial_progress: 100, log_date: daysAgo(28), created_by: 'Admin', sync_status: 'synced' }
  ];

  for (const log of projectLogsPayload) {
    const { error } = await admin.from('project_logs').insert(log);
    if (error) console.log('  warning Bitácora duplicada');
    else console.log('  ok ' + log.activity_type + ' - ' + log.description);
  }

  console.log('Seed de tablas vacías completado.');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
