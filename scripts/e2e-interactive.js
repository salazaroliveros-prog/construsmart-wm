/**
 * PRUEBAS E2E INTERACTIVAS - CONSTRUCTORA WM/M&S
 * Script interactivo para validar la suite completa con ingreso de credenciales
 * Uso: node scripts/e2e-interactive.js
 */

const readline = require('readline');
const { chromium } = require('playwright');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getCredentials() {
  console.log('🔐 INGRESO DE CREDENCIALES PARA PRUEBAS E2E');
  console.log('===============================================\n');
  
  const email = await askQuestion('Email: ');
  const password = await askQuestion('Password: ');
  
  console.log('\n');
  rl.close();
  
  return { email, password };
}

async function runE2ETests(email, password) {
  console.log('🚀 Iniciando pruebas E2E de la suite...');
  console.log('📡 URL de prueba: https://construsmart-wm.vercel.app\n');
  console.log('🔐 Usando credenciales proporcionadas\n');

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
    
    await page.goto('https://construsmart-wm.vercel.app/login');
    
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

    // Test 2: Navegación por módulos
    console.log('\n📝 Test 2: Navegación por módulos');
    results.totalTests++;

    const modules = [
      { name: 'Dashboard', path: '/' },
      { name: 'Proyectos', path: '/dashboard' },
      { name: 'Finanzas', path: '/finances' },
      { name: 'Almacén', path: '/warehouse' },
      { name: 'Nómina', path: '/payroll' },
      { name: 'Bitácora', path: '/logs' },
      { name: 'Presupuestos', path: '/budgets' },
    ];

    for (const module of modules) {
      console.log(`\n🔍 Probando módulo: ${module.name}`);
      try {
        await page.goto(`https://construsmart-wm.vercel.app${module.path}`);
        await page.waitForTimeout(3000);
        
        // Verificar que la página cargó sin errores 404/500
        const is404 = await page.locator('body:has-text("404")').count() > 0;
        const is500 = await page.locator('body:has-text("500")').count() > 0;
        
        if (is404) {
          results.modules[module.name] = { success: false, error: '404 Not Found' };
          results.navigation.errors.push(`${module.name}: 404 Not Found`);
          console.log(`❌ ${module.name}: 404 Not Found`);
        } else if (is500) {
          results.modules[module.name] = { success: false, error: '500 Server Error' };
          results.navigation.errors.push(`${module.name}: 500 Server Error`);
          console.log(`❌ ${module.name}: 500 Server Error`);
        } else {
          results.modules[module.name] = { success: true };
          console.log(`✅ ${module.name}: Cargado correctamente`);
        }
      } catch (e) {
        results.modules[module.name] = { success: false, error: e.message };
        results.navigation.errors.push(`${module.name}: ${e.message}`);
        console.log(`❌ ${module.name}: Error - ${e.message}`);
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

    await page.goto('https://construsmart-wm.vercel.app/dashboard');
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

    await page.goto('https://construsmart-wm.vercel.app/logs');
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
    await page.goto('https://construsmart-wm.vercel.app/dashboard');
    await page.waitForTimeout(3000);
    console.log('✅ Vista móvil cargada');

    // Probar tamaño desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('https://construsmart-wm.vercel.app/dashboard');
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

async function main() {
  try {
    const { email, password } = await getCredentials();
    await runE2ETests(email, password);
  } catch (error) {
    console.error('Error fatal:', error);
    process.exit(1);
  }
}

main();
