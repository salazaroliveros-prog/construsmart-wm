const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Leer credenciales del archivo .env.test
function loadEnvFile(filePath) {
  const envVars = {};
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error.message);
  }
  return envVars;
}

// Cargar variables de entorno
const envVars = loadEnvFile('.env.test');
const EMAIL = envVars.TEST_EMAIL || process.env.TEST_EMAIL || 'salazaroliveros@gmail.com';
const PASSWORD = envVars.TEST_PASSWORD || process.env.TEST_PASSWORD;
const APP_URL = envVars.E2E_BASE_URL || process.env.APP_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = './screenshots-authenticated';

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshot(page, name, description) {
  await ensureDirExists(SCREENSHOTS_DIR);
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`✅ Captura: ${name} - ${description}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Iniciando capturas de pantalla con autenticación real...');
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Password: ${PASSWORD ? '****' : 'NO PROPORCIONADO'}`);
  console.log(`🌐 URL: ${APP_URL}`);
  
  if (!PASSWORD) {
    console.error('❌ ERROR: No se encontró password en .env.test');
    console.log('💡 Asegúrate de que .env.test contenga TEST_PASSWORD=tu_password');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 Navegando a la página de login...');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await wait(2000);

    // 1. Capturar login page inicial
    await takeScreenshot(page, '01-login-initial', 'Página de Login Inicial');

    // 2. Llenar email
    console.log('📧 Llenando email...');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(EMAIL);
    await wait(500);
    await takeScreenshot(page, '02-login-email-filled', 'Login con email llenado');

    // 3. Llenar password
    console.log('🔑 Llenando password...');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(PASSWORD);
    await wait(1000); // Esperar para que se muestre el strength indicator
    await takeScreenshot(page, '03-login-password-filled', 'Login con password llenado');

    // 4. Submit login
    console.log('🔐 Enviando login...');
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    
    // Esperar navegación al dashboard
    console.log('⏳ Esperando navegación al dashboard...');
    await page.waitForURL(/\//, { timeout: 10000 });
    await wait(3000);

    // 5. Capturar dashboard después de login exitoso
    console.log('📸 Capturando dashboard autenticado...');
    await takeScreenshot(page, '04-dashboard-authenticated', 'Dashboard Autenticado');

    // 6. Capturar navegación completa
    await takeScreenshot(page, '05-dashboard-tabs-auth', 'Navegación de Tabs Autenticado');
    await takeScreenshot(page, '06-dashboard-sidebar-auth', 'Sidebar Autenticado');
    await takeScreenshot(page, '07-dashboard-stats-auth', 'KPIs Autenticado');
    await takeScreenshot(page, '08-dashboard-charts-auth', 'Gráficos Autenticado');

    // 7. Navegar por todas las secciones autenticado
    const tabs = ['projects', 'budgets', 'finances', 'payroll', 'warehouse', 'suppliers', 'clients', 'logs', 'analytics', 'settings'];
    
    for (const tab of tabs) {
      console.log(`📸 Navegando a sección autenticada: ${tab}...`);
      await page.goto(`${APP_URL}/?tab=${tab}`, { waitUntil: 'networkidle' });
      await wait(2000);
      await takeScreenshot(page, `09-section-${tab}-auth`, `Sección Autenticada: ${tab}`);
    }

    // 8. Capturar responsive views autenticado
    console.log('📸 Capturando responsive views autenticado...');
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
    await wait(2000);
    await takeScreenshot(page, '10-responsive-tablet-auth', 'Tablet Autenticado');
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
    await wait(2000);
    await takeScreenshot(page, '11-responsive-mobile-auth', 'Mobile Autenticado');
    
    // Mobile con menú
    const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"], button[title*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await wait(1000);
      await takeScreenshot(page, '12-responsive-mobile-menu-auth', 'Mobile Menú Autenticado');
    }

    // 9. Volver a desktop para capturar detalles
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
    await wait(2000);

    // 10. Capturar estados interactivos autenticado
    console.log('📸 Capturando estados interactivos autenticado...');
    
    const firstTab = page.locator('nav button').first();
    if (await firstTab.isVisible()) {
      await firstTab.hover();
      await wait(500);
      await takeScreenshot(page, '13-tab-hover-auth', 'Tab Hover Autenticado');
    }

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      await buttons.nth(0).hover();
      await wait(500);
      await takeScreenshot(page, '14-button-hover-auth', 'Botón Hover Autenticado');
    }

    // 11. Capturar elementos específicos de UI autenticado
    console.log('📸 Capturando elementos UI específicos autenticado...');
    
    // Intentar encontrar y capturar formularios
    const forms = page.locator('form');
    const formCount = await forms.count();
    if (formCount > 0) {
      await takeScreenshot(page, '15-form-auth', 'Formulario Autenticado');
    }

    // Capturar tablas si existen
    const tables = page.locator('table');
    const tableCount = await tables.count();
    if (tableCount > 0) {
      await takeScreenshot(page, '16-table-auth', 'Tabla Autenticada');
    }

    // Capturar modals si existen
    const modals = page.locator('[role="dialog"], .modal');
    const modalCount = await modals.count();
    if (modalCount > 0) {
      await takeScreenshot(page, '17-modal-auth', 'Modal Autenticado');
    }

    console.log('✅ Capturas de pantalla autenticadas completadas exitosamente');
    console.log(`📁 Las capturas se guardaron en: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Error durante las capturas:', error);
    
    // Capturar estado actual incluso si hay error
    await takeScreenshot(page, 'error-state', 'Estado de Error');
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);