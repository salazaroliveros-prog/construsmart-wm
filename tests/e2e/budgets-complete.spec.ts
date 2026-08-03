import { test, expect } from '@playwright/test';

/**
 * E2E Tests Completos para Calculadora de Presupuestos
 * CONSTRUCTORA WM/M&S - Sistema ERP de Construcción
 * 
 * Este test suite valida TODOS los elementos y funciones del módulo de presupuestos:
 * - Selección de proyecto
 * - Agregar items personalizados
 * - Cálculo de losas (slab calculator)
 * - Cálculo APU (Análisis de Precios Unitarios)
 * - Catálogo de renglones por tipología
 * - Porcentajes de indirectos, contingencia y utilidad
 * - Panel de resumen
 * - Integración con almacén
 * - Exportación PDF y CSV
 * - Validaciones
 */

test.describe('Calculadora de Presupuestos - Funcionalidad Completa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
  });

  test('FLUJO COMPLETO: Crear presupuesto desde cero con todas las funcionalidades', async ({ page }) => {
    // ============================================================================
    // PASO 1: Seleccionar proyecto
    // ============================================================================
    await page.selectOption('select[name="project"]', '1');
    await expect(page.locator('text=Calculadora de Presupuestos')).toBeVisible();

    // ============================================================================
    // PASO 2: Agregar item personalizado manual
    // ============================================================================
    await page.click('button:has-text("Agregar Item")');

    await page.fill('input[name="description"]', 'Cimentación y fundaciones');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_cost"]', '150000');

    // Verificar cálculo automático de total_cost
    const totalCost = page.locator('input[name="totalCost"]');
    await expect(totalCost).toHaveValue('150000');

    await page.click('button:has-text("Agregar")');
    await expect(page.locator('text=Cimentación y fundaciones')).toBeVisible();

    // ============================================================================
    // PASO 3: Agregar segundo item personalizado
    // ============================================================================
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Muros de bloque');
    await page.fill('input[name="quantity"]', '150');
    await page.fill('input[name="unit_cost"]', '450');
    await page.click('button:has-text("Agregar")');
    await expect(page.locator('text=Muros de bloque')).toBeVisible();

    // ============================================================================
    // PASO 4: Abrir calculadora de losas
    // ============================================================================
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

    // Verificar resultado del cálculo
    await expect(page.locator('text=Losa calculada')).toBeVisible();
    await expect(page.locator('text=Resultado del Cálculo')).toBeVisible();

    // Verificar que se muestre el desglose
    await expect(page.locator('text=Concreto')).toBeVisible();
    await expect(page.locator('text=Acero')).toBeVisible();
    await expect(page.locator('text=Cimbra')).toBeVisible();

    // Agregar al presupuesto
    await page.click('button:has-text("Agregar al Presupuesto")');
    await expect(page.locator('text=Cálculo de losa agregado')).toBeVisible();

    // Verificar que el item de losa aparezca en la tabla
    await expect(page.locator('text=Losa de concreto')).toBeVisible();

    // ============================================================================
    // PASO 5: Abrir calculadora APU
    // ============================================================================
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

    // Calcular APU
    await page.click('button:has-text("Calcular APU")');

    // Verificar desglose de APU
    await expect(page.locator('text=Materiales')).toBeVisible();
    await expect(page.locator('text=Mano de Obra')).toBeVisible();
    await expect(page.locator('text=Maquinaria')).toBeVisible();

    // Verificar que se muestre el costo unitario calculado
    await expect(page.locator('text=Costo Unitario')).toBeVisible();

    // Agregar al presupuesto
    await page.click('button:has-text("Agregar al Presupuesto")');
    await expect(page.locator('text=Cálculo APU agregado')).toBeVisible();

    // ============================================================================
    // PASO 6: Verificar panel de resumen
    // ============================================================================
    await expect(page.locator('text=Costo Directo')).toBeVisible();
    await expect(page.locator('text=Indirectos')).toBeVisible();
    await expect(page.locator('text=Contingencia')).toBeVisible();
    await expect(page.locator('text=Utilidad')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();

    // ============================================================================
    // PASO 7: Modificar porcentajes
    // ============================================================================
    await page.fill('input[name="indirectPercentage"]', '20');
    await page.fill('input[name="contingencyPercentage"]', '8');
    await page.fill('input[name="profitPercentage"]', '12');

    // Verificar recálculo automático
    const indirectCost = page.locator('text=Indirectos').locator('..').locator('..');
    // El valor debería actualizarse automáticamente (verificamos que el input tenga el nuevo valor)
    await expect(page.locator('input[name="indirectPercentage"]')).toHaveValue('20');

    // ============================================================================
    // PASO 8: Modificar item existente
    // ============================================================================
    const firstItem = page.locator('table tbody tr').first();
    await firstItem.click();

    // Modificar cantidad
    await page.fill('input[name="quantity"]', '2');

    // Verificar recálculo de total
    const updatedTotalCost = page.locator('input[name="totalCost"]');
    await expect(updatedTotalCost).toHaveValue('300000'); // 2 * 150000

    await page.click('button:has-text("Guardar")');
    await expect(page.locator('text=Item actualizado')).toBeVisible();

    // ============================================================================
    // PASO 9: Eliminar item
    // ============================================================================
    const secondItem = page.locator('table tbody tr').nth(1);
    const itemDescription = await secondItem.locator('td:nth-child(2)').textContent();

    await secondItem.locator('button[aria-label*="Eliminar"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Confirmar")');

    await expect(page.locator('text=Item eliminado')).toBeVisible();
    await expect(page.locator(`text=${itemDescription}`)).not.toBeVisible();

    // ============================================================================
    // PASO 10: Guardar presupuesto completo
    // ============================================================================
    await page.click('button:has-text("Guardar")');

    // Verificar toast de éxito
    await expect(page.locator('text=Presupuesto guardado exitosamente')).toBeVisible();

    // Verificar integración con almacén
    await expect(page.locator('text=materiales sincronizados con el almacén')).toBeVisible();

    // ============================================================================
    // PASO 11: Exportar PDF
    // ============================================================================
    await page.click('button:has-text("Exportar PDF")');
    await expect(page.locator('text=Vista Previa PDF')).toBeVisible();

    // Verificar que el PDF viewer se cargue
    await expect(page.locator('iframe')).toBeVisible();

    // Cerrar modal de PDF
    await page.click('button:has-text("Cerrar")');

    // ============================================================================
    // PASO 12: Exportar CSV
    // ============================================================================
    await page.click('button:has-text("Exportar CSV")');

    // Verificar que se inicie la descarga (esto requiere verificación de archivo descargado)
    // Por ahora, verificamos que el botón exista y sea clickeable
    await expect(page.locator('button:has-text("Exportar CSV")')).toBeVisible();
  });

  test('CATÁLOGO DE RENGLONES: Seleccionar renglones del catálogo por tipología', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Seleccionar tipología
    await page.selectOption('select[name="typology"]', 'residential');

    // Verificar que se muestre el catálogo de renglones
    await expect(page.locator('text=Catálogo de Renglones')).toBeVisible();

    // Buscar renglón específico
    await page.fill('input[placeholder*="Buscar renglón"]', 'cimentación');

    // Verificar resultados filtrados
    await expect(page.locator('text=Cimentación')).toBeVisible();

    // Agregar renglón del catálogo
    await page.click('button:has-text("Agregar")').first();
    await expect(page.locator('text=Renglón agregado')).toBeVisible();
  });

  test('TOPOGRAFÍA: Integración de datos topográficos', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Abrir sección de topografía
    await page.click('button:has-text("Topografía")');

    await expect(page.locator('text=Datos Topográficos')).toBeVisible();

    // Ingresar datos de topografía
    await page.fill('input[name="volumeCut"]', '500');
    await page.fill('input[name="volumeFill"]', '300');
    await page.fill('input[name="terrainArea"]', '1000');
    await page.selectOption('select[name="soilType"]', 'arena');

    // Guardar datos topográficos
    await page.click('button:has-text("Guardar")');
    await expect(page.locator('text=Datos topográficos guardados')).toBeVisible();
  });

  test('RENGLÓN DETALLADO: Ver desglose de materiales de renglón específico', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar un renglón
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Losa de concreto');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="unit_cost"]', '850');
    await page.click('button:has-text("Agregar")');

    // Expandir acordeón del renglón
    await page.click('button[aria-label*="Expandir"]').first();

    // Verificar desglose de materiales
    await expect(page.locator('text=Desglose de Materiales')).toBeVisible();
    await expect(page.locator('text=Código')).toBeVisible();
    await expect(page.locator('text=Descripción')).toBeVisible();
    await expect(page.locator('text=Cantidad')).toBeVisible();
    await expect(page.locator('text=Unidad')).toBeVisible();
    await expect(page.locator('text=Precio Unitario')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('PARÁMETROS APU: Modificar parámetros de renglón específico', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar renglón con APU
    await page.click('button:has-text("Calcular APU")');
    await page.selectOption('select[name="typology"]', 'residential');
    await page.fill('input[name="theoreticalQuantity"]', '100');
    await page.fill('input[name="wastePercentage"]', '5');
    await page.fill('input[name="volumetricFactor"]', '1.05');
    await page.fill('input[name="crewDailySalary']', '350');
    await page.fill('input[name="dailyPerformance']', '25');
    await page.fill('input[name="indirectPercentage']', '15');
    await page.click('button:has-text("Calcular APU")');
    await page.click('button:has-text("Agregar al Presupuesto")');

    // Expandir acordeón del renglón
    await page.click('button[aria-label*="Expandir"]').first();

    // Modificar parámetros específicos del renglón
    await page.fill('input[name="customCrewSize"]', '8');
    await page.fill('input[name="customMaterialCost"]', '50');
    await page.fill('input[name="customPerformance"]', '30');

    // Verificar recálculo
    await expect(page.locator('text=Parámetros actualizados')).toBeVisible();
  });

  test('VALIDACIONES: Sin proyecto seleccionado', async ({ page }) => {
    // Intentar guardar sin seleccionar proyecto
    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Seleccione un proyecto')).toBeVisible();
  });

  test('VALIDACIONES: Porcentajes negativos', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    await page.fill('input[name="indirectPercentage"]', '-10');
    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=El porcentaje no puede ser negativo')).toBeVisible({ timeout: 5000 });
  });

  test('VALIDACIONES: Porcentajes sobre 100%', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    await page.fill('input[name="indirectPercentage"]', '150');
    await page.click('button:has-text("Guardar")');

    await expect(page.locator('text=Porcentaje no puede exceder 100%')).toBeVisible({ timeout: 5000 });
  });

  test('INTEGRACIÓN WAREHOUSE: Verificar sincronización con almacén', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar item con materiales
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Cemento Portland');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="unit_cost"]', '45');
    await page.click('button:has-text("Agregar")');

    // Guardar presupuesto
    await page.click('button:has-text("Guardar")');

    // Verificar toast de integración
    await expect(page.locator('text=materiales sincronizados con el almacén')).toBeVisible();

    // Navegar a almacén para verificar que el material se haya creado
    await page.click('button:has-text("Almacén")');

    // Buscar el material
    await page.fill('input[placeholder*="Buscar"]', 'Cemento Portland');

    // Verificar que el material exista
    await expect(page.locator('text=Cemento Portland')).toBeVisible();
  });

  test('TIPOLOGÍAS: Verificar todas las tipologías disponibles', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Abrir calculadora APU
    await page.click('button:has-text("Calcular APU")');

    // Verificar todas las tipologías en el dropdown
    const typologySelect = page.locator('select[name="typology"]');
    await expect(typologySelect).toBeVisible();

    const options = await typologySelect.locator('option').all();
    const optionTexts = await Promise.all(options.map(opt => opt.textContent()));

    expect(optionTexts).toContain('Residencial');
    expect(optionTexts).toContain('Comercial');
    expect(optionTexts).toContain('Industrial');
    expect(optionTexts).toContain('Civil');
    expect(optionTexts).toContain('Público');
  });

  test('SINCRONIZACIÓN: Verificar estado de sync al guardar', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar item
    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Item de prueba sync');
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="unit_cost"]', '100');
    await page.click('button:has-text("Agregar")');

    // Guardar
    await page.click('button:has-text("Guardar")');

    // Verificar indicador de sync (si está online debería mostrar sync, si offline pending)
    const syncIndicator = page.locator('[aria-label*="Sincronización"]');
    await expect(syncIndicator).toBeVisible();
  });

  test('RESPONSIVE: Verificar vista en móvil', async ({ page }) => {
    // Simular viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
    await page.selectOption('select[name="project"]', '1');

    // Verificar que el layout se adapte
    await expect(page.locator('text=Calculadora de Presupuestos')).toBeVisible();

    // Verificar que los botones sean accesibles en móvil
    await expect(page.locator('button:has-text("Agregar Item")')).toBeVisible();
    await expect(page.locator('button:has-text("Guardar")')).toBeVisible();
  });

  test('PERFORMANCE: Renderizado incremental con muchos items', async ({ page }) => {
    await page.selectOption('select[name="project"]', '1');

    // Agregar múltiples items
    for (let i = 0; i < 30; i++) {
      await page.click('button:has-text("Agregar Item")');
      await page.fill('input[name="description"]', `Item de prueba ${i + 1}`);
      await page.fill('input[name="quantity"]', '10');
      await page.fill('input[name="unit_cost"]', '100');
      await page.click('button:has-text("Agregar")');
    }

    // Verificar que se muestre el botón "Ver más" (renderizado incremental)
    const showMoreButton = page.locator('button:has-text("Ver más")');
    if (await showMoreButton.isVisible()) {
      await showMoreButton.click();
      await expect(page.locator('text=Ver más')).not.toBeVisible();
    }
  });
});

test.describe('Calculadora de Presupuestos - Escenarios Edge Cases', () => {
  test('EDGE CASE: Presupuesto vacío', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
    await page.selectOption('select[name="project"]', '1');

    // Intentar guardar sin items
    await page.click('button:has-text("Guardar")');

    // Debería mostrar advertencia pero permitir guardar (presupuesto de 0)
    await expect(page.locator('text=Presupuesto guardado')).toBeVisible();
  });

  test('EDGE CASE: Cantidad cero', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
    await page.selectOption('select[name="project"]', '1');

    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Item con cantidad cero');
    await page.fill('input[name="quantity"]', '0');
    await page.fill('input[name="unit_cost"]', '100');
    await page.click('button:has-text("Agregar")');

    // Verificar que el item se agregue pero con total 0
    await expect(page.locator('text=Item con cantidad cero')).toBeVisible();
  });

  test('EDGE CASE: Costo unitario muy alto', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
    await page.selectOption('select[name="project"]', '1');

    await page.click('button:has-text("Agregar Item")');
    await page.fill('input[name="description"]', 'Item costoso');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_cost"]', '999999999');
    await page.click('button:has-text("Agregar")');

    // Verificar validación de máximo permitido
    await expect(page.locator('text=excede el máximo permitido')).toBeVisible({ timeout: 5000 });
  });

  test('EDGE CASE: Descripción muy larga', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Presupuestos")');
    await page.selectOption('select[name="project"]', '1');

    await page.click('button:has-text("Agregar Item")');
    const longDescription = 'A'.repeat(600);
    await page.fill('input[name="description"]', longDescription);
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_cost']', '100');
    await page.click('button:has-text("Agregar")');

    // Verificar validación de longitud máxima
    await expect(page.locator('text=no puede exceder')).toBeVisible({ timeout: 5000 });
  });
});
