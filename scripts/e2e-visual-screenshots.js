/**
 * PRUEBAS E2E CON CAPTURAS DE PANTALLA AUTOMÁTICAS
 * Captura screenshots en cada módulo y viewport para validación visual
 * Uso: node scripts/e2e-visual-screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

// Configuración de módulos a capturar
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

// Viewports para capturas
const SCREENSHOT_VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop-1920x1080' },
  { width: 1366, height: 768, name: 'laptop-1366x768' },
  { width: 1024, height: 768, name: 'tablet-landscape-1024x768' },
  { width: 768, height: 1024, name: 'tablet-portrait-768x1024' },
  { width: 375, height: 667, name: 'mobile-375x667' }
];

// Directorio para capturas
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

// Asegurar que el directorio existe
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log(`📁 Directorio de capturas creado: ${SCREENSHOTS_DIR}`);
}

// Función para tomar captura de pantalla
async function takeScreenshot(page, filename, description, fullPage = false) {
  try {
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    
    if (fullPage) {
      await page.screenshot({ 
        path: filepath, 
        fullPage: true,
        animations: 'disabled'
      });
    } else {
      await page.screenshot({ 
        path: filepath,
        animations: 'disabled'
      });
    }
    
    console.log(`📸 Captura guardada: ${filename} - ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al capturar ${filename}:`, error.message);
    return false;
  }
}

// Función para crear subdirectorio
function ensureModuleDir(moduleName) {
  const moduleDir = path.join(SCREENSHOTS_DIR, moduleName.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir, { recursive: true });
  }
  return moduleDir;
}

async function runScreenshotTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales');
    process.exit(1);
  }

  console.log('🚀 Iniciando capturas de pantalla automáticas...');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('📁 Directorio de capturas:', SCREENSHOTS_DIR);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalScreenshots = 0;
  let successfulScreenshots = 0;

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
    // CAPTURAS POR VIEWPORT Y MÓDULO
    // ============================================
    
    for (const viewport of SCREENSHOT_VIEWPORTS) {
      console.log('\n' + '='.repeat(70));
      console.log(`📱 VIEWPORT: ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log('='.repeat(70));
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);

      for (const module of MODULES) {
        console.log(`\n🔸 Capturando módulo: ${module.name}`);
        
        await page.goto(`${baseUrl}${module.path}`);
        await page.waitForTimeout(3000); // Esperar carga completa

        const moduleDir = ensureModuleDir(module.name);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        // Captura de pantalla completa del módulo
        const viewportFilename = `${module.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}-${timestamp}.png`;
        const viewportPath = path.join(moduleDir, viewportFilename);
        
        try {
          await page.screenshot({ 
            path: viewportPath,
            fullPage: true,
            animations: 'disabled'
          });
          console.log(`   ✅ Captura completa: ${viewportFilename}`);
          totalScreenshots++;
          successfulScreenshots++;
        } catch (error) {
          console.log(`   ❌ Error en captura: ${error.message}`);
          totalScreenshots++;
        }

        // Captura de pantalla visible (sin scroll) para ver el área inicial
        const visibleFilename = `${module.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}-visible-${timestamp}.png`;
        const visiblePath = path.join(moduleDir, visibleFilename);
        
        try {
          await page.screenshot({ 
            path: visiblePath,
            animations: 'disabled'
          });
          console.log(`   ✅ Captura visible: ${visibleFilename}`);
          totalScreenshots++;
          successfulScreenshots++;
        } catch (error) {
          console.log(`   ❌ Error en captura visible: ${error.message}`);
          totalScreenshots++;
        }

        // Capturas específicas por módulo
        if (module.id === 'dashboard') {
          // Captura específica de KPIs
          try {
            const kpiElement = page.locator('.grid-cols-2, .grid-cols-3, .grid-cols-6').first();
            if (await kpiElement.count() > 0) {
              const kpiFilename = `kpis-${viewport.name}-${timestamp}.png`;
              const kpiPath = path.join(moduleDir, kpiFilename);
              await kpiElement.screenshot({ path: kpiPath });
              console.log(`   ✅ Captura KPIs: ${kpiFilename}`);
              totalScreenshots++;
              successfulScreenshots++;
            }
          } catch (error) {
            console.log(`   ⚠️  No se pudo capturar KPIs`);
          }
        }

        // Para módulos con formularios, intentar abrir un formulario
        if (['finances', 'warehouse', 'payroll', 'clients', 'suppliers', 'projects'].includes(module.id)) {
          try {
            // Buscar botón de nuevo/crear
            const buttonSelectors = [
              'button:has-text("Nuevo")',
              'button:has-text("Crear")',
              'button:has-text("Nueva")',
              'button:has-text("Nuevo Cliente")',
              'button:has-text("Nuevo Proveedor")',
              'button:has-text("Nueva Transacción")'
            ];

            for (const selector of buttonSelectors) {
              const button = page.locator(selector).first();
              if (await button.count() > 0) {
                await button.click();
                await page.waitForTimeout(2000);

                // Capturar formulario abierto
                const formFilename = `${module.name.toLowerCase().replace(/\s+/g, '-')}-form-${viewport.name}-${timestamp}.png`;
                const formPath = path.join(moduleDir, formFilename);
                
                await page.screenshot({ 
                  path: formPath,
                  animations: 'disabled'
                });
                console.log(`   ✅ Captura formulario: ${formFilename}`);
                totalScreenshots++;
                successfulScreenshots++;

                // Cerrar formulario si es posible
                const closeButton = page.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), button[aria-label*="close"]').first();
                if (await closeButton.count() > 0) {
                  await closeButton.click();
                  await page.waitForTimeout(1000);
                } else {
                  // Presionar ESC para cerrar
                  await page.keyboard.press('Escape');
                  await page.waitForTimeout(1000);
                }
                break;
              }
            }
          } catch (error) {
            console.log(`   ⚠️  No se pudo capturar formulario: ${error.message}`);
          }
        }
      }
    }

    // ============================================
    // CAPTURAS ADICIONALES ESPECÍFICAS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📸 CAPTURAS ADICIONALES ESPECÍFICAS');
    console.log('='.repeat(70));

    // Restaurar viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(3000);

    // Capturar header
    try {
      const header = page.locator('header').first();
      if (await header.count() > 0) {
        const headerFilename = `header-desktop-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.png`;
        await header.screenshot({ path: path.join(SCREENSHOTS_DIR, headerFilename) });
        console.log(`✅ Captura header: ${headerFilename}`);
        totalScreenshots++;
        successfulScreenshots++;
      }
    } catch (error) {
      console.log(`⚠️  No se pudo capturar header`);
    }

    // Capturar navegación
    try {
      const nav = page.locator('nav').first();
      if (await nav.count() > 0) {
        const navFilename = `navigation-desktop-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.png`;
        await nav.screenshot({ path: path.join(SCREENSHOTS_DIR, navFilename) });
        console.log(`✅ Captura navegación: ${navFilename}`);
        totalScreenshots++;
        successfulScreenshots++;
      }
    } catch (error) {
      console.log(`⚠️  No se pudo capturar navegación`);
    }

    // Capturar sidebar
    try {
      const sidebar = page.locator('aside').first();
      if (await sidebar.count() > 0) {
        const sidebarFilename = `sidebar-desktop-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.png`;
        await sidebar.screenshot({ path: path.join(SCREENSHOTS_DIR, sidebarFilename) });
        console.log(`✅ Captura sidebar: ${sidebarFilename}`);
        totalScreenshots++;
        successfulScreenshots++;
      }
    } catch (error) {
      console.log(`⚠️  No se pudo capturar sidebar`);
    }

  } catch (error) {
    console.error('\n❌ Error crítico durante capturas:', error);
  } finally {
    console.log('\n⏳ Capturas completadas. Cerrando navegador en 3 segundos...');
    await page.waitForTimeout(3000);
    await browser.close();
  }

  // ============================================
  // RESUMEN DE CAPTURAS
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE CAPTURAS DE PANTALLA');
  console.log('='.repeat(70));
  console.log(`Total de capturas intentadas: ${totalScreenshots}`);
  console.log(`✅ Capturas exitosas: ${successfulScreenshots}`);
  console.log(`❌ Capturas fallidas: ${totalScreenshots - successfulScreenshots}`);
  console.log(`📁 Directorio: ${SCREENSHOTS_DIR}`);
  console.log('='.repeat(70));

  // Listar módulos capturados
  console.log('\n📁 Estructura de directorios:');
  MODULES.forEach(module => {
    const moduleDir = path.join(SCREENSHOTS_DIR, module.name.toLowerCase().replace(/\s+/g, '-'));
    if (fs.existsSync(moduleDir)) {
      const files = fs.readdirSync(moduleDir);
      console.log(`   ${module.name}: ${files.length} capturas`);
    }
  });

  console.log('\n🎉 Proceso de capturas completado. Revisa las capturas en el directorio especificado.');
  
  process.exit(totalScreenshots === successfulScreenshots ? 0 : 1);
}

runScreenshotTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});