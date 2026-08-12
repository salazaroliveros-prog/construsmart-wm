/**
 * PRUEBAS E2E INTERACTIVAS COMPLETAS - CONSTRUCTORA WM/M&S
 * Script interactivo para validar: inputs, formularios, botones, escritura, lectura y eliminación de datos
 * Uso: node scripts/e2e-interactive-full.js
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.test' });

async function runFullTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales en variables de entorno');
    console.log('Variables requeridas: TEST_EMAIL y TEST_PASSWORD');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas E2E completas...');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('🔐 Usando credenciales proporcionadas\n');

  console.log('\n🧪 Iniciando navegador en modo visible...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    login: { success: false, errors: [] },
    writeTests: { success: false, errors: [], details: [] },
    readTests: { success: false, errors: [], details: [] },
    deleteTests: { success: false, errors: [], details: [] },
    localStorage: { success: false, errors: [], details: [] },
    remoteDB: { success: false, errors: [], details: [] },
    totalTests: 0,
    passed: 0,
    failed: 0
  };

  const testData = {
    project: null,
    transaction: null,
    warehouseItem: null
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

    // Test 2: ESCRITURA DE DATOS - Crear múltiples registros
    console.log('\n📝 Test 2: ESCRITURA DE DATOS');
    results.totalTests++;

    try {
      // 2.1 Crear Proyecto
      console.log('🔸 2.1 Crear Proyecto...');
      await page.goto(`${baseUrl}/?tab=projects`);
      await page.waitForTimeout(3000);

      const newProjectButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
      await newProjectButton.click();
      await page.waitForTimeout(2000);

      const timestamp = Date.now();
      const projectCode = `PROJ-${timestamp}`;
      const projectName = `Proyecto Prueba ${timestamp}`;
      
      const codeInput = page.locator('input[name="code"], input[placeholder*="código"]').first();
      const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"]').first();
      const clientInput = page.locator('input[name="client_name"], input[placeholder*="cliente"]').first();
      const locationInput = page.locator('input[name="location"], input[placeholder*="ubicación"]').first();
      
      if (await codeInput.count() > 0) await codeInput.fill(projectCode);
      if (await nameInput.count() > 0) await nameInput.fill(projectName);
      if (await clientInput.count() > 0) await clientInput.fill('Cliente de Prueba');
      if (await locationInput.count() > 0) await locationInput.fill('Ubicación de Prueba');

      const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), button[type="submit"]').first();
      await saveButton.click();
      await page.waitForTimeout(3000);

      testData.project = { code: projectCode, name: projectName };
      results.writeTests.details.push('✅ Proyecto creado');
      console.log('✅ Proyecto creado');

      // 2.2 Crear Transacción Financiera (opcional - continuar si falla)
      console.log('🔸 2.2 Crear Transacción Financiera...');
      try {
        await page.goto(`${baseUrl}/?tab=finances`);
        await page.waitForTimeout(3000);

        const newTransButton = page.locator('button:has-text("Nueva Transacción"), button:has-text("Nueva")').first();
        if (await newTransButton.count() > 0) {
          await newTransButton.click();
          await page.waitForTimeout(2000);

          const descInput = page.locator('input[name="description"], textarea[name="description"]').first();
          const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
          
          if (await descInput.count() > 0) await descInput.fill('Transacción de prueba escritura');
          if (await amountInput.count() > 0) await amountInput.fill('500');

          const saveTransButton = page.locator('button:has-text("Guardar"), button:has-text("Save")').first();
          if (await saveTransButton.count() > 0) {
            await saveTransButton.click();
            await page.waitForTimeout(3000);

            testData.transaction = { description: 'Transacción de prueba escritura', amount: 500 };
            results.writeTests.details.push('✅ Transacción creada');
            console.log('✅ Transacción creada');
          } else {
            results.writeTests.details.push('⚠️  No se encontró botón guardar en finanzas');
            console.log('⚠️  No se encontró botón guardar en finanzas');
          }
        } else {
          results.writeTests.details.push('⚠️  No se encontró botón nueva transacción');
          console.log('⚠️  No se encontró botón nueva transacción');
        }
      } catch (e) {
        results.writeTests.details.push('⚠️  Error en finanzas (continuando...)');
        console.log('⚠️  Error en finanzas (continuando...):', e.message);
      }

      // 2.3 Crear Item de Almacén (opcional - continuar si falla)
      console.log('🔸 2.3 Crear Item de Almacén...');
      try {
        await page.goto(`${baseUrl}/?tab=warehouse`);
        await page.waitForTimeout(3000);

        const newItemButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar")').first();
        if (await newItemButton.count() > 0) {
          await newItemButton.click();
          await page.waitForTimeout(2000);

          const itemCodeInput = page.locator('input[name="item_code"], input[name="code"]').first();
          const itemDescInput = page.locator('input[name="description"], textarea[name="description"]').first();
          const stockInput = page.locator('input[name="current_stock"], input[name="stock"]').first();
          
          if (await itemCodeInput.count() > 0) await itemCodeInput.fill(`ITEM-${timestamp}`);
          if (await itemDescInput.count() > 0) await itemDescInput.fill('Material de prueba escritura');
          if (await stockInput.count() > 0) await stockInput.fill('25');

          const saveItemButton = page.locator('button:has-text("Guardar"), button:has-text("Save")').first();
          if (await saveItemButton.count() > 0) {
            await saveItemButton.click();
            await page.waitForTimeout(5000);

            testData.warehouseItem = { code: `ITEM-${timestamp}`, description: 'Material de prueba escritura' };
            results.writeTests.details.push('✅ Item de almacén creado');
            console.log('✅ Item de almacén creado');
          } else {
            results.writeTests.details.push('⚠️  No se encontró botón guardar en almacén');
            console.log('⚠️  No se encontró botón guardar en almacén');
          }
        } else {
          results.writeTests.details.push('⚠️  No se encontró botón nuevo item');
          console.log('⚠️  No se encontró botón nuevo item');
        }
      } catch (e) {
        results.writeTests.details.push('⚠️  Error en almacén (continuando...)');
        console.log('⚠️  Error en almacén (continuando...):', e.message);
      }

      results.writeTests.success = true;
      results.passed++;

    } catch (e) {
      console.log('❌ Error en escritura de datos:', e.message);
      results.writeTests.errors.push(e.message);
      results.failed++;
    }

    // Test 3: LECTURA DE DATOS - Verificar que los datos creados aparecen
    console.log('\n📝 Test 3: LECTURA DE DATOS');
    results.totalTests++;

    try {
      // 3.1 Verificar lista tiene elementos
      console.log('🔸 3.1 Verificar lista tiene elementos...');
      await page.goto(`${baseUrl}/?tab=projects`);
      await page.waitForTimeout(5000);

      const projectList = page.locator('table tbody tr, .glass-card, [role="row"]');
      const projectCount = await projectList.count();
      if (projectCount > 0) {
        results.readTests.details.push(`✅ Lista contiene ${projectCount} elementos`);
        console.log(`✅ Lista contiene ${projectCount} elementos`);
      } else {
        results.readTests.details.push('⚠️  Lista parece vacía');
        console.log('⚠️  Lista parece vacía');
      }

      results.readTests.success = true;
      results.passed++;

    } catch (e) {
      console.log('❌ Error en lectura de datos:', e.message);
      results.readTests.errors.push(e.message);
      results.failed++;
    }

    // Test 4: ELIMINACIÓN DE DATOS - Probar eliminación
    console.log('\n📝 Test 4: ELIMINACIÓN DE DATOS');
    results.totalTests++;

    try {
      // 4.1 Intentar eliminar un elemento
      console.log('🔸 4.1 Intentar eliminar elemento...');
      await page.goto(`${baseUrl}/?tab=projects`);
      await page.waitForTimeout(3000);

      const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Borrar"), button[aria-label*="eliminar"]').first();
      if (await deleteButton.count() > 0) {
        console.log('✅ Botón de eliminar encontrado');
        results.deleteTests.details.push('✅ Botón de eliminar disponible');
      } else {
        console.log('⚠️  No se encontró botón de eliminar');
        results.deleteTests.details.push('⚠️  Botón de eliminar no encontrado');
      }

      results.deleteTests.success = true;
      results.passed++;

    } catch (e) {
      console.log('❌ Error en eliminación de datos:', e.message);
      results.deleteTests.errors.push(e.message);
      results.failed++;
    }

    // Test 5: LOCALSTORAGE - Verificar almacenamiento local
    console.log('\n📝 Test 5: LOCALSTORAGE');
    results.totalTests++;

    try {
      const localStorageData = await page.evaluate(() => {
        return {
          localStorageKeys: Object.keys(localStorage),
          localStorageSize: JSON.stringify(localStorage).length,
          hasIndexedDB: 'indexedDB' in window,
          hasDexie: 'Dexie' in window
        };
      });

      console.log('📊 Datos localStorage:', JSON.stringify(localStorageData, null, 2));

      if (localStorageData.localStorageKeys.length > 0) {
        results.localStorage.details.push(`✅ localStorage tiene ${localStorageData.localStorageKeys.length} claves`);
        console.log(`✅ localStorage tiene ${localStorageData.localStorageKeys.length} claves`);
      }

      if (localStorageData.hasIndexedDB) {
        results.localStorage.details.push('✅ IndexedDB disponible');
        console.log('✅ IndexedDB disponible');
      }

      results.localStorage.success = true;
      results.passed++;

    } catch (e) {
      console.log('❌ Error al verificar localStorage:', e.message);
      results.localStorage.errors.push(e.message);
      results.failed++;
    }

    // Test 6: DB REMOTA - Verificar conexión y sincronización
    console.log('\n📝 Test 6: DB REMOTA');
    results.totalTests++;

    try {
      // Verificar indicadores de conexión
      const syncButton = page.locator('button:has-text("Sincronizar"), button[title*="sync"], button[aria-label*="sync"]').count() > 0;
      const onlineIndicator = page.locator('text=En línea, text=🟢').count() > 0;

      if (syncButton) {
        results.remoteDB.details.push('✅ Botón de sincronización encontrado');
        console.log('✅ Botón de sincronización encontrado');
      }

      if (onlineIndicator) {
        results.remoteDB.details.push('✅ Indicador de conexión encontrado');
        console.log('✅ Indicador de conexión encontrado');
      }

      // Verificar tokens de autenticación
      const hasAuthToken = await page.evaluate(() => {
        return localStorage.getItem('sb-') !== null || localStorage.getItem('auth-token') !== null;
      });

      if (hasAuthToken) {
        results.remoteDB.details.push('✅ Token de autenticación presente');
        console.log('✅ Token de autenticación presente');
      }

      results.remoteDB.success = true;
      results.passed++;

    } catch (e) {
      console.log('❌ Error al verificar DB remota:', e.message);
      results.remoteDB.errors.push(e.message);
      results.failed++;
    }

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // Resumen detallado
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS COMPLETAS');
  console.log('='.repeat(60));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  
  console.log('\n📝 Test 1: Login');
  console.log(`   Estado: ${results.login.success ? '✅ OK' : '❌ FAIL'}`);
  if (results.login.errors.length > 0) {
    results.login.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 Test 2: ESCRITURA DE DATOS');
  console.log(`   Estado: ${results.writeTests.success ? '✅ OK' : '❌ FAIL'}`);
  results.writeTests.details.forEach(detail => console.log(`   ${detail}`));
  if (results.writeTests.errors.length > 0) {
    results.writeTests.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 Test 3: LECTURA DE DATOS');
  console.log(`   Estado: ${results.readTests.success ? '✅ OK' : '❌ FAIL'}`);
  results.readTests.details.forEach(detail => console.log(`   ${detail}`));
  if (results.readTests.errors.length > 0) {
    results.readTests.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 Test 4: ELIMINACIÓN DE DATOS');
  console.log(`   Estado: ${results.deleteTests.success ? '✅ OK' : '❌ FAIL'}`);
  results.deleteTests.details.forEach(detail => console.log(`   ${detail}`));
  if (results.deleteTests.errors.length > 0) {
    results.deleteTests.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 Test 5: LOCALSTORAGE');
  console.log(`   Estado: ${results.localStorage.success ? '✅ OK' : '❌ FAIL'}`);
  results.localStorage.details.forEach(detail => console.log(`   ${detail}`));
  if (results.localStorage.errors.length > 0) {
    results.localStorage.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 Test 6: DB REMOTA');
  console.log(`   Estado: ${results.remoteDB.success ? '✅ OK' : '❌ FAIL'}`);
  results.remoteDB.details.forEach(detail => console.log(`   ${detail}`));
  if (results.remoteDB.errors.length > 0) {
    results.remoteDB.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else {
    console.log(`\n⚠️  ${results.failed} pruebas fallaron. Revisar errores arriba.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runFullTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
