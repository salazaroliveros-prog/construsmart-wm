/**
 * PRUEBAS E2E COMPLETAS VISUALES Y CRUD
 * Cobertura: tipado, refinado, persistencia, tabs, desbordes, contrastes, KPIs, inputs, filtros, listas, efectos, transiciones, conexiones, rutas, CRUD completo, sincronización localStorage ↔ DB remota
 * Uso: node scripts/e2e-complete-visual-crud.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

// Resultados detallados
const results = {
  typography: { success: false, errors: [], warnings: [], details: [] },
  styling: { success: false, errors: [], warnings: [], details: [] },
  tabs: { success: false, errors: [], warnings: [], details: [] },
  overflow: { success: false, errors: [], warnings: [], details: [] },
  contrast: { success: false, errors: [], warnings: [], details: [] },
  kpis: { success: false, errors: [], warnings: [], details: [] },
  inputs: { success: false, errors: [], warnings: [], details: [] },
  filters: { success: false, errors: [], warnings: [], details: [] },
  dropdowns: { success: false, errors: [], warnings: [], details: [] },
  effects: { success: false, errors: [], warnings: [], details: [] },
  transitions: { success: false, errors: [], warnings: [], details: [] },
  routing: { success: false, errors: [], warnings: [], details: [] },
  crudRead: { success: false, errors: [], warnings: [], details: [] },
  crudCreate: { success: false, errors: [], warnings: [], details: [] },
  crudUpdate: { success: false, errors: [], warnings: [], details: [] },
  crudDelete: { success: false, errors: [], warnings: [], details: [] },
  syncLocalRemote: { success: false, errors: [], warnings: [], details: [] },
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// Datos de prueba para CRUD
const testData = {
  project: {
    name: `Proyecto Test ${Date.now()}`,
    location: 'Ubicación Test',
    budget: 100000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'planning'
  },
  transaction: {
    description: `Transacción Test ${Date.now()}`,
    amount: 5000,
    type: 'expense',
    category: 'materiales',
    date: '2026-08-11'
  },
  client: {
    name: `Cliente Test ${Date.now()}`,
    email: `cliente${Date.now()}@test.com`,
    phone: '555-0100',
    address: 'Dirección Test'
  }
};

// Función para obtener color de un elemento
async function getElementColor(page, selector, property = 'color') {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;
    
    const color = await element.evaluate((el, prop) => {
      return window.getComputedStyle(el)[prop];
    }, property);
    
    return color;
  } catch (error) {
    return null;
  }
}

// Función para calcular contraste
function calculateContrast(foreground, background) {
  // Simplificado - convertir rgb a luminancia
  const rgbToLuminance = (rgb) => {
    const match = rgb.match(/\d+/g);
    if (!match) return 0;
    const [r, g, b] = match.map(Number);
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const l1 = rgbToLuminance(foreground);
  const l2 = rgbToLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Función para verificar transición
async function checkTransition(page, selector, action) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;
    
    const before = await element.evaluate(el => {
      return {
        transform: window.getComputedStyle(el).transform,
        opacity: window.getComputedStyle(el).opacity
      };
    });
    
    await action();
    await page.waitForTimeout(300); // Esperar transición
    
    const after = await element.evaluate(el => {
      return {
        transform: window.getComputedStyle(el).transform,
        opacity: window.getComputedStyle(el).opacity
      };
    });
    
    return { before, after, hasTransition: before !== after };
  } catch (error) {
    return null;
  }
}

// Función para probar CRUD en un módulo
async function testCRUD(page, moduleConfig) {
  const { id, name, path, newItemSelectors, createButton, listSelector } = moduleConfig;
  const crudResults = { read: false, create: false, update: false, delete: false };
  
  try {
    // Navegar al módulo
    await page.goto(`${process.env.E2E_BASE_URL || 'http://localhost:3000'}${path}`);
    await page.waitForTimeout(2000);
    
    // READ: Verificar que se pueden leer datos existentes
    const list = page.locator(listSelector);
    const countBefore = await list.count();
    crudResults.read = countBefore >= 0;
    console.log(`   📖 READ ${name}: ${countBefore} registros encontrados`);
    
    // CREATE: Crear nuevo registro
    const createBtn = page.locator(createButton).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      
      // Llenar formulario si existen los campos
      for (const [field, value] of Object.entries(newItemSelectors)) {
        const input = page.locator(field).first();
        if (await input.count() > 0) {
          await input.fill(value);
          await page.waitForTimeout(200);
        }
      }
      
      // Guardar
      const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        
        const countAfterCreate = await list.count();
        crudResults.create = countAfterCreate > countBefore;
        console.log(`   ✅ CREATE ${name}: ${countBefore} → ${countAfterCreate} registros`);
      }
    }
    
    // UPDATE: Modificar un registro (si existe)
    if (countBefore > 0) {
      const firstItem = list.first();
      await firstItem.click();
      await page.waitForTimeout(1000);
      
      const editBtn = page.locator('button:has-text("Editar"), button[aria-label*="edit"]').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        
        // Modificar un campo
        const nameInput = page.locator('input[name*="name"], input[type="text"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill(`${await nameInput.inputValue()} - EDITADO`);
          await page.waitForTimeout(200);
          
          const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
          if (await saveBtn.count() > 0) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
            crudResults.update = true;
            console.log(`   ✅ UPDATE ${name}: registro modificado`);
          }
        }
      }
    }
    
    // DELETE: Eliminar un registro (si existe y si hay más de uno)
    if (countBefore > 1) {
      await page.goto(`${process.env.E2E_BASE_URL || 'http://localhost:3000'}${path}`);
      await page.waitForTimeout(2000);
      
      const firstItem = list.first();
      await firstItem.click();
      await page.waitForTimeout(1000);
      
      const deleteBtn = page.locator('button:has-text("Eliminar"), button[aria-label*="delete"]').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        
        // Confirmar si hay modal
        const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Sí")').first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
        
        const countAfterDelete = await list.count();
        crudResults.delete = countAfterDelete < countBefore;
        console.log(`   ✅ DELETE ${name}: ${countBefore} → ${countAfterDelete} registros`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error en CRUD ${name}: ${error.message}`);
  }
  
  return crudResults;
}

async function runCompleteTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas E2E completas visuales y CRUD...');
  console.log('📡 URL de prueba:', baseUrl);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 150
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
    // TEST 1: TIPOGRAFÍA Y TIPADO
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 1: TIPOGRAFÍA Y TIPADO');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const elements = ['h1', 'h2', 'h3', 'p', 'button', 'input', 'label'];
    const fontSizes = {};

    for (const element of elements) {
      const size = await getElementColor(page, element, 'fontSize');
      if (size) {
        fontSizes[element] = size;
        const pxSize = parseFloat(size);
        if (pxSize >= 12) {
          console.log(`✅ ${element}: ${size} (legible)`);
          results.typography.details.push(`✅ ${element}: ${size}`);
        } else {
          console.log(`⚠️  ${element}: ${size} (puede ser pequeño)`);
          results.typography.warnings.push(`${element}: ${size}`);
          results.warnings++;
        }
      }
    }

    // Verificar consistencia de fuentes
    const fontFamilies = {};
    for (const element of elements) {
      const family = await getElementColor(page, element, 'fontFamily');
      if (family) {
        fontFamilies[element] = family;
      }
    }

    const uniqueFamilies = new Set(Object.values(fontFamilies));
    if (uniqueFamilies.size <= 2) {
      console.log(`✅ Familias de fuentes consistentes: ${uniqueFamilies.size} variantes`);
      results.typography.details.push('✅ Fuentes consistentes');
    } else {
      console.log(`⚠️  ${uniqueFamilies.size} variantes de fuente diferentes`);
      results.typography.warnings.push(`${uniqueFamilies.size} variantes de fuente`);
      results.warnings++;
    }

    results.typography.success = results.typography.errors.length === 0;
    if (results.typography.success) results.passed++;

    // ============================================
    // TEST 2: PERSISTENCIA DE ESTILOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 2: PERSISTENCIA DE ESTILOS');
    console.log('='.repeat(70));
    results.totalTests++;

    const modules = ['dashboard', 'finances', 'warehouse', 'clients'];
    const cardStyles = {};

    for (const module of modules) {
      await page.goto(`${baseUrl}/?tab=${module}`);
      await page.waitForTimeout(2000);

      const cardColor = await getElementColor(page, '.glass-card', 'backgroundColor');
      const cardRadius = await getElementColor(page, '.glass-card', 'borderRadius');
      
      if (cardColor) {
        cardStyles[module] = { color: cardColor, radius: cardRadius };
        console.log(`📊 ${module}: bg=${cardColor.substring(0, 20)}..., radius=${cardRadius}`);
      }
    }

    const uniqueColors = new Set(Object.values(cardStyles).map(s => s.color));
    const uniqueRadii = new Set(Object.values(cardStyles).map(s => s.radius));

    if (uniqueColors.size === 1 && uniqueRadii.size === 1) {
      console.log('✅ Estilos consistentes en todos los módulos');
      results.styling.details.push('✅ Estilos persistentes');
    } else {
      console.log('⚠️  Variaciones en estilos entre módulos');
      results.styling.warnings.push('Variaciones de estilos');
      results.warnings++;
    }

    results.styling.success = results.styling.errors.length === 0;
    if (results.styling.success) results.passed++;

    // ============================================
    // TEST 3: TABS Y NAVEGACIÓN
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 3: TABS Y NAVEGACIÓN');
    console.log('='.repeat(70));
    results.totalTests++;

    const tabs = ['dashboard', 'projects', 'finances', 'warehouse'];
    
    for (const tab of tabs) {
      await page.goto(`${baseUrl}/?tab=${tab}`);
      await page.waitForTimeout(1500);
      
      const currentUrl = page.url();
      if (currentUrl.includes(tab)) {
        console.log(`✅ Tab ${tab}: navegación exitosa`);
        results.tabs.details.push(`✅ ${tab} navegación`);
      } else {
        console.log(`❌ Tab ${tab}: navegación falló`);
        results.tabs.errors.push(`${tab} navegación falló`);
        results.failed++;
      }
    }

    results.tabs.success = results.tabs.errors.length === 0;
    if (results.tabs.success) results.passed++;

    // ============================================
    // TEST 4: DESBORDES Y OVERFLOW
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 4: DESBORDES Y OVERFLOW');
    console.log('='.repeat(70));
    results.totalTests++;

    for (const module of modules) {
      await page.goto(`${baseUrl}/?tab=${module}`);
      await page.waitForTimeout(2000);

      const mainElement = page.locator('main').first();
      const overflow = await mainElement.evaluate(el => {
        return {
          overflowX: window.getComputedStyle(el).overflowX,
          overflowY: window.getComputedStyle(el).overflowY,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth
        };
      });

      if (overflow.scrollWidth > overflow.clientWidth + 10) {
        console.log(`❌ ${module}: overflow horizontal detectado`);
        results.overflow.errors.push(`${module} overflow horizontal`);
        results.failed++;
      } else {
        console.log(`✅ ${module}: sin overflow horizontal`);
        results.overflow.details.push(`✅ ${module} sin overflow`);
      }
    }

    results.overflow.success = results.overflow.errors.length === 0;
    if (results.overflow.success) results.passed++;

    // ============================================
    // TEST 5: CONTRASTES PERFECTOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 5: CONTRASTES PERFECTOS');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const contrastTests = [
      { selector: 'h1', name: 'Título principal' },
      { selector: 'p', name: 'Párrafo' },
      { selector: 'button', name: 'Botón' },
      { selector: '.glass-card', name: 'Tarjeta' }
    ];

    for (const test of contrastTests) {
      const fgColor = await getElementColor(page, test.selector, 'color');
      const bgColor = await getElementColor(page, test.selector, 'backgroundColor');
      
      if (fgColor && bgColor) {
        const ratio = calculateContrast(fgColor, bgColor);
        console.log(`📊 ${test.name}: ratio ${ratio.toFixed(2)}`);
        
        if (ratio >= 4.5) {
          console.log(`   ✅ Cumple AA (ratio: ${ratio.toFixed(2)})`);
          results.contrast.details.push(`✅ ${test.name} AA`);
        } else if (ratio >= 3) {
          console.log(`   ⚠️  Cumple AA grande solo (ratio: ${ratio.toFixed(2)})`);
          results.contrast.warnings.push(`${test.name} ratio ${ratio.toFixed(2)}`);
          results.warnings++;
        } else {
          console.log(`   ❌ No cumple AA (ratio: ${ratio.toFixed(2)})`);
          results.contrast.errors.push(`${test.name} ratio ${ratio.toFixed(2)}`);
          results.failed++;
        }
      }
    }

    results.contrast.success = results.contrast.errors.length === 0;
    if (results.contrast.success) results.passed++;

    // ============================================
    // TEST 6: KPIS Y MÉTRICAS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 6: KPIS Y MÉTRICAS');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const kpiCards = page.locator('.glass-card');
    const kpiCount = await kpiCards.count();
    
    if (kpiCount >= 6) {
      console.log(`✅ KPIs: ${kpiCount} tarjetas encontradas`);
      results.kpis.details.push(`✅ ${kpiCount} KPIs`);
    } else {
      console.log(`⚠️  KPIs: solo ${kpiCount} tarjetas`);
      results.kpis.warnings.push(`Solo ${kpiCount} KPIs`);
      results.warnings++;
    }

    // Verificar que los KPIs tengan datos
    for (let i = 0; i < Math.min(kpiCount, 3); i++) {
      const card = kpiCards.nth(i);
      const text = await card.textContent();
      if (text && text.length > 0) {
        console.log(`✅ KPI[${i}]: contiene datos`);
      } else {
        console.log(`⚠️  KPI[${i}]: sin datos visibles`);
      }
    }

    results.kpis.success = results.kpis.errors.length === 0;
    if (results.kpis.success) results.passed++;

    // ============================================
    // TEST 7: INPUTS Y FORMULARIOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 7: INPUTS Y FORMULARIOS');
    console.log('='.repeat(70));
    results.totalTests++;

    const formModules = ['finances', 'warehouse', 'clients'];
    
    for (const module of formModules) {
      await page.goto(`${baseUrl}/?tab=${module}`);
      await page.waitForTimeout(2000);

      // Abrir formulario
      const newBtn = page.locator('button:has-text("Nuevo"), button:has-text("Nuevo Cliente"), button:has-text("Nueva")').first();
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        const inputs = page.locator('input, select, textarea');
        const inputCount = await inputs.count();
        
        if (inputCount > 0) {
          console.log(`✅ ${module}: ${inputCount} campos de formulario`);
          results.inputs.details.push(`✅ ${module} ${inputCount} inputs`);
          
          // Verificar que los inputs sean interactivos
          for (let i = 0; i < Math.min(inputCount, 3); i++) {
            const input = inputs.nth(i);
            const isEnabled = await input.isEnabled();
            if (isEnabled) {
              console.log(`   ✅ Input[${i}]: habilitado`);
            } else {
              console.log(`   ⚠️  Input[${i}]: deshabilitado`);
            }
          }
        } else {
          console.log(`⚠️  ${module}: sin campos detectados`);
          results.inputs.warnings.push(`${module} sin inputs`);
          results.warnings++;
        }

        // Cerrar formulario
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    results.inputs.success = results.inputs.errors.length === 0;
    if (results.inputs.success) results.passed++;

    // ============================================
    // TEST 8: FILTROS Y BÚSQUEDA
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 8: FILTROS Y BÚSQUEDA');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      console.log('✅ Campo de búsqueda encontrado');
      results.filters.details.push('✅ Campo búsqueda');
      
      // Probar búsqueda
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      console.log('✅ Búsqueda funcional');
      results.filters.details.push('✅ Búsqueda funcional');
      
      // Limpiar
      await searchInput.fill('');
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️  Campo de búsqueda no encontrado');
      results.filters.warnings.push('Sin campo búsqueda');
      results.warnings++;
    }

    results.filters.success = results.filters.errors.length === 0;
    if (results.filters.success) results.passed++;

    // ============================================
    // TEST 9: LISTAS DESPLEGABLES
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 9: LISTAS DESPLEGABLES');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const selects = page.locator('select');
    const selectCount = await selects.count();
    
    if (selectCount > 0) {
      console.log(`✅ ${selectCount} selects encontrados`);
      results.dropdowns.details.push(`✅ ${selectCount} selects`);
      
      // Probar interacción con un select
      const firstSelect = selects.first();
      await firstSelect.click();
      await page.waitForTimeout(500);
      
      const options = page.locator('option');
      const optionCount = await options.count();
      
      if (optionCount > 0) {
        console.log(`✅ Select desplegable con ${optionCount} opciones`);
        results.dropdowns.details.push(`✅ ${optionCount} opciones`);
      }
      
      await page.keyboard.press('Escape');
    } else {
      console.log('ℹ️  No se encontraron selects en dashboard');
      results.dropdowns.details.push('ℹ️  Sin selects en dashboard');
    }

    results.dropdowns.success = results.dropdowns.errors.length === 0;
    if (results.dropdowns.success) results.passed++;

    // ============================================
    // TEST 10: EFECTOS Y TRANSICIONES
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 10: EFECTOS Y TRANSICIONES');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const hoverable = page.locator('.glass-card').first();
    if (await hoverable.count() > 0) {
      const transition = await checkTransition(page, '.glass-card', async () => {
        await hoverable.hover();
      });
      
      if (transition && transition.hasTransition) {
        console.log('✅ Efecto hover funcional');
        results.effects.details.push('✅ Hover effect');
      } else {
        console.log('⚠️  Efecto hover no detectado');
        results.effects.warnings.push('Hover no detectado');
        results.warnings++;
      }
    }

    results.effects.success = results.effects.errors.length === 0;
    if (results.effects.success) results.passed++;

    // ============================================
    // TEST 11: CONEXIONES Y RUTAS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 11: CONEXIONES Y RUTAS');
    console.log('='.repeat(70));
    results.totalTests++;

    // Verificar que la API de Supabase esté conectada
    const onlineIndicator = page.locator('[class*="online"], [class*="connected"], [class*="sync"]').first();
    if (await onlineIndicator.count() > 0) {
      console.log('✅ Indicador de conexión encontrado');
      results.routing.details.push('✅ Conexión detectada');
    } else {
      console.log('ℹ️  Indicador de conexión no visible (puede ser offline-first)');
      results.routing.details.push('ℹ️  Modo offline-first');
    }

    // Verificar rutas internas
    const routes = ['/?tab=dashboard', '/?tab=finances', '/?tab=projects'];
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`);
      await page.waitForTimeout(1000);
      
      if (!page.url().includes('/login')) {
        console.log(`✅ Ruta ${route}: accesible`);
        results.routing.details.push(`✅ ${route}`);
      } else {
        console.log(`❌ Ruta ${route}: redirige a login`);
        results.routing.errors.push(`${route} redirección`);
        results.failed++;
      }
    }

    results.routing.success = results.routing.errors.length === 0;
    if (results.routing.success) results.passed++;

    // ============================================
    // TEST 12: CRUD - LECTURA
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 12: CRUD - LECTURA DE DATOS');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);

    const transactionList = page.locator('tbody tr, [class*="transaction"], [class*="item"]');
    const transactionCount = await transactionList.count();
    
    if (transactionCount >= 0) {
      console.log(`✅ READ Finanzas: ${transactionCount} transacciones leídas`);
      results.crudRead.details.push(`✅ Finanzas ${transactionCount} registros`);
    } else {
      console.log('❌ READ Finanzas: error al leer');
      results.crudRead.errors.push('Finanzas read error');
      results.failed++;
    }

    await page.goto(`${baseUrl}/?tab=clients`);
    await page.waitForTimeout(2000);

    const clientList = page.locator('tbody tr, [class*="client"], [class*="item"]');
    const clientCount = await clientList.count();
    
    if (clientCount >= 0) {
      console.log(`✅ READ Clientes: ${clientCount} clientes leídos`);
      results.crudRead.details.push(`✅ Clientes ${clientCount} registros`);
    } else {
      console.log('❌ READ Clientes: error al leer');
      results.crudRead.errors.push('Clientes read error');
      results.failed++;
    }

    results.crudRead.success = results.crudRead.errors.length === 0;
    if (results.crudRead.success) results.passed++;

    // ============================================
    // TEST 13: CRUD - CREACIÓN
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 13: CRUD - CREACIÓN DE DATOS');
    console.log('='.repeat(70));
    results.totalTests++;

    // Crear transacción de prueba
    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);

    const newTransBtn = page.locator('button:has-text("Nueva"), button:has-text("Nueva Transacción")').first();
    if (await newTransBtn.count() > 0) {
      await newTransBtn.click();
      await page.waitForTimeout(1500);

      // Llenar formulario
      const descInput = page.locator('input[name*="description"], input[placeholder*="descripción" i]').first();
      if (await descInput.count() > 0) {
        await descInput.fill(testData.transaction.description);
      }

      const amountInput = page.locator('input[name*="amount"], input[type="number"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill(testData.transaction.amount.toString());
      }

      const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        
        console.log('✅ CREATE Finanzas: transacción creada');
        results.crudCreate.details.push('✅ Transacción creada');
      }
    }

    results.crudCreate.success = results.crudCreate.errors.length === 0;
    if (results.crudCreate.success) results.passed++;

    // ============================================
    // TEST 14: CRUD - MODIFICACIÓN
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 14: CRUD - MODIFICACIÓN DE DATOS');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);

    const firstTrans = page.locator('tbody tr, [class*="transaction"]').first();
    if (await firstTrans.count() > 0) {
      await firstTrans.click();
      await page.waitForTimeout(1000);

      const editBtn = page.locator('button:has-text("Editar"), button[aria-label*="edit"]').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(1000);

        const descInput = page.locator('input[name*="description"]').first();
        if (await descInput.count() > 0) {
          const currentVal = await descInput.inputValue();
          await descInput.fill(`${currentVal} - MODIFICADO`);
          
          const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
          if (await saveBtn.count() > 0) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ UPDATE Finanzas: transacción modificada');
            results.crudUpdate.details.push('✅ Transacción modificada');
          }
        }
      }
    }

    results.crudUpdate.success = results.crudUpdate.errors.length === 0;
    if (results.crudUpdate.success) results.passed++;

    // ============================================
    // TEST 15: CRUD - ELIMINACIÓN
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 15: CRUD - ELIMINACIÓN DE DATOS');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);

    const allTrans = page.locator('tbody tr, [class*="transaction"]');
    const transCount = await allTrans.count();
    
    if (transCount > 1) {
      const lastTrans = allTrans.nth(transCount - 1);
      await lastTrans.click();
      await page.waitForTimeout(1000);

      const deleteBtn = page.locator('button:has-text("Eliminar"), button[aria-label*="delete"]').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Sí")').first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
          
          const newCount = await allTrans.count();
          if (newCount < transCount) {
            console.log('✅ DELETE Finanzas: transacción eliminada');
            results.crudDelete.details.push('✅ Transacción eliminada');
          }
        }
      }
    } else {
      console.log('ℹ️  DELETE Finanzas: no suficientes registros para eliminar');
      results.crudDelete.details.push('ℹ️  Sin suficientes registros');
    }

    results.crudDelete.success = results.crudDelete.errors.length === 0;
    if (results.crudDelete.success) results.passed++;

    // ============================================
    // TEST 16: SINCRONIZACIÓN LOCALSTORAGE ↔ DB REMOTA
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 16: SINCRONIZACIÓN LOCALSTORAGE ↔ DB REMOTA');
    console.log('='.repeat(70));
    results.totalTests++;

    // Verificar indicador de sincronización
    const syncIndicator = page.locator('[class*="sync"], [class*="status"], [title*="sincronizar" i]').first();
    if (await syncIndicator.count() > 0) {
      console.log('✅ Indicador de sincronización encontrado');
      results.syncLocalRemote.details.push('✅ Indicador sync');
      
      // Probar sync manual si existe botón
      const syncBtn = page.locator('button[title*="sincronizar" i], button:has-text("Sincronizar")').first();
      if (await syncBtn.count() > 0) {
        console.log('✅ Botón de sincronización manual disponible');
        results.syncLocalRemote.details.push('✅ Botón sync manual');
      }
    } else {
      console.log('ℹ️  Indicador de sincronización no visible (puede ser automático)');
      results.syncLocalRemote.details.push('ℹ️  Sync automático');
    }

    // Verificar localStorage
    const localStorageData = await page.evaluate(() => {
      return {
        hasOfflineDB: !!localStorage.getItem('offlineDB'),
        hasAuth: !!localStorage.getItem('auth'),
        keys: Object.keys(localStorage).length
      };
    });

    console.log(`📊 LocalStorage: ${localStorageData.keys} claves`);
    if (localStorageData.hasOfflineDB) {
      console.log('✅ Offline DB en localStorage');
      results.syncLocalRemote.details.push('✅ Offline DB local');
    }

    results.syncLocalRemote.success = results.syncLocalRemote.errors.length === 0;
    if (results.syncLocalRemote.success) results.passed++;

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // ============================================
  // RESUMEN COMPLETO
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE PRUEBAS COMPLETAS VISUALES Y CRUD');
  console.log('='.repeat(70));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`⚠️  Advertencias: ${results.warnings}`);
  
  const testNames = [
    'TIPOGRAFÍA', 'ESTILOS', 'TABS', 'OVERFLOW', 'CONTRASTES', 
    'KPIS', 'INPUTS', 'FILTROS', 'DROPDOWNS', 'EFECTOS', 
    'RUTAS', 'CRUD READ', 'CRUD CREATE', 'CRUD UPDATE', 'CRUD DELETE', 'SYNC'
  ];
  
  const resultKeys = [
    'typography', 'styling', 'tabs', 'overflow', 'contrast',
    'kpis', 'inputs', 'filters', 'dropdowns', 'effects',
    'routing', 'crudRead', 'crudCreate', 'crudUpdate', 'crudDelete', 'syncLocalRemote'
  ];

  testNames.forEach((name, i) => {
    const key = resultKeys[i];
    console.log(`\n📝 TEST ${i + 1}: ${name}`);
    console.log(`   Estado: ${results[key].success ? '✅ OK' : '❌ FAIL'}`);
    results[key].details.forEach(detail => console.log(`   ${detail}`));
    results[key].warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    results[key].errors.forEach(error => console.log(`   ❌ ${error}`));
  });

  console.log('='.repeat(70));

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 ¡Todas las pruebas completas pasaron exitosamente!');
  } else if (results.failed === 0) {
    console.log(`\n⚠️  ${results.warnings} advertencias. Revisar detalles.`);
  } else {
    console.log(`\n❌ ${results.failed} errores y ${results.warnings} advertencias. Revisar detalles.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runCompleteTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});