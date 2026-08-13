const { chromium } = require('playwright');

const APP_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './screenshots';

const fs = require('fs');

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
  console.log('🚀 Iniciando capturas de pantalla con Playwright...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 Navegando a la aplicación...');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await wait(2000);

    // 1. Login Page
    console.log('📸 Capturando Login Page...');
    await takeScreenshot(page, '01-login-page', 'Página de Login');

    // 2. Intentar login (esto fallará sin credenciales reales, pero capturaremos el estado)
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('salazaroliveros@gmail.com');
      await wait(500);
      await takeScreenshot(page, '02-login-email-filled', 'Login con email llenado');
    }

    // 3. Capturar estados de inputs
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('testpassword123');
      await wait(500);
      await takeScreenshot(page, '03-login-password-filled', 'Login con password llenado (strength indicator)');
    }

    // 4. Capturar botón de login
    const loginButton = page.locator('button[type="submit"]');
    if (await loginButton.isVisible()) {
      await takeScreenshot(page, '04-login-button', 'Botón de Login');
    }

    // 5. Intentar navegar al dashboard directamente (si hay sesión activa)
    console.log('📸 Intentando navegar al dashboard...');
    try {
      await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
      await wait(3000);
      
      // 6. Dashboard Principal
      await takeScreenshot(page, '05-dashboard-main', 'Dashboard Principal');
      
      // 7. Navegación de Tabs
      await takeScreenshot(page, '06-dashboard-tabs', 'Navegación de Tabs');
      
      // 8. Sidebar
      await takeScreenshot(page, '07-dashboard-sidebar', 'Sidebar de Navegación');
      
      // 9. Stats del Dashboard
      await takeScreenshot(page, '08-dashboard-stats', 'KPIs del Dashboard');
      
      // 10. Charts del Dashboard
      await takeScreenshot(page, '09-dashboard-charts', 'Gráficos del Dashboard');

      // 11. Navegar a diferentes secciones
      const tabs = ['projects', 'budgets', 'finances', 'payroll', 'warehouse'];
      
      for (const tab of tabs) {
        console.log(`📸 Navegando a sección: ${tab}...`);
        await page.goto(`${APP_URL}/?tab=${tab}`, { waitUntil: 'networkidle' });
        await wait(2000);
        await takeScreenshot(page, `10-section-${tab}`, `Sección: ${tab}`);
      }

      // 12. Capturar responsive views
      console.log('📸 Capturando responsive views...');
      
      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
      await wait(2000);
      await takeScreenshot(page, '11-responsive-tablet', 'Dashboard en Tablet (768x1024)');
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
      await wait(2000);
      await takeScreenshot(page, '12-responsive-mobile', 'Dashboard en Mobile (375x667)');
      
      // Mobile con menú abierto
      const menuButton = page.locator('button[aria-label*="menú"], button[aria-label*="menu"], button[title*="menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await wait(1000);
        await takeScreenshot(page, '13-responsive-mobile-menu', 'Mobile con menú abierto');
      }

      // 14. Volver a desktop para capturar más detalles
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${APP_URL}/?tab=dashboard`, { waitUntil: 'networkidle' });
      await wait(2000);
      
      // 15. Capturar estados hover (simulado)
      console.log('📸 Capturando estados hover...');
      const firstTab = page.locator('nav button').first();
      if (await firstTab.isVisible()) {
        await firstTab.hover();
        await wait(500);
        await takeScreenshot(page, '14-tab-hover-state', 'Estado hover en tab');
      }

      // 16. Capturar elementos UI específicos
      console.log('📸 Capturando elementos UI específicos...');
      
      // Botones en la página
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        await buttons.nth(0).hover();
        await wait(500);
        await takeScreenshot(page, '15-button-hover', 'Estado hover en botón');
      }

      // Inputs en la página
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      if (inputCount > 0) {
        await inputs.nth(0).focus();
        await wait(500);
        await takeScreenshot(page, '16-input-focus', 'Estado focus en input');
      }

    } catch (error) {
      console.log('⚠️ No se pudo acceder al dashboard (posiblemente requiere autenticación)');
      console.log('📸 Capturando página actual como evidencia...');
      await takeScreenshot(page, '17-current-state', 'Estado actual de la aplicación');
    }

    console.log('✅ Capturas de pantalla completadas exitosamente');
    console.log(`📁 Las capturas se guardaron en: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Error durante las capturas:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);