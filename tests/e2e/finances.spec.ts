import { test, expect } from '@playwright/test';

/**
 * E2E Tests para Gestión Financiera
 * CONSTRUCTORA WM/M&S - Sistema ERP de Construcción
 */

test.describe('Gestión Financiera - CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Finanzas")');
  });

  test('CREAR: Nueva transacción de gasto', async ({ page }) => {
    await page.click('button:has-text("Nueva Transacción")');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Llenar formulario de gasto
    await page.selectOption('select[name="type"]', 'expense');
    await page.selectOption('select[name="category"]', 'materiales');
    await page.fill('input[name="description"]', 'Compra de cemento');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="unit"]', 'bolsa');
    await page.fill('input[name="unit_cost"]', '45');
    await page.fill('input[name="date"]', '2026-08-03');

    // Verificar cálculo automático de total_cost
    const totalCost = page.locator('input[name="total_cost"]');
    await expect(totalCost).toHaveValue('4500');

    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Transacción creada exitosamente')).toBeVisible();
    await expect(page.locator('text=Compra de cemento')).toBeVisible();
  });

  test('CREAR: Nueva transacción de ingreso', async ({ page }) => {
    await page.click('button:has-text("Nueva Transacción")');

    await page.selectOption('select[name="type"]', 'income');
    await page.selectOption('select[name="category"]', 'aporte');
    await page.fill('input[name="description"]', 'Anticipo cliente');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit"]', 'pago');
    await page.fill('input[name="unit_cost"]', '50000');
    await page.fill('input[name="date"]', '2026-08-03');

    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Transacción creada exitosamente')).toBeVisible();
  });

  test('CREAR: Validar cálculo de total_cost', async ({ page }) => {
    await page.click('button:has-text("Nueva Transacción")');

    await page.selectOption('select[name="type"]', 'expense');
    await page.selectOption('select[name="category"]', 'materiales');
    await page.fill('input[name="quantity"]', '50');
    await page.fill('input[name="unit_cost"]', '25');

    // Verificar cálculo: 50 * 25 = 1250
    const totalCost = page.locator('input[name="total_cost"]');
    await expect(totalCost).toHaveValue('1250');

    // Modificar quantity y verificar recálculo
    await page.fill('input[name="quantity"]', '100');
    await expect(totalCost).toHaveValue('2500');
  });

  test('LEER: Verificar carga de transacciones y KPIs', async ({ page }) => {
    // Verificar tarjetas de resumen
    await expect(page.locator('text=Ingresos Totales')).toBeVisible();
    await expect(page.locator('text=Gastos Totales')).toBeVisible();
    await expect(page.locator('text=Balance')).toBeVisible();

    // Verificar tabla de transacciones
    await expect(page.locator('table')).toBeVisible();
  });

  test('ACTUALIZAR: Modificar transacción existente', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Modificar descripción y monto
    await page.fill('input[name="description"]', 'Transacción modificada QA');
    await page.fill('input[name="unit_cost"]', '50');

    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Transacción actualizada exitosamente')).toBeVisible();
    await expect(page.locator('text=Transacción modificada QA')).toBeVisible();
  });

  test('ELIMINAR: Borrar transacción', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    const description = await firstRow.locator('td:nth-child(2)').textContent();

    await firstRow.locator('button[aria-label*="Eliminar"]').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Confirmar")');

    await expect(page.locator('text=Transacción eliminada exitosamente')).toBeVisible();
    await expect(page.locator(`text=${description}`)).not.toBeVisible();
  });

  test('FILTRAR: Filtrar por tipo (ingresos/gastos)', async ({ page }) => {
    await page.selectOption('select[name="filterType"]', 'expense');

    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row.locator('td').nth(1)).toContainText('Gasto');
    }
  });

  test('FILTRAR: Filtrar por categoría', async ({ page }) => {
    await page.selectOption('select[name="filterCategory"]', 'materiales');

    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row.locator('td').nth(2)).toContainText('Materiales');
    }
  });

  test('INTEGRACIÓN: Verificar comparación con presupuesto', async ({ page }) => {
    // Si hay un proyecto con presupuesto activo, verificar que se muestre el panel de comparación
    const comparisonPanel = page.locator('text=Comparación Presupuesto vs. Gastos Reales');
    
    if (await comparisonPanel.isVisible()) {
      await expect(comparisonPanel).toBeVisible();
      await expect(page.locator('text=Presupuesto Estimado')).toBeVisible();
      await expect(page.locator('text=Gastos Reales')).toBeVisible();
      await expect(page.locator('text=Variación')).toBeVisible();
    }
  });
});

test.describe('Gestión Financiera - Validaciones', () => {
  test('VALIDAR: Campos obligatorios vacíos', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Finanzas")');
    await page.click('button:has-text("Nueva Transacción")');

    // Intentar guardar sin llenar campos
    await page.click('button:has-text("Guardar")');

    // Debería mostrar error de validación
    await expect(page.locator('text=Descripción requerida')).toBeVisible({ timeout: 5000 });
  });

  test('VALIDAR: Valores negativos no permitidos', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Finanzas")');
    await page.click('button:has-text("Nueva Transacción")');

    await page.fill('input[name="quantity"]', '-10');
    await page.fill('input[name="unit_cost"]', '-50');

    await page.click('button:has-text("Guardar")');

    // Debería mostrar error de validación
    await expect(page.locator('text=La cantidad no puede ser negativa')).toBeVisible({ timeout: 5000 });
  });
});
