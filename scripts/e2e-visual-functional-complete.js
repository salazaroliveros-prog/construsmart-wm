/**
 * PRUEBAS E2E COMPLETAS VISUALES Y FUNCIONALES - CONSTRUCTORA WM/M&S
 * Script interactivo para validar: login, navegación, formularios, botones, UI/UX y contraste
 * Uso: node scripts/e2e-visual-functional-complete.js
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.test' });

// Configuración de módulos a probar
const MODULES = [
  { id: 'dashboard', name: 'Dashboard', path: '/?tab=dashboard' },
  { id: 'projects', name: 'Proyectos', path: '/?tab=projects' },
  { id: 'budgets', name: 'Presupuestos', path: '/?tab=budgets' },
  { id: 'progress', name: 'Seguimiento', path: '/?tab=progress' },
  { id: 'finances', name: 'Finanzas', path: '/?tab=finances' },
  { id: 'payroll', name: 'Nómina', path: '/?tab=payroll' },
  { id: 'warehouse', name: 'Almacén', path: '/?tab=warehouse' },
  { id: 'suppliers', name: 'Proveedores', path: '/?tab=suppliers' },
  { id: 'orders', name: 'Órdenes de Compra', path: '/?tab=orders' },
  { id: 'subcontractors', name: 'Subcontratistas', path: '/?tab=subcontractors' },
  { id: 'clients', name: 'Clientes', path: '/?tab=clients' },
  { id: 'logs', name: 'Bitácora', path: '/?tab=logs' },
  { id: 'analytics', name: 'Analíticas', path: '/?tab=analytics' },
  { id: 'settings', name: 'Configuración', path: '/?tab=settings' }
];

// Resultados de pruebas
const results = {
  login: { success: false, errors: [], visualIssues: [] },
  navigation: { success: false, errors: [], details: [] },
  forms: { success: false, errors: [], details: [] },
  buttons: { success: false, errors: [], details: [] },
  visualConsistency: { success: false, errors: [], details: [] },
  contrast: { success: false, errors: [], details: [] },
  responsiveness: { success: false, errors: [], details: [] },
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// Función para verificar contraste de color (según WCAG AA)
function checkContrast(foreground, background) {
  // Función auxiliar para convertir hex a RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Función para calcular luminancia relativa
  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return { ratio: 0, passesAA: false, passesAAA: false };

  const fgLuminance = getLuminance(fg.r, fg.g, fg.b);
  const bgLuminance = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: contrastRatio.toFixed(2),
    passesAA: contrastRatio >= 4.5,
    passesAAA: contrastRatio >= 7
  };
}

// Función para extraer colores de elementos
async function getElementColors(page, selector) {
  try {
    const element = await page.locator(selector).first();
    if (await element.count() === 0) return null;

    const styles = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight
      };
    });

    return styles;
  } catch (error) {
    return null;
  }
}

// Función para convertir RGB a Hex
function rgbToHex(rgb) {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null;
  
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) return null;

  const hex = (x) => ('0' + parseInt(x).toString(16)).slice(-2);
  return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`;
}

async function runCompleteTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales en variables de entorno');
    console.log('Variables requeridas: TEST_EMAIL y TEST_PASSWORD');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas E2E completas visuales y funcionales...');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('🔐 Usando credenciales proporcionadas\n');

  console.log('\n🧪 Iniciando navegador en modo visible...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ============================================
    // TEST 1: LOGIN
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 1: LOGIN');
    console.log('='.repeat(60));
    results.totalTests++;

    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);

    // Verificar elementos visuales del login
    const loginTitle = await page.locator('h1').first();
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    // Verificar contraste de elementos del login
    const titleColors = await getElementColors(page, 'h1');
    if (titleColors) {
      const titleFg = rgbToHex(titleColors.color);
      const titleBg = rgbToHex(titleColors.backgroundColor) || '#0f172a'; // slate-900
      if (titleFg) {
        const contrast = checkContrast(titleFg, titleBg);
        if (!contrast.passesAA) {
          results.login.visualIssues.push(`Título de login no cumple contraste AA (ratio: ${contrast.ratio})`);
          results.warnings++;
        } else {
          console.log(`✅ Título de login cumple contraste AA (ratio: ${contrast.ratio})`);
        }
      }
    }

    // Verificar campos de formulario
    if (await emailInput.count() > 0) {
      console.log('✅ Campo email encontrado');
      await emailInput.fill(email);
    } else {
      results.login.errors.push('Campo email no encontrado');
      results.failed++;
    }

    if (await passwordInput.count() > 0) {
      console.log('✅ Campo contraseña encontrado');
      await passwordInput.fill(password);
    } else {
      results.login.errors.push('Campo contraseña no encontrado');
      results.failed++;
    }

    if (await submitButton.count() > 0) {
      console.log('✅ Botón submit encontrado');
      await submitButton.click();
    } else {
      results.login.errors.push('Botón submit no encontrado');
      results.failed++;
    }

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

    // ============================================
    // TEST 2: NAVEGACIÓN POR MÓDULOS
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 2: NAVEGACIÓN POR MÓDULOS');
    console.log('='.repeat(60));
    results.totalTests++;

    for (const module of MODULES) {
      console.log(`\n🔸 Probando módulo: ${module.name}`);
      
      try {
        await page.goto(`${baseUrl}${module.path}`);
        await page.waitForTimeout(3000);

        // Verificar que la página cargó
        const currentUrl = page.url();
        if (currentUrl.includes(module.id)) {
          console.log(`✅ Módulo ${module.name} cargado correctamente`);
          results.navigation.details.push(`✅ ${module.name}: navegación exitosa`);
        } else {
          console.log(`⚠️  Módulo ${module.name} no navegó correctamente`);
          results.navigation.errors.push(`${module.name}: error de navegación`);
          results.warnings++;
        }

        // Verificar elementos visuales del módulo
        const moduleTitle = await page.locator('h1, h2').first();
        if (await moduleTitle.count() > 0) {
          const titleText = await moduleTitle.textContent();
          console.log(`   📄 Título: ${titleText}`);
        }

        // Verificar si hay contenido visible
        const contentArea = await page.locator('main, .glass-panel, .glass-card').first();
        if (await contentArea.count() > 0) {
          console.log(`   ✅ Área de contenido visible`);
        } else {
          console.log(`   ⚠️  No se encontró área de contenido`);
          results.navigation.errors.push(`${module.name}: sin área de contenido visible`);
        }

      } catch (error) {
        console.log(`❌ Error al navegar a ${module.name}:`, error.message);
        results.navigation.errors.push(`${module.name}: ${error.message}`);
        results.failed++;
      }
    }

    results.navigation.success = results.navigation.errors.length === 0;
    if (results.navigation.success) {
      results.passed++;
    }

    // ============================================
    // TEST 3: FORMULARIOS DE CADA MÓDULO
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 3: FORMULARIOS DE CADA MÓDULO');
    console.log('='.repeat(60));
    results.totalTests++;

    const formModules = [
      { id: 'projects', name: 'Proyectos', buttonSelector: 'button:has-text("Nuevo"), button:has-text("Crear")' },
      { id: 'finances', name: 'Finanzas', buttonSelector: 'button:has-text("Nueva Transacción"), button:has-text("Nueva")' },
      { id: 'warehouse', name: 'Almacén', buttonSelector: 'button:has-text("Nuevo"), button:has-text("Agregar")' },
      { id: 'payroll', name: 'Nómina', buttonSelector: 'button:has-text("Nuevo"), button:has-text("Agregar")' },
      { id: 'clients', name: 'Clientes', buttonSelector: 'button:has-text("Nuevo Cliente")' },
      { id: 'suppliers', name: 'Proveedores', buttonSelector: 'button:has-text("Nuevo Proveedor")' }
    ];

    for (const module of formModules) {
      console.log(`\n🔸 Probando formulario de: ${module.name}`);
      
      try {
        await page.goto(`${baseUrl}/?tab=${module.id}`);
        await page.waitForTimeout(3000);

        // Buscar botón de crear nuevo
        const newButton = page.locator(module.buttonSelector).first();
        if (await newButton.count() > 0) {
          console.log(`   ✅ Botón "Nuevo" encontrado en ${module.name}`);
          results.forms.details.push(`✅ ${module.name}: botón nuevo encontrado`);

          // Intentar abrir el formulario
          await newButton.click();
          await page.waitForTimeout(2000);

          // Verificar que se abrió el modal/formulario - esperar más tiempo y verificar múltiples selectores
          await page.waitForTimeout(1000);
          const modal = page.locator('.modal-backdrop, dialog, [role="dialog"]').first();
          const form = page.locator('form').first();
          const glassPanel = page.locator('.glass-panel').first();

          const modalCount = await modal.count();
          const formCount = await form.count();
          const glassPanelCount = await glassPanel.count();

          if (modalCount > 0 || formCount > 0 || glassPanelCount > 0) {
            console.log(`   ✅ Formulario/Modal abierto en ${module.name}`);
            results.forms.details.push(`✅ ${module.name}: formulario abierto`);

            // Verificar campos del formulario
            const inputs = page.locator('input, select, textarea');
            const inputCount = await inputs.count();
            console.log(`   📝 ${inputCount} campos encontrados en el formulario`);

            if (inputCount > 0) {
              // Verificar contraste de labels
              const labels = page.locator('label');
              for (let i = 0; i < Math.min(await labels.count(), 5); i++) {
                const label = labels.nth(i);
                const labelColors = await getElementColors(page, `label >> nth=${i}`);
                if (labelColors && labelColors.color) {
                  const labelFg = rgbToHex(labelColors.color);
                  const labelBg = rgbToHex(labelColors.backgroundColor) || '#1e293b'; // slate-800
                  if (labelFg) {
                    const contrast = checkContrast(labelFg, labelBg);
                    if (!contrast.passesAA) {
                      results.contrast.details.push(`⚠️  ${module.name}: label no cumple contraste AA (ratio: ${contrast.ratio})`);
                      results.warnings++;
                    }
                  }
                }
              }

              // Cerrar el formulario si está abierto
              const closeButton = page.locator('button:has-text("Cancelar"), button:has-text("X"), button[aria-label*="cerrar"]').first();
              if (await closeButton.count() > 0) {
                await closeButton.click();
                await page.waitForTimeout(1000);
              } else {
                // Presionar Escape para cerrar
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
              }
            } else {
              console.log(`   ⚠️  No se encontraron campos en el formulario`);
              results.forms.errors.push(`${module.name}: formulario sin campos`);
            }
          } else {
            console.log(`   ⚠️  No se abrió el formulario en ${module.name}`);
            results.forms.errors.push(`${module.name}: formulario no se abrió`);
          }
        } else {
          console.log(`   ⚠️  No se encontró botón "Nuevo" en ${module.name}`);
          results.forms.errors.push(`${module.name}: botón nuevo no encontrado`);
        }
      } catch (error) {
        console.log(`   ❌ Error en formulario de ${module.name}:`, error.message);
        results.forms.errors.push(`${module.name}: ${error.message}`);
      }
    }

    results.forms.success = results.forms.errors.length === 0;
    if (results.forms.success) {
      results.passed++;
    }

    // ============================================
    // TEST 4: BOTONES Y ELEMENTOS INTERACTIVOS
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 4: BOTONES Y ELEMENTOS INTERACTIVOS');
    console.log('='.repeat(60));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(3000);

    // Verificar botones principales
    const buttonSelectors = [
      'button[type="submit"]',
      'button:has-text("Guardar")',
      'button:has-text("Cancelar")',
      'button:has-text("Editar")',
      'button:has-text("Eliminar")',
      'button[aria-label]'
    ];

    for (const selector of buttonSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      console.log(`🔘 ${selector}: ${count} botones encontrados`);
      results.buttons.details.push(`${selector}: ${count} botones`);

      if (count > 0) {
        // Verificar contraste de botones
        const firstButton = buttons.first();
        const buttonColors = await getElementColors(page, selector);
        if (buttonColors && buttonColors.color) {
          const buttonFg = rgbToHex(buttonColors.color);
          const buttonBg = rgbToHex(buttonColors.backgroundColor) || '#0ea5e9'; // cyan-500
          if (buttonFg) {
            const contrast = checkContrast(buttonFg, buttonBg);
            if (!contrast.passesAA) {
              results.contrast.details.push(`⚠️  Botón ${selector} no cumple contraste AA (ratio: ${contrast.ratio})`);
              results.warnings++;
            } else {
              console.log(`   ✅ Botón cumple contraste AA (ratio: ${contrast.ratio})`);
            }
          }
        }
      }
    }

    results.buttons.success = true;
    results.passed++;

    // ============================================
    // TEST 5: CONSISTENCIA VISUAL DE UI
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 5: CONSISTENCIA VISUAL DE UI');
    console.log('='.repeat(60));
    results.totalTests++;

    // Verificar consistencia de colores en diferentes módulos
    const colorSamples = {};

    for (const module of ['dashboard', 'finances', 'warehouse']) {
      await page.goto(`${baseUrl}/?tab=${module}`);
      await page.waitForTimeout(2000);

      // Muestrear colores de títulos
      const titleColors = await getElementColors(page, 'h1, h2');
      if (titleColors) {
        colorSamples[`${module}_title`] = {
          color: titleColors.color,
          bg: titleColors.backgroundColor
        };
      }

      // Muestrear colores de tarjetas
      const cardColors = await getElementColors(page, '.glass-card');
      if (cardColors) {
        colorSamples[`${module}_card`] = {
          color: cardColors.color,
          bg: cardColors.backgroundColor
        };
      }
    }

    // Comparar consistencia
    const titleColorKeys = Object.keys(colorSamples).filter(k => k.includes('_title'));
    if (titleColorKeys.length > 1) {
      const firstTitleColor = colorSamples[titleColorKeys[0]].color;
      const consistent = titleColorKeys.every(k => colorSamples[k].color === firstTitleColor);
      
      if (consistent) {
        console.log('✅ Colores de títulos consistentes entre módulos');
        results.visualConsistency.details.push('✅ Títulos: colores consistentes');
      } else {
        console.log('⚠️  Colores de títulos inconsistentes entre módulos');
        results.visualConsistency.errors.push('Títulos: colores inconsistentes');
        results.warnings++;
      }
    }

    results.visualConsistency.success = results.visualConsistency.errors.length === 0;
    if (results.visualConsistency.success) {
      results.passed++;
    }

    // ============================================
    // TEST 6: CONTRASTE Y ACCESIBILIDAD
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 6: CONTRASTE Y ACCESIBILIDAD');
    console.log('='.repeat(60));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    // Verificar contraste de elementos clave
    const keyElements = [
      { selector: 'h1, h2', name: 'Títulos' },
      { selector: 'p', name: 'Párrafos' },
      { selector: 'button', name: 'Botones' },
      { selector: 'input', name: 'Inputs' },
      { selector: '.glass-card', name: 'Tarjetas' }
    ];

    for (const element of keyElements) {
      const elem = page.locator(element.selector).first();
      if (await elem.count() > 0) {
        const colors = await getElementColors(page, element.selector);
        if (colors && colors.color) {
          const fg = rgbToHex(colors.color);
          const bg = rgbToHex(colors.backgroundColor) || '#0f172a';
          if (fg) {
            const contrast = checkContrast(fg, bg);
            console.log(`${element.name}: ratio ${contrast.ratio} - AA: ${contrast.passesAA ? '✅' : '❌'} - AAA: ${contrast.passesAAA ? '✅' : '❌'}`);
            
            if (!contrast.passesAA) {
              results.contrast.errors.push(`${element.name}: no cumple AA (ratio: ${contrast.ratio})`);
              results.failed++;
            } else {
              results.contrast.details.push(`✅ ${element.name}: cumple AA (ratio: ${contrast.ratio})`);
            }
          }
        }
      }
    }

    results.contrast.success = results.contrast.errors.length === 0;
    if (results.contrast.success) {
      results.passed++;
    }

    // ============================================
    // TEST 7: RESPONSIVE DESIGN
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 TEST 7: RESPONSIVE DESIGN');
    console.log('='.repeat(60));
    results.totalTests++;

    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      console.log(`\n🔸 Probando viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${baseUrl}/?tab=dashboard`);
      await page.waitForTimeout(2000);

      // Verificar que el contenido es visible
      const mainContent = page.locator('main').first();
      if (await mainContent.count() > 0) {
        const isVisible = await mainContent.isVisible();
        if (isVisible) {
          console.log(`   ✅ Contenido visible en ${viewport.name}`);
          results.responsiveness.details.push(`✅ ${viewport.name}: contenido visible`);
        } else {
          console.log(`   ❌ Contenido no visible en ${viewport.name}`);
          results.responsiveness.errors.push(`${viewport.name}: contenido no visible`);
          results.failed++;
        }
      }

      // Verificar navegación móvil en viewport pequeño
      if (viewport.width <= 768) {
        const mobileMenu = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first();
        if (await mobileMenu.count() > 0) {
          console.log(`   ✅ Menú móvil presente en ${viewport.name}`);
          results.responsiveness.details.push(`✅ ${viewport.name}: menú móvil presente`);
        } else {
          console.log(`   ⚠️  Menú móvil no encontrado en ${viewport.name}`);
          results.responsiveness.errors.push(`${viewport.name}: menú móvil ausente`);
          results.warnings++;
        }
      }
    }

    // Restaurar viewport original
    await page.setViewportSize({ width: 1920, height: 1080 });

    results.responsiveness.success = results.responsiveness.errors.length === 0;
    if (results.responsiveness.success) {
      results.passed++;
    }

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 10 segundos...');
    await page.waitForTimeout(10000);
    await browser.close();
  }

  // ============================================
  // RESUMEN DE RESULTADOS
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE PRUEBAS COMPLETAS VISUALES Y FUNCIONALES');
  console.log('='.repeat(70));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`⚠️  Advertencias: ${results.warnings}`);
  
  console.log('\n📝 TEST 1: LOGIN');
  console.log(`   Estado: ${results.login.success ? '✅ OK' : '❌ FAIL'}`);
  if (results.login.errors.length > 0) {
    results.login.errors.forEach(err => console.log(`   - ${err}`));
  }
  if (results.login.visualIssues.length > 0) {
    console.log('   ⚠️  Issues visuales:');
    results.login.visualIssues.forEach(issue => console.log(`   - ${issue}`));
  }

  console.log('\n📝 TEST 2: NAVEGACIÓN');
  console.log(`   Estado: ${results.navigation.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`   Módulos probados: ${MODULES.length}`);
  results.navigation.details.forEach(detail => console.log(`   ${detail}`));
  if (results.navigation.errors.length > 0) {
    results.navigation.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 TEST 3: FORMULARIOS');
  console.log(`   Estado: ${results.forms.success ? '✅ OK' : '❌ FAIL'}`);
  results.forms.details.forEach(detail => console.log(`   ${detail}`));
  if (results.forms.errors.length > 0) {
    results.forms.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 TEST 4: BOTONES');
  console.log(`   Estado: ${results.buttons.success ? '✅ OK' : '❌ FAIL'}`);
  results.buttons.details.forEach(detail => console.log(`   ${detail}`));
  if (results.buttons.errors.length > 0) {
    results.buttons.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 TEST 5: CONSISTENCIA VISUAL');
  console.log(`   Estado: ${results.visualConsistency.success ? '✅ OK' : '❌ FAIL'}`);
  results.visualConsistency.details.forEach(detail => console.log(`   ${detail}`));
  if (results.visualConsistency.errors.length > 0) {
    results.visualConsistency.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 TEST 6: CONTRASTE Y ACCESIBILIDAD');
  console.log(`   Estado: ${results.contrast.success ? '✅ OK' : '❌ FAIL'}`);
  results.contrast.details.forEach(detail => console.log(`   ${detail}`));
  if (results.contrast.errors.length > 0) {
    results.contrast.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n📝 TEST 7: RESPONSIVE DESIGN');
  console.log(`   Estado: ${results.responsiveness.success ? '✅ OK' : '❌ FAIL'}`);
  results.responsiveness.details.forEach(detail => console.log(`   ${detail}`));
  if (results.responsiveness.errors.length > 0) {
    results.responsiveness.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('='.repeat(70));

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente! Sin issues visuales ni funcionales.');
  } else if (results.failed === 0) {
    console.log(`\n⚠️  ${results.warnings} advertencias encontradas. Revisar detalles arriba.`);
  } else {
    console.log(`\n❌ ${results.failed} pruebas fallaron y ${results.warnings} advertencias. Revisar errores arriba.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runCompleteTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});