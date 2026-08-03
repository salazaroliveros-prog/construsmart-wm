import { test, expect } from '@playwright/test';

/**
 * E2E Tests para Gestión de Proyectos
 * CONSTRUCTORA WM/M&S - Sistema ERP de Construcción
 */

test.describe('Gestión de Proyectos - CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navegar a módulo de proyectos
    await page.click('button:has-text("Proyectos")');
  });

  test('CREAR: Nuevo proyecto con datos válidos', async ({ page }) => {
    // Click en "Nuevo Proyecto"
    await page.click('button:has-text("Nuevo Proyecto")');

    // Esperar que el modal esté visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Llenar formulario con datos realistas
    await page.fill('input[name="code"]', 'PROJ-TEST-001');
    await page.fill('input[name="name"]', 'Residencial Prueba QA');
    await page.fill('input[name="client_name"]', 'Cliente de Prueba');
    await page.fill('input[name="location"]', 'Zona 10, Guatemala');
    await page.selectOption('select[name="typology"]', 'residential');
    await page.fill('input[name="area_m2"]', '250');
    await page.selectOption('select[name="quality_level"]', 'moderate');
    await page.selectOption('select[name="status"]', 'planning');
    await page.fill('input[name="duration_days"]', '180');
    await page.fill('input[name="total_budget"]', '875000');

    // Submit formulario
    await page.click('button:has-text("Guardar")');

    // Verificar toast de éxito
    await expect(page.locator('text=Proyecto creado exitosamente')).toBeVisible();

    // Verificar que el proyecto aparezca en la tabla
    await expect(page.locator('text=PROJ-TEST-001')).toBeVisible();
    await expect(page.locator('text=Residencial Prueba QA')).toBeVisible();
  });

  test('CREAR: Validar campos obligatorios vacíos', async ({ page }) => {
    await page.click('button:has-text("Nuevo Proyecto")');

    // Intentar guardar sin llenar campos
    await page.click('button:has-text("Guardar")');

    // Debería mostrar error de validación
    // Nota: Actualmente no hay validación en UI, este test fallará hasta que se implemente
    await expect(page.locator('text=Código requerido')).toBeVisible({ timeout: 5000 });
  });

  test('CREAR: Validar código duplicado', async ({ page }) => {
    // Crear primer proyecto
    await page.click('button:has-text("Nuevo Proyecto")');
    await page.fill('input[name="code"]', 'PROJ-DUP-001');
    await page.fill('input[name="name"]', 'Proyecto Original');
    await page.fill('input[name="client_name"]', 'Cliente Original');
    await page.fill('input[name="location"]', 'Ubicación Original');
    await page.selectOption('select[name="typology"]', 'residential');
    await page.fill('input[name="area_m2"]', '200');
    await page.selectOption('select[name="quality_level"]', 'moderate');
    await page.selectOption('select[name="status"]', 'planning');
    await page.fill('input[name="duration_days"]', '180');
    await page.fill('input[name="total_budget"]', '700000');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator('text=Proyecto creado exitosamente')).toBeVisible();

    // Intentar crear segundo proyecto con mismo código
    await page.click('button:has-text("Nuevo Proyecto")');
    await page.fill('input[name="code"]', 'PROJ-DUP-001');
    await page.fill('input[name="name"]', 'Proyecto Duplicado');
    await page.fill('input[name="client_name"]', 'Cliente Duplicado');
    await page.fill('input[name="location"]', 'Ubicación Duplicada');
    await page.selectOption('select[name="typology"]', 'residential');
    await page.fill('input[name="area_m2"]', '200');
    await page.selectOption('select[name="quality_level"]', 'moderate');
    await page.selectOption('select[name="status"]', 'planning');
    await page.fill('input[name="duration_days"]', '180');
    await page.fill('input[name="total_budget"]', '700000');
    await page.click('button:has-text("Guardar")');

    // Debería mostrar error de código duplicado
    await expect(page.locator('text=Código ya existe')).toBeVisible({ timeout: 5000 });
  });

  test('LEER: Verificar carga de proyectos desde DB', async ({ page }) => {
    // Verificar que la tabla de proyectos esté visible
    await expect(page.locator('table')).toBeVisible();

    // Verificar headers de tabla
    await expect(page.locator('th:has-text("Código")')).toBeVisible();
    await expect(page.locator('th:has-text("Nombre")')).toBeVisible();
    await expect(page.locator('th:has-text("Cliente")')).toBeVisible();
    await expect(page.locator('th:has-text("Estado")')).toBeVisible();
  });

  test('ACTUALIZAR: Modificar proyecto existente', async ({ page }) => {
    // Asumimos que hay al menos un proyecto
    const firstProjectRow = page.locator('table tbody tr').first();
    await firstProjectRow.click();

    // Esperar modal de edición
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Modificar campos
    await page.fill('input[name="name"]', 'Proyecto Modificado QA');
    await page.selectOption('select[name="status"]', 'execution');

    // Guardar cambios
    await page.click('button:has-text("Guardar")');

    // Verificar toast de éxito
    await expect(page.locator('text=Proyecto actualizado exitosamente')).toBeVisible();

    // Verificar que los cambios se reflejen en la tabla
    await expect(page.locator('text=Proyecto Modificado QA')).toBeVisible();
  });

  test('ELIMINAR: Borrar proyecto con confirmación', async ({ page }) => {
    // Asumimos que hay al menos un proyecto
    const firstProjectRow = page.locator('table tbody tr').first();
    const projectName = await firstProjectRow.locator('td:nth-child(2)').textContent();

    // Click en botón eliminar
    await firstProjectRow.locator('button[aria-label*="Eliminar"]').click();

    // Verificar diálogo de confirmación
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=¿Está seguro?')).toBeVisible();

    // Confirmar eliminación
    await page.click('button:has-text("Confirmar")');

    // Verificar toast de éxito
    await expect(page.locator('text=Proyecto eliminado exitosamente')).toBeVisible();

    // Verificar que el proyecto ya no esté en la tabla
    await expect(page.locator(`text=${projectName}`)).not.toBeVisible();
  });

  test('FILTRAR: Filtrar proyectos por estado', async ({ page }) => {
    // Seleccionar filtro "En Ejecución"
    await page.selectOption('select[name="filterStatus"]', 'execution');

    // Verificar que solo proyectos en ejecución se muestren
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row.locator('td').nth(6)).toContainText('En Ejecución');
    }
  });

  test('BUSCAR: Buscar proyecto por código o nombre', async ({ page }) => {
    // Ingresar término de búsqueda
    await page.fill('input[placeholder*="Buscar"]', 'PROJ');

    // Verificar que la tabla se filtre
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      expect(text?.toLowerCase()).toContain('proj');
    }
  });

  test('SYNC: Verificar estado de sincronización offline', async ({ page }) => {
    // Simular modo offline (esto requiere configuración adicional)
    // Por ahora, verificamos que el indicador de sync esté visible
    const syncIndicator = page.locator('[aria-label*="Sincronización"]');
    await expect(syncIndicator).toBeVisible();
  });
});

test.describe('Gestión de Proyectos - Responsive Design', () => {
  test('Mobile: Verificar vista cards en pantallas pequeñas', async ({ page }) => {
    // Simular viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Navegar a proyectos
    await page.click('button:has-text("Proyectos")');

    // Verificar que se muestre vista cards en lugar de tabla
    await expect(page.locator('table')).not.toBeVisible();
    await expect(page.locator('.glass-card')).toBeVisible();
  });

  test('Desktop: Verificar vista tabla en pantallas grandes', async ({ page }) => {
    // Simular viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Navegar a proyectos
    await page.click('button:has-text("Proyectos")');

    // Verificar que se muestre tabla
    await expect(page.locator('table')).toBeVisible();
  });
});
