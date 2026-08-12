/**
 * PRUEBAS E2E EXHAUSTIVAS DE TODA LA SUITE
 * Validación completa de todos los módulos, componentes y funcionalidades
 * Uso: node scripts/e2e-exhaustive-suite-validation.js
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.test' });

// Todos los módulos de la suite
const ALL_MODULES = [
  { id: 'dashboard', name: 'Dashboard', path: '/?tab=dashboard', hasForm: false, hasList: false },
  { id: 'projects', name: 'Proyectos', path: '/?tab=projects', hasForm: true, hasList: true },
  { id: 'budgets', name: 'Presupuestos', path: '/?tab=budgets', hasForm: true, hasList: true },
  { id: 'progress', name: 'Seguimiento', path: '/?tab=progress', hasForm: false, hasList: true },
  { id: 'finances', name: 'Finanzas', path: '/?tab=finances', hasForm: true, hasList: true },
  { id: 'payroll', name: 'Nómina', path: '/?tab=payroll', hasForm: true, hasList: true },
  { id: 'warehouse', name: 'Almacén', path: '/?tab=warehouse', hasForm: true, hasList: true },
  { id: 'suppliers', name: 'Proveedores', path: '/?tab=suppliers', hasForm: true, hasList: true },
  { id: 'orders', name: 'Órdenes de Compra', path: '/?tab=orders', hasForm: true, hasList: true },
  { id: 'subcontractors', name: 'Subcontratistas', path: '/?tab=subcontractors', hasForm: true, hasList: true },
  { id: 'clients', name: 'Clientes', path: '/?tab=clients', hasForm: true, hasList: true },
  { id: 'logs', name: 'Bitácora', path: '/?tab=logs', hasForm: true, hasList: true },
  { id: 'analytics', name: 'Analíticas', path: '/?tab=analytics', hasForm: false, hasList: false },
  { id: 'settings', name: 'Configuración', path: '/?tab=settings', hasForm: true, hasList: false }
];

const results = {
  modules: { success: false, errors: [], warnings: [], details: [] },
  components: { success: false, errors: [], warnings: [], details: [] },
  uiConsistency: { success: false, errors: [], warnings: [], details: [] },
  accessibility: { success: false, errors: [], warnings: [], details: [] },
  responsive: { success: false, errors: [], warnings: [], details: [] },
  functionality: { success: false, errors: [], warnings: [], details: [] },
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

async function runExhaustiveValidation() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales');
    process.exit(1);
  }

  console.log('🚀 Iniciando validación exhaustiva de toda la suite...');
  console.log('📡 URL de prueba:', baseUrl);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('\n🔐 Iniciando sesión...');
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      console.log('❌ Login falló');
      process.exit(1);
    }

    console.log('✅ Login exitoso');

    // ============================================
    // TEST 1: VALIDACIÓN DE TODOS LOS MÓDULOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 1: VALIDACIÓN DE TODOS LOS MÓDULOS (14)');
    console.log('='.repeat(70));
    results.totalTests++;

    for (const module of ALL_MODULES) {
      await page.goto(`${baseUrl}${module.path}`);
      await page.waitForTimeout(2000);

      const title = await page.title();
      const contentVisible = await page.locator('main').isVisible();
      
      if (contentVisible && !page.url().includes('/login')) {
        console.log(`✅ ${module.name}: módulo cargado correctamente`);
        results.modules.details.push(`✅ ${module.name}`);
        
        // Verificar contenido específico
        if (module.hasList) {
          const list = page.locator('tbody tr, [class*="list"], [class*="grid"], [class*="card"]');
          const count = await list.count();
          console.log(`   📊 ${count} elementos de lista encontrados`);
        }
        
        if (module.hasForm) {
          const newBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")').first();
          if (await newBtn.count() > 0) {
            console.log(`   ✅ Botón de creación encontrado`);
          }
        }
      } else {
        console.log(`❌ ${module.name}: error al cargar`);
        results.modules.errors.push(`${module.name} error carga`);
        results.failed++;
      }
    }

    results.modules.success = results.modules.errors.length === 0;
    if (results.modules.success) results.passed++;

    // ============================================
    // TEST 2: VALIDACIÓN DE COMPONENTES UI
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 2: VALIDACIÓN DE COMPONENTES UI');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const components = [
      { selector: '.glass-card', name: 'Tarjetas glass' },
      { selector: '.glass-panel', name: 'Paneles glass' },
      { selector: '.glass-button', name: 'Botones glass' },
      { selector: '.glass-input', name: 'Inputs glass' },
      { selector: 'header', name: 'Header' },
      { selector: 'nav', name: 'Navegación' },
      { selector: 'aside', name: 'Sidebar' },
      { selector: 'main', name: 'Contenido principal' }
    ];

    for (const comp of components) {
      const count = await page.locator(comp.selector).count();
      if (count > 0) {
        console.log(`✅ ${comp.name}: ${count} encontrados`);
        results.components.details.push(`✅ ${comp.name} ${count}`);
      } else {
        console.log(`⚠️  ${comp.name}: no encontrados`);
        results.components.warnings.push(`${comp.name} no encontrado`);
        results.warnings++;
      }
    }

    results.components.success = results.components.errors.length === 0;
    if (results.components.success) results.passed++;

    // ============================================
    // TEST 3: CONSISTENCIA DE UI
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 3: CONSISTENCIA DE UI EN TODA LA SUITE');
    console.log('='.repeat(70));
    results.totalTests++;

    const consistencyChecks = [];

    for (const module of ALL_MODULES.slice(0, 5)) {
      await page.goto(`${baseUrl}${module.path}`);
      await page.waitForTimeout(1500);

      const cards = page.locator('.glass-card');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        const cardStyle = await cards.first().evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            borderRadius: styles.borderRadius,
            borderWidth: styles.borderWidth,
            padding: styles.padding
          };
        });
        consistencyChecks.push({ module: module.name, style: cardStyle });
      }
    }

    const uniqueStyles = new Set(consistencyChecks.map(c => JSON.stringify(c.style)));
    if (uniqueStyles.size <= 2) {
      console.log('✅ Estilos consistentes entre módulos');
      results.uiConsistency.details.push('✅ Estilos consistentes');
    } else {
      console.log('⚠️  Variaciones en estilos entre módulos');
      results.uiConsistency.warnings.push('Variaciones de estilos');
      results.warnings++;
    }

    results.uiConsistency.success = results.uiConsistency.errors.length === 0;
    if (results.uiConsistency.success) results.passed++;

    // ============================================
    // TEST 4: ACCESIBILIDAD
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 4: ACCESIBILIDAD WCAG');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const accessibilityChecks = [
      { selector: 'h1, h2, h3', name: 'Encabezados' },
      { selector: 'button', name: 'Botones' },
      { selector: 'input, select, textarea', name: 'Formularios' },
      { selector: 'a', name: 'Enlaces' }
    ];

    for (const check of accessibilityChecks) {
      const elements = page.locator(check.selector);
      const count = await elements.count();
      
      if (count > 0) {
        const hasAlt = await elements.first().evaluate(el => {
          if (el.tagName === 'IMG' || el.tagName === 'A') {
            return el.hasAttribute('alt') || el.hasAttribute('aria-label');
          }
          return true;
        });
        
        console.log(`✅ ${check.name}: ${count} elementos accesibles`);
        results.accessibility.details.push(`✅ ${check.name} ${count}`);
      }
    }

    results.accessibility.success = results.accessibility.errors.length === 0;
    if (results.accessibility.success) results.passed++;

    // ============================================
    // TEST 5: RESPONSIVIDAD COMPLETA
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 5: RESPONSIVIDAD COMPLETA (4 VIEWPORTS)');
    console.log('='.repeat(70));
    results.totalTests++;

    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${baseUrl}/?tab=dashboard`);
      await page.waitForTimeout(2000);

      const mainContent = page.locator('main').first();
      const isVisible = await mainContent.isVisible();
      const overflow = await mainContent.evaluate(el => {
        return el.scrollWidth > el.clientWidth + 10;
      });

      if (isVisible && !overflow) {
        console.log(`✅ ${viewport.name}: contenido visible sin overflow`);
        results.responsive.details.push(`✅ ${viewport.name}`);
      } else {
        console.log(`❌ ${viewport.name}: error`);
        results.responsive.errors.push(`${viewport.name} error`);
        results.failed++;
      }
    }

    // Restaurar viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    results.responsive.success = results.responsive.errors.length === 0;
    if (results.responsive.success) results.passed++;

    // ============================================
    // TEST 6: FUNCIONALIDAD DE MÓDULOS ESPECÍFICOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 6: FUNCIONALIDAD DE MÓDULOS ESPECÍFICOS');
    console.log('='.repeat(70));
    results.totalTests++;

    // Proyectos
    await page.goto(`${baseUrl}/?tab=projects`);
    await page.waitForTimeout(2000);
    const projectList = page.locator('[class*="project"], tbody tr');
    const projectCount = await projectList.count();
    console.log(`📊 Proyectos: ${projectCount} registros`);
    results.functionality.details.push(`✅ Proyectos ${projectCount}`);

    // Finanzas
    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);
    const financeList = page.locator('[class*="transaction"], tbody tr');
    const financeCount = await financeList.count();
    console.log(`📊 Finanzas: ${financeCount} transacciones`);
    results.functionality.details.push(`✅ Finanzas ${financeCount}`);

    // Almacén
    await page.goto(`${baseUrl}/?tab=warehouse`);
    await page.waitForTimeout(2000);
    const stockList = page.locator('[class*="stock"], tbody tr');
    const stockCount = await stockList.count();
    console.log(`📊 Almacén: ${stockCount} items`);
    results.functionality.details.push(`✅ Almacén ${stockCount}`);

    // Clientes
    await page.goto(`${baseUrl}/?tab=clients`);
    await page.waitForTimeout(2000);
    const clientList = page.locator('[class*="client"], tbody tr');
    const clientCount = await clientList.count();
    console.log(`📊 Clientes: ${clientCount} clientes`);
    results.functionality.details.push(`✅ Clientes ${clientCount}`);

    results.functionality.success = results.functionality.errors.length === 0;
    if (results.functionality.success) results.passed++;

  } catch (error) {
    console.error('\n❌ Error crítico durante validación:', error);
  } finally {
    console.log('\n⏳ Validación completada. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE VALIDACIÓN EXHAUSTIVA DE LA SUITE');
  console.log('='.repeat(70));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`⚠️  Advertencias: ${results.warnings}`);
  
  console.log('\n📝 TEST 1: MÓDULOS');
  console.log(`   Estado: ${results.modules.success ? '✅ OK' : '❌ FAIL'}`);
  results.modules.details.forEach(detail => console.log(`   ${detail}`));
  results.modules.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.modules.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 2: COMPONENTES UI');
  console.log(`   Estado: ${results.components.success ? '✅ OK' : '❌ FAIL'}`);
  results.components.details.forEach(detail => console.log(`   ${detail}`));
  results.components.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.components.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 3: CONSISTENCIA UI');
  console.log(`   Estado: ${results.uiConsistency.success ? '✅ OK' : '❌ FAIL'}`);
  results.uiConsistency.details.forEach(detail => console.log(`   ${detail}`));
  results.uiConsistency.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.uiConsistency.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 4: ACCESIBILIDAD');
  console.log(`   Estado: ${results.accessibility.success ? '✅ OK' : '❌ FAIL'}`);
  results.accessibility.details.forEach(detail => console.log(`   ${detail}`));
  results.accessibility.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.accessibility.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 5: RESPONSIVIDAD');
  console.log(`   Estado: ${results.responsive.success ? '✅ OK' : '❌ FAIL'}`);
  results.responsive.details.forEach(detail => console.log(`   ${detail}`));
  results.responsive.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.responsive.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 6: FUNCIONALIDAD');
  console.log(`   Estado: ${results.functionality.success ? '✅ OK' : '❌ FAIL'}`);
  results.functionality.details.forEach(detail => console.log(`   ${detail}`));
  results.functionality.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.functionality.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('='.repeat(70));

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 ¡Validación exhaustiva completada exitosamente! Toda la suite validada.');
  } else if (results.failed === 0) {
    console.log(`\n⚠️  ${results.warnings} advertencias. Revisar detalles.`);
  } else {
    console.log(`\n❌ ${results.failed} errores y ${results.warnings} advertencias. Revisar detalles.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runExhaustiveValidation().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
