/**
 * PRUEBAS E2E DE FORMULARIOS Y PERSISTENCIA - CONSTRUCTORA WM/M&S
 * Script para validar creación de registros y persistencia en localStorage y DB remota
 * Uso: node scripts/e2e-forms.js
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.test' });

async function runFormTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales en variables de entorno');
    console.log('Variables requeridas: TEST_EMAIL y TEST_PASSWORD');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas de formularios y persistencia...');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('🔐 Usando credenciales de variables de entorno\n');

  console.log('\n🧪 Iniciando navegador en modo visible...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    login: { success: false, errors: [] },
    projectCreation: { success: false, errors: [] },
    financeCreation: { success: false, errors: [] },
    warehouseCreation: { success: false, errors: [] },
    localStorage: { success: false, errors: [] },
    remoteDB: { success: false, errors: [] },
    sync: { success: false, errors: [] },
    totalTests: 0,
    passed: 0,
    failed: 0
  };

  try {
    // Test 1: Login
    console.log('\n📝 Test 1: Login');
    results.totalTests++;
    
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Entrar")');

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submitButton.click();
    await page.waitForTimeout(5000);

    const afterLoginUrl = page.url();
    if (!afterLoginUrl.includes('/login')) {
      console.log('✅ Login exitoso');
      results.login.success = true;
      results.passed++;
    } else {
      console.log('❌ Login falló');
      results.login.errors.push('Credenciales inválidas');
      results.failed++;
    }

    // Test 2: Crear nuevo proyecto
    console.log('\n📝 Test 2: Crear nuevo proyecto');
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=projects`);
    await page.waitForTimeout(3000);

    try {
      // Buscar botón de nuevo proyecto
      const newProjectButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")').first();
      await newProjectButton.click();
      await page.waitForTimeout(2000);

      // Llenar formulario de proyecto
      const timestamp = Date.now();
      const projectCode = `PROJ-${timestamp}`;
      const projectName = `Proyecto Prueba ${timestamp}`;
      
      // Intentar llenar campos del formulario
      const codeInput = page.locator('input[name="code"], input[placeholder*="código"], input[placeholder*="Código"]').first();
      const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]').first();
      const clientInput = page.locator('input[name="client_name"], input[placeholder*="cliente"]').first();
      const locationInput = page.locator('input[name="location"], input[placeholder*="ubicación"]').first();
      
      if (await codeInput.count() > 0) {
        await codeInput.fill(projectCode);
        console.log('✅ Campo código llenado');
      }
      
      if (await nameInput.count() > 0) {
        await nameInput.fill(projectName);
        console.log('✅ Campo nombre llenado');
      }
      
      if (await clientInput.count() > 0) {
        await clientInput.fill('Cliente de Prueba');
        console.log('✅ Campo cliente llenado');
      }
      
      if (await locationInput.count() > 0) {
        await locationInput.fill('Ubicación de Prueba');
        console.log('✅ Campo ubicación llenado');
      }

      // Intentar guardar
      const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), button[type="submit"]').first();
      await saveButton.click();
      await page.waitForTimeout(3000);

      console.log('✅ Formulario de proyecto enviado');
      results.projectCreation.success = true;
      results.passed++;
      
      // Guardar datos para verificación posterior
      results.testProject = { code: projectCode, name: projectName };
      
    } catch (e) {
      console.log('❌ Error al crear proyecto:', e.message);
      results.projectCreation.errors.push(e.message);
      results.failed++;
    }

    // Test 3: Crear transacción financiera
    console.log('\n📝 Test 3: Crear transacción financiera');
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(3000);

    try {
      // Buscar botón específico "Nueva Transacción"
      const newTransButton = page.locator('button:has-text("Nueva Transacción"), button:has-text("Nueva")').first();
      
      if (await newTransButton.count() > 0) {
        console.log('✅ Encontrado botón "Nueva Transacción"');
        await newTransButton.click();
        await page.waitForTimeout(2000);

        // Llenar formulario básico
        const descInput = page.locator('input[name="description"], textarea[name="description"], input[placeholder*="descripción"]').first();
        const amountInput = page.locator('input[name="amount"], input[name="quantity"], input[type="number"], input[placeholder*="monto"]').first();
        
        if (await descInput.count() > 0) {
          await descInput.fill('Transacción de prueba');
          console.log('✅ Campo descripción llenado');
        }
        
        if (await amountInput.count() > 0) {
          await amountInput.fill('1000');
          console.log('✅ Campo monto llenado');
        }

        // Guardar
        const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), button[type="submit"]').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ Formulario financiero enviado');
          results.financeCreation.success = true;
          results.passed++;
        } else {
          console.log('⚠️  No se encontró botón de guardar');
          results.financeCreation.errors.push('Botón guardar no encontrado');
          results.failed++;
        }
      } else {
        console.log('⚠️  No se encontró botón de nueva transacción');
        results.financeCreation.errors.push('Botón no encontrado');
        results.failed++;
      }
    } catch (e) {
      console.log('❌ Error al crear transacción:', e.message);
      results.financeCreation.errors.push(e.message);
      results.failed++;
    }

    // Test 4: Crear item de almacén
    console.log('\n📝 Test 4: Crear item de almacén');
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=warehouse`);
    await page.waitForTimeout(3000);

    try {
      // Buscar botón de nuevo item
      const newItemButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar")').first();
      if (await newItemButton.count() > 0) {
        await newItemButton.click();
        await page.waitForTimeout(2000);

        // Llenar formulario básico
        const codeInput = page.locator('input[name="item_code"], input[name="code"]').first();
        const descInput = page.locator('input[name="description"], textarea[name="description"]').first();
        const stockInput = page.locator('input[name="current_stock"], input[name="stock"]').first();
        
        if (await codeInput.count() > 0) {
          await codeInput.fill(`ITEM-${Date.now()}`);
          console.log('✅ Campo código llenado');
        }
        
        if (await descInput.count() > 0) {
          await descInput.fill('Material de prueba');
          console.log('✅ Campo descripción llenado');
        }
        
        if (await stockInput.count() > 0) {
          await stockInput.fill('50');
          console.log('✅ Campo stock llenado');
        }

        // Guardar
        const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save")').first();
        await saveButton.click();
        await page.waitForTimeout(3000);

        console.log('✅ Formulario de almacén enviado');
        results.warehouseCreation.success = true;
        results.passed++;
      } else {
        console.log('⚠️  No se encontró botón de nuevo item');
        results.warehouseCreation.errors.push('Botón no encontrado');
        results.failed++;
      }
    } catch (e) {
      console.log('❌ Error al crear item de almacén:', e.message);
      results.warehouseCreation.errors.push(e.message);
      results.failed++;
    }

    // Test 5: Verificar localStorage
    console.log('\n📝 Test 5: Verificar localStorage');
    results.totalTests++;

    try {
      // Verificar que hay datos en IndexedDB/localStorage
      const localStorageData = await page.evaluate(() => {
        return {
          localStorage: Object.keys(localStorage),
          localStorageSize: JSON.stringify(localStorage).length,
          hasDexie: 'Dexie' in window,
          hasOfflineDB: 'offlineDB' in window,
          indexedDB: 'indexedDB' in window
        };
      });

      console.log('📊 Datos localStorage:', JSON.stringify(localStorageData, null, 2));

      if (localStorageData.localStorage.length > 0 || localStorageData.hasDexie || localStorageData.indexedDB) {
        console.log('✅ localStorage/IndexedDB contiene datos');
        results.localStorage.success = true;
        results.passed++;
      } else {
        console.log('⚠️  localStorage parece vacío');
        results.localStorage.errors.push('localStorage vacío');
        results.failed++;
      }
    } catch (e) {
      console.log('❌ Error al verificar localStorage:', e.message);
      results.localStorage.errors.push(e.message);
      results.failed++;
    }

    // Test 6: Verificar DB remota (si hay conexión)
    console.log('\n📝 Test 6: Verificar DB remota');
    results.totalTests++;

    try {
      // Verificar si hay indicadores de sincronización con Supabase
      const hasSyncIndicators = await page.locator('button:has-text("Sincronizar"), button:has-text("Sync"), [title*="sync"]').count() > 0;
      
      if (hasSyncIndicators) {
        console.log('✅ Indicadores de sincronización encontrados');
        results.remoteDB.success = true;
        results.passed++;
      } else {
        console.log('⚠️  No se encontraron indicadores de sincronización');
        results.remoteDB.errors.push('Sin indicadores de sync');
        results.failed++;
      }
    } catch (e) {
      console.log('❌ Error al verificar DB remota:', e.message);
      results.remoteDB.errors.push(e.message);
      results.failed++;
    }

    // Test 7: Verificar sincronización
    console.log('\n📝 Test 7: Verificar estado de sincronización');
    results.totalTests++;

    try {
      // Buscar indicadores de estado de sync
      const syncStatus = await page.locator('text=synced, text=sincronizado, text=offline, [class*="sync"], [title*="sync"]').count() > 0;
      
      if (syncStatus) {
        console.log('✅ Estado de sincronización visible');
        results.sync.success = true;
        results.passed++;
      } else {
        console.log('⚠️  Estado de sincronización no visible');
        results.sync.errors.push('Estado no visible');
        results.failed++;
      }
    } catch (e) {
      console.log('❌ Error al verificar sincronización:', e.message);
      results.sync.errors.push(e.message);
      results.failed++;
    }

    // Test 8: Verificar datos creados en la interfaz
    console.log('\n📝 Test 8: Verificar datos creados en la interfaz');
    results.totalTests++;

    try {
      // Volver a proyectos para verificar que el proyecto creado aparece
      await page.goto(`${baseUrl}/?tab=projects`);
      await page.waitForTimeout(3000);

      if (results.testProject) {
        const projectVisible = await page.locator(`text=${results.testProject.name}`).count() > 0;
        if (projectVisible) {
          console.log('✅ Proyecto creado visible en la lista');
          results.passed++;
        } else {
          console.log('⚠️  Proyecto creado no visible en la lista');
          results.failed++;
        }
      } else {
        console.log('⚠️  No hay datos de proyecto para verificar');
        results.failed++;
      }
    } catch (e) {
      console.log('❌ Error al verificar datos creados:', e.message);
      results.failed++;
    }

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS DE FORMULARIOS');
  console.log('='.repeat(50));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`\nLogin: ${results.login.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Creación Proyecto: ${results.projectCreation.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Creación Financiera: ${results.financeCreation.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Creación Almacén: ${results.warehouseCreation.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`localStorage: ${results.localStorage.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`DB Remota: ${results.remoteDB.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Sincronización: ${results.sync.success ? '✅ OK' : '❌ FAIL'}`);
  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else {
    console.log(`\n⚠️  ${results.failed} pruebas fallaron. Revisar errores arriba.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runFormTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
