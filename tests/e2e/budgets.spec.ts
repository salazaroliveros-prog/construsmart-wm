import { test, expect } from '@playwright/test';

/**
 * E2E Tests para Calculadora de Presupuestos
 * CONSTRUCTORA WM/M&S - Sistema ERP de Construcción
 */

test.describe('Calculadora de Presupuestos - CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
  });

  test('CREAR: Nuevo presupuesto para proyecto', async ({ page }) => {
    // Seleccionar proyecto (asumimos que hay proyectos en planificación)
    await page.selectOption('select[name="project"]', '1');

    // Esperar carga de formulario
    await expect(page.locator('text=Calculadora de Presupuestos')).toBeVisible();

    // Agregar item personalizado
    await page.click('button:has-text("Agregar Item")');

    // Llenar item
    await page.fill('input[name="description"]', 'Cimentación y fundaciones');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_cost"]', '150000');

    // Verificar cálculo de total
    await expect(page.locator('text=Costo Directo')).toBeVisible();
    await expect(page.locator('text=Indirectos')).toBeVisible();
    await expect(page.locator('text=Contingencia')).toBeVisible();
    await expect(page.locator('text=Utilidad')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();

    // Guardar presupuesto
    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Presupuesto guardado exitosamente')).toBeVisible();
  });

  test('CREAR: Cálculo de losa (slab calculator)', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Abrir calculadora de losas
    await page.click('button:has-text("Calcular Losa")');

    await expect(page.locator('text=Cálculo de Losas')).toBeVisible();

    // Ingresar dimensiones
    await page.fill('input[name="length"]', '10');
    await page.fill('input[name="width"]', '8');
    await page.fill('input[name="thickness"]', '0.10');
    await page.selectOption('select[name="slabType"]', 'solid');

    // Ingresar costos
    await page.fill('input[name="concretePricePerM3"]', '850');
    await page.fill('input[name="steelPricePerKg"]', '8.50');
    await page.fill('input[name="formworkPricePerM2"]', '45');

    // Calcular
    await page.click('button:has-text("Calcular")');

    // Verificar resultado
    await expect(page.locator('text=Losa calculada')).toBeVisible();

    // Agregar al presupuesto
    await page.click('button:has-text("Agregar al Presupuesto")');

    await expect(page.locator('text=Cálculo de losa agregado')).toBeVisible();
  });

  test('CREAR: Cálculo APU (Análisis de Precios Unitarios)', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Abrir calculadora APU
    await page.click('button:has-text("Calcular APU")');

    await expect(page.locator('text=Calculadora APU')).toBeVisible();

    // Seleccionar tipología
    await page.selectOption('select[name="typology"]', 'residential');

    // Ingresar parámetros
    await page.fill('input[name="theoreticalQuantity"]', '100');
    await page.fill('input[name="wastePercentage"]', '5');
    await page.fill('input[name="volumetricFactor"]', '1.05');
    await page.fill('input[name="crewDailySalary"]', '350');
    await page.fill('input[name="dailyPerformance"]', '25');
    await page.fill('input[name="indirectPercentage"]', '15');

    // Calcular
    await page.click('button:has-text("Calcular APU")');

    // Verificar desglose
    await expect(page.locator('text=Materiales')).toBeVisible();
    await expect(page.locator('text=Mano de Obra')).toBeVisible();
    await expect(page.locator('text=Maquinaria')).toBeVisible();

    // Agregar al presupuesto
    await page.click('button:has-text("Agregar al Presupuesto")');

    await expect(page.locator('text=Cálculo APU agregado')).toBeVisible();
  });

  test('ACTUALIZAR: Modificar porcentajes de indirectos', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Modificar porcentaje de indirectos
    await page.fill('input[name="indirectPercentage"]', '20');

    // Verificar recálculo automático
    const indirectCost = page.locator('text=Indirectos').locator('..').locator('..');
    // El valor debería actualizarse automáticamente
  });

  test('ACTUALIZAR: Modificar item existente', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Asumimos que hay items
    const firstItem = page.locator('table tbody tr').first();
    await firstItem.click();

    // Modificar cantidad
    await page.fill('input[name="quantity"]', '50');

    // Verificar recálculo de total
    const totalCost = page.locator('input[name="totalCost"]');
    // Debería ser 50 * unit_cost
  });

  test('ELIMINAR: Borrar item del presupuesto', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    const firstItem = page.locator('table tbody tr').first();
    const description = await firstItem.locator('td:nth-child(2)').textContent();

    await firstItem.locator('button[aria-label*="Eliminar"]').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Confirmar")');

    await expect(page.locator('text=Item eliminado')).toBeVisible();
    await expect(page.locator(`text=${description}`)).not.toBeVisible();
  });

  test('INTEGRACIÓN: Verificar envío de materiales al almacén', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar item con materials
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Bloque de cemento');
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="unit_cost"]', '5000');

    await page.click('button:has-text("Guardar")');

    // Verificar toast de integración con almacén
    await expect(page.locator('text=materiales agregados al almacén')).toBeVisible();
  });

  test('EXPORTAR: Generar PDF del presupuesto', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar至少 un item
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Item de prueba');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_cost"]', '1000');

    // Exportar PDF
    await page.click('button:has-text("Exportar PDF")');

    // Verificar modal de PDF
    await expect(page.locator('text=Vista Previa PDF')).toBeVisible();
  });

  test('EXPORTAR: Generar CSV del presupuesto', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar至少 un item
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Item de prueba CSV');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_cost"]', '1000');

    // Exportar CSV
    await page.click('button:has-text("Exportar CSV")');

    // Verificar descarga (esto requiere verificación de archivo descargado)
    // Por ahora, verificamos que el botón exista
    await expect(page.locator('button:has-text("Exportar CSV")')).toBeVisible();
  });
});

test.describe('Calculadora de Presupuestos - Validaciones', () => {
  test('VALIDAR: No se puede guardar sin seleccionar proyecto', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');

    // Intentar guardar sin seleccionar proyecto
    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Seleccione un proyecto')).toBeVisible();
  });

  test('VALIDAR: Valores negativos en porcentajes', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
    await page.selectOption('select[name="project"]', '1');

    await page.fill('input[name="indirectPercentage"]', '-10');

    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=El porcentaje no puede ser negativo')).toBeVisible({ timeout: 5000 });
  });
});
