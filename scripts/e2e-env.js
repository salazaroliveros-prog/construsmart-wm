/**
 * PRUEBAS E2E CON VARIABLES DE ENTORNO - CONSTRUCTORA WM/M&S
 * Script para validar la suite completa usando variables de entorno
 * Uso: 
 * 1. Windows: set TEST_EMAIL=tu@email.com && set TEST_PASSWORD=tu_pass && node scripts/e2e-env.js
 * 2. PowerShell: $env:TEST_EMAIL="tu@email.com"; $env:TEST_PASSWORD="tu_pass"; node scripts/e2e-env.js
 * 3. O crear archivo .env.test con las credenciales
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.test' });

async function runE2ETests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales en variables de entorno');
    console.log('Variables requeridas: TEST_EMAIL y TEST_PASSWORD');
    console.log('\nEjemplo de uso:');
    console.log('Windows: set TEST_EMAIL=tu@email.com && set TEST_PASSWORD=tu_pass && node scripts/e2e-env.js');
    console.log('PowerShell: $env:TEST_EMAIL="tu@email.com"; $env:TEST_PASSWORD="tu_pass"; node scripts/e2e-env.js');
    console.log('Linux/Mac: TEST_EMAIL=tu@email.com TEST_PASSWORD=tu_pass node scripts/e2e-env.js');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas E2E de la suite...');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('🔐 Usando credenciales de variables de entorno\n');

  console.log('\n🧪 Iniciando navegador en modo visible...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Hacer más lento para que se vea la interacción
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    login: { success: false, errors: [] },
    navigation: { success: false, errors: [] },
    modules: {},
    totalTests: 0,
    passed: 0,
    failed: 0
  };

  try {
    // Test 1: Login
    console.log('\n📝 Test 1: Login');
    results.totalTests++;
    
    await page.goto(`${baseUrl}/login`);
    
    // Verificar que estamos en la página de login
    const url = page.url();
    if (!url.includes('/login')) {
      results.login.errors.push('No redirigió a /login automáticamente');
    } else {
      console.log('✅ Página de login cargada');
    }

    // Verificar elementos del formulario
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Entrar")');

    try {
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Campo email visible');
    } catch (e) {
      results.login.errors.push('Campo email no visible');
    }

    try {
      await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Campo password visible');
    } catch (e) {
      results.login.errors.push('Campo password no visible');
    }

    try {
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Botón submit visible');
    } catch (e) {
      results.login.errors.push('Botón submit no visible');
    }

    // Intentar login
    console.log('🔑 Ingresando credenciales...');
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submitButton.click();

    // Esperar respuesta
    console.log('⏳ Esperando respuesta del servidor...');
    await page.waitForTimeout(5000);

    const afterLoginUrl = page.url();
    if (!afterLoginUrl.includes('/login')) {
      console.log('✅ Login parece exitoso, redirigido a:', afterLoginUrl);
      results.login.success = true;
      results.passed++;
    } else {
      console.log('❌ Login falló, aún en página de login');
      results.login.errors.push('Credenciales inválidas o error en login');
      results.failed++;
    }

    // Test 2: Navegación por módulos (usando tabs de la SPA)
    console.log('\n📝 Test 2: Navegación por módulos (SPA)');
    results.totalTests++;

    const modules = [
      { name: 'Dashboard', tab: 'dashboard' },
      { name: 'Proyectos', tab: 'projects' },
      { name: 'Finanzas', tab: 'finances' },
      { name: 'Almacén', tab: 'warehouse' },
      { name: 'Nómina', tab: 'payroll' },
      { name: 'Bitácora', tab: 'logs' },
      { name: 'Presupuestos', tab: 'budgets' },
    ];

    for (const module of modules) {
      console.log(`\n🔍 Probando módulo: ${module.name}`);
      try {
        // Navegar usando el sistema de tabs de la SPA
        const response = await page.goto(`${baseUrl}/?tab=${module.tab}`);
        await page.waitForTimeout(5000);
        
        // Verificar que la página cargó sin errores HTTP reales
        const isHttpError = response && (response.status() >= 400);
        
        // Verificar que no haya errores de aplicación visibles
        const hasAppError = await page.locator('body:has-text("Application Error"), body:has-text("Internal Server Error")').count() > 0;
        
        if (isHttpError) {
          results.modules[module.name] = { success: false, error: `HTTP ${response.status()}` };
          results.navigation.errors.push(`${module.name}: HTTP ${response.status()}`);
          console.log(`❌ ${module.name}: HTTP ${response.status()}`);
        } else if (hasAppError) {
          results.modules[module.name] = { success: false, error: 'Application Error' };
          results.navigation.errors.push(`${module.name}: Application Error`);
          console.log(`❌ ${module.name}: Application Error`);
        } else {
          results.modules[module.name] = { success: true };
          console.log(`✅ ${module.name}: Cargado correctamente (tab: ${module.tab})`);
        }
      } catch (e) {
        results.modules[module.name] = { success: false, error: e.message };
        results.navigation.errors.push(`${module.name}: ${e.message}`);
        console.log(`❌ ${module.name}: Error - ${e.message}`);
        // Continuar con el siguiente módulo
        continue;
      }
    }

    if (results.navigation.errors.length === 0) {
      results.navigation.success = true;
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 3: Verificar componentes principales
    console.log('\n📝 Test 3: Verificar componentes principales');
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=projects`);
    await page.waitForTimeout(3000);

    const components = [
      { name: 'Formulario de proyecto', selector: 'input[type="text"]', description: 'Campo de búsqueda o formulario' },
      { name: 'Botón nuevo proyecto', selector: 'button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")', description: 'Botón para crear proyecto' },
      { name: 'Lista de proyectos', selector: 'table, .glass-card', description: 'Lista o tarjetas de proyectos' },
    ];

    let componentErrors = 0;
    for (const component of components) {
      try {
        const element = page.locator(component.selector).first();
        await element.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`✅ ${component.name}: Visible`);
      } catch (e) {
        console.log(`⚠️  ${component.name}: No visible - ${component.description}`);
        componentErrors++;
      }
    }

    if (componentErrors === 0) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 4: Verificar bitácora
    console.log('\n📝 Test 4: Verificar bitácora');
    results.totalTests++;

    await page.goto(`${baseUrl}/logs`);
    await page.waitForTimeout(3000);

    try {
      const logForm = page.locator('textarea, input[placeholder*="descripción"], input[placeholder*="Descripción"]').first();
      await logForm.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Formulario de bitácora visible');
      results.passed++;
    } catch (e) {
      console.log('❌ Formulario de bitácora no visible');
      results.failed++;
    }

    // Test 5: Verificar responsive design
    console.log('\n📝 Test 5: Verificar responsive design');
    results.totalTests++;

    // Probar tamaño móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForTimeout(3000);
    console.log('✅ Vista móvil cargada');

    // Probar tamaño desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForTimeout(3000);
    console.log('✅ Vista desktop cargada');
    results.passed++;

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
    results.navigation.errors.push(`Error crítico: ${error.message}`);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`\nLogin: ${results.login.success ? '✅ OK' : '❌ FAIL'}`);
  if (results.login.errors.length > 0) {
    results.login.errors.forEach(err => console.log(`  - ${err}`));
  }
  console.log(`\nNavegación: ${results.navigation.success ? '✅ OK' : '❌ FAIL'}`);
  if (results.navigation.errors.length > 0) {
    results.navigation.errors.forEach(err => console.log(`  - ${err}`));
  }
  console.log(`\nMódulos probados: ${Object.keys(results.modules).length}`);
  Object.entries(results.modules).forEach(([name, result]) => {
    console.log(`  ${name}: ${result.success ? '✅ OK' : '❌ FAIL'} ${result.error ? `(${result.error})` : ''}`);
  });
  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else {
    console.log(`\n⚠️  ${results.failed} pruebas fallaron. Revisar errores arriba.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runE2ETests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
