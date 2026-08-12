/**
 * PRUEBAS E2E VISUALES DETALLADAS Y AVANZADAS - CONSTRUCTORA WM/M&S
 * Script para analizar: tipografía, espaciado, centrado, overflow, responsividad avanzada
 * Uso: node scripts/e2e-visual-detailed-advanced.js
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

// Viewports avanzados para testing responsivo
const ADVANCED_VIEWPORTS = [
  { width: 2560, height: 1440, name: 'Ultra HD' },
  { width: 1920, height: 1080, name: 'Desktop Full HD' },
  { width: 1440, height: 900, name: 'Desktop Laptop' },
  { width: 1366, height: 768, name: 'Desktop Small' },
  { width: 1024, height: 768, name: 'Tablet Landscape' },
  { width: 768, height: 1024, name: 'Tablet Portrait' },
  { width: 414, height: 896, name: 'Mobile Large' },
  { width: 375, height: 667, name: 'Mobile Medium' },
  { width: 320, height: 568, name: 'Mobile Small' }
];

// Resultados detallados
const results = {
  typography: { success: false, errors: [], warnings: [], details: [] },
  spacing: { success: false, errors: [], warnings: [], details: [] },
  centering: { success: false, errors: [], warnings: [], details: [] },
  overflow: { success: false, errors: [], warnings: [], details: [] },
  styling: { success: false, errors: [], warnings: [], details: [] },
  responsiveAdvanced: { success: false, errors: [], warnings: [], details: [] },
  visualInconsistencies: { success: false, errors: [], warnings: [], details: [] },
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// Función para analizar tipografía de un elemento
async function analyzeTypography(page, selector) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;

    const styles = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        color: computed.color
      };
    });

    return styles;
  } catch (error) {
    return null;
  }
}

// Función para verificar espaciado
async function analyzeSpacing(page, selector) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;

    const spacing = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;

      return {
        marginTop: computed.marginTop,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        paddingTop: computed.paddingTop,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
        width: rect.width,
        height: rect.height,
        parentWidth: parentRect ? parentRect.width : null,
        parentHeight: parentRect ? parentRect.height : null
      };
    });

    return spacing;
  } catch (error) {
    return null;
  }
}

// Función para verificar centrado
async function checkCentering(page, selector) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;

    const centering = await element.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;

      if (!parentRect) return null;

      const computed = window.getComputedStyle(el);
      const parentComputed = window.getComputedStyle(parent);

      return {
        elementCenterX: rect.left + rect.width / 2,
        parentCenterX: parentRect.left + parentRect.width / 2,
        elementCenterY: rect.top + rect.height / 2,
        parentCenterY: parentRect.top + parentRect.height / 2,
        horizontalOffset: Math.abs((rect.left + rect.width / 2) - (parentRect.left + parentRect.width / 2)),
        verticalOffset: Math.abs((rect.top + rect.height / 2) - (parentRect.top + parentRect.height / 2)),
        textAlign: computed.textAlign,
        display: computed.display,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        margin: computed.margin,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        parentDisplay: parentComputed.display,
        parentJustifyContent: parentComputed.justifyContent,
        parentAlignItems: parentComputed.alignItems
      };
    });

    return centering;
  } catch (error) {
    return null;
  }
}

// Función para detectar overflow
async function detectOverflow(page, selector) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;

    const overflow = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;

      let hasHorizontalOverflow = false;
      let hasVerticalOverflow = false;
      let hasTextOverflow = false;

      // Verificar overflow horizontal
      if (parentRect) {
        hasHorizontalOverflow = rect.right > parentRect.right || rect.left < parentRect.left;
        hasVerticalOverflow = rect.bottom > parentRect.bottom || rect.top < parentRect.top;
      }

      // Verificar text overflow
      if (computed.overflow === 'hidden' || computed.overflow === 'scroll') {
        const scrollWidth = el.scrollWidth;
        const clientWidth = el.clientWidth;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;

        hasHorizontalOverflow = scrollWidth > clientWidth;
        hasVerticalOverflow = scrollHeight > clientHeight;
      }

      // Verificar text-overflow
      if (computed.textOverflow === 'ellipsis' || computed.whiteSpace === 'nowrap') {
        hasTextOverflow = true;
      }

      return {
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        whiteSpace: computed.whiteSpace,
        hasHorizontalOverflow,
        hasVerticalOverflow,
        hasTextOverflow,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      };
    });

    return overflow;
  } catch (error) {
    return null;
  }
}

// Función para analizar estilos refinados
async function analyzeStyling(page, selector) {
  try {
    const element = page.locator(selector).first();
    if (await element.count() === 0) return null;

    const styling = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        borderWidth: computed.borderWidth,
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow,
        backgroundColor: computed.backgroundColor,
        opacity: computed.opacity,
        transition: computed.transition,
        transform: computed.transform,
        backdropFilter: computed.backdropFilter,
        cursor: computed.cursor
      };
    });

    return styling;
  } catch (error) {
    return null;
  }
}

async function runDetailedVisualTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales en variables de entorno');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas visuales detalladas y avanzadas...');
  console.log('📡 URL de prueba:', baseUrl);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
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
    // TEST 1: ANÁLISIS DE TIPOGRAFÍA
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 1: ANÁLISIS DE TIPOGRAFÍA DETALLADO');
    console.log('='.repeat(70));
    results.totalTests++;

    const typographySamples = {};

    for (const module of MODULES) {
      await page.goto(`${baseUrl}${module.path}`);
      await page.waitForTimeout(2000);

      // Analizar diferentes tipos de elementos
      const elements = ['h1', 'h2', 'h3', 'p', 'button', 'input', 'label'];
      
      for (const element of elements) {
        const typography = await analyzeTypography(page, element);
        if (typography) {
          const key = `${module.id}_${element}`;
          typographySamples[key] = typography;
        }
      }
    }

    // Analizar consistencia de tipografía
    const h1Samples = Object.keys(typographySamples).filter(k => k.includes('_h1'));
    const h2Samples = Object.keys(typographySamples).filter(k => k.includes('_h2'));
    const buttonSamples = Object.keys(typographySamples).filter(k => k.includes('_button'));

    if (h1Samples.length > 1) {
      const firstH1 = typographySamples[h1Samples[0]];
      const consistentH1 = h1Samples.every(k => 
        typographySamples[k].fontSize === firstH1.fontSize &&
        typographySamples[k].fontWeight === firstH1.fontWeight
      );

      if (consistentH1) {
        console.log('✅ Títulos H1 consistentes en todos los módulos');
        results.typography.details.push('✅ H1: tamaño y peso consistentes');
      } else {
        console.log('⚠️  Títulos H1 inconsistentes');
        results.typography.warnings.push('H1: inconsistencia en tamaño/peso');
        results.warnings++;
      }
    }

    if (buttonSamples.length > 1) {
      const firstButton = typographySamples[buttonSamples[0]];
      const consistentButtons = buttonSamples.every(k => 
        typographySamples[k].fontSize === firstButton.fontSize &&
        typographySamples[k].fontWeight === firstButton.fontWeight
      );

      if (consistentButtons) {
        console.log('✅ Botones con tipografía consistente');
        results.typography.details.push('✅ Botones: tipografía consistente');
      } else {
        console.log('⚠️  Botones con tipografía inconsistente');
        results.typography.warnings.push('Botones: tipografía inconsistente');
        results.warnings++;
      }
    }

    // Verificar legibilidad (tamaño de fuente mínimo)
    let smallFontIssues = 0;
    Object.values(typographySamples).forEach(sample => {
      const fontSize = parseFloat(sample.fontSize);
      if (fontSize < 12) {
        smallFontIssues++;
        results.typography.warnings.push(`Fuente muy pequeña: ${sample.fontSize}px`);
      }
    });

    if (smallFontIssues === 0) {
      console.log('✅ Todos los textos tienen tamaño legible (≥12px)');
      results.typography.details.push('✅ Tamaños de fuente legibles');
    } else {
      console.log(`⚠️  ${smallFontIssues} elementos con fuente muy pequeña`);
      results.typography.errors.push(`${smallFontIssues} fuentes muy pequeñas`);
      results.failed++;
    }

    results.typography.success = results.typography.errors.length === 0;
    if (results.typography.success) {
      results.passed++;
    }

    // ============================================
    // TEST 2: ANÁLISIS DE ESPACIADO
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 2: ANÁLISIS DE ESPACIADO Y APROVECHAMIENTO');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    // Analizar espaciado de tarjetas
    const cards = page.locator('.glass-card');
    const spacingCardCount = await cards.count();
    
    if (spacingCardCount > 0) {
      const firstCardSpacing = await analyzeSpacing(page, '.glass-card');
      if (firstCardSpacing) {
        console.log(`📊 Espaciado de tarjetas:`);
        console.log(`   Margin: ${firstCardSpacing.marginTop} ${firstCardSpacing.marginBottom} ${firstCardSpacing.marginLeft} ${firstCardSpacing.marginRight}`);
        console.log(`   Padding: ${firstCardSpacing.paddingTop} ${firstCardSpacing.paddingBottom} ${firstCardSpacing.paddingLeft} ${firstCardSpacing.paddingRight}`);
        
        // Verificar espaciado consistente
        const allCardsSpacing = [];
        for (let i = 0; i < Math.min(spacingCardCount, 5); i++) {
          const spacing = await analyzeSpacing(page, `.glass-card >> nth=${i}`);
          if (spacing) {
            allCardsSpacing.push(spacing);
          }
        }

        const consistentSpacing = allCardsSpacing.every(s => 
          s.marginTop === firstCardSpacing.marginTop &&
          s.marginBottom === firstCardSpacing.marginBottom
        );

        if (consistentSpacing) {
          console.log('✅ Espaciado consistente entre tarjetas');
          results.spacing.details.push('✅ Tarjetas: espaciado consistente');
        } else {
          console.log('⚠️  Espaciado inconsistente entre tarjetas');
          results.spacing.warnings.push('Tarjetas: espaciado inconsistente');
          results.warnings++;
        }
      }
    }

    // Analizar aprovechamiento de espacio
    const mainContent = page.locator('main').first();
    if (await mainContent.count() > 0) {
      const mainSpacing = await analyzeSpacing(page, 'main');
      if (mainSpacing) {
        const usagePercentage = (mainSpacing.width / 1920) * 100;
        console.log(`📊 Aprovechamiento de espacio main: ${usagePercentage.toFixed(1)}%`);
        
        if (usagePercentage > 80) {
          console.log('✅ Buen aprovechamiento de espacio');
          results.spacing.details.push('✅ Main: buen aprovechamiento de espacio');
        } else {
          console.log('⚠️  Bajo aprovechamiento de espacio');
          results.spacing.warnings.push('Main: bajo aprovechamiento de espacio');
          results.warnings++;
        }
      }
    }

    results.spacing.success = results.spacing.errors.length === 0;
    if (results.spacing.success) {
      results.passed++;
    }

    // ============================================
    // TEST 3: VERIFICACIÓN DE CENTRADO
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 3: VERIFICACIÓN DE CENTRADO PERFECTO');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    // Verificar centrado de elementos principales
    const centeringElements = ['.glass-panel', 'header', '.glass-card'];
    
    for (const selector of centeringElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const centering = await checkCentering(page, `${selector} >> nth=${i}`);
          if (centering) {
            const isHorizontallyCentered = centering.horizontalOffset < 5; // 5px tolerancia
            const isVerticallyCentered = centering.verticalOffset < 5;

            if (isHorizontallyCentered && isVerticallyCentered) {
              console.log(`✅ ${selector} [${i}]: perfectamente centrado`);
              results.centering.details.push(`✅ ${selector}[${i}]: centrado perfecto`);
            } else {
              console.log(`⚠️  ${selector} [${i}]: desviación horizontal: ${centering.horizontalOffset.toFixed(1)}px, vertical: ${centering.verticalOffset.toFixed(1)}px`);
              results.centering.warnings.push(`${selector}[${i}]: desviación de centrado`);
              results.warnings++;
            }
          }
        }
      }
    }

    results.centering.success = results.centering.errors.length === 0;
    if (results.centering.success) {
      results.passed++;
    }

    // ============================================
    // TEST 4: DETECCIÓN DE OVERFLOW
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 4: DETECCIÓN DE OVERFLOW Y DESBORDE');
    console.log('='.repeat(70));
    results.totalTests++;

    for (const module of MODULES) {
      await page.goto(`${baseUrl}${module.path}`);
      await page.waitForTimeout(2000);

      // Verificar overflow en contenedores principales
      const containers = ['main', '.glass-panel', '.glass-card', 'form'];
      
      for (const container of containers) {
        const elements = page.locator(container);
        const count = await elements.count();
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const overflow = await detectOverflow(page, `${container} >> nth=${i}`);
            if (overflow) {
              if (overflow.hasHorizontalOverflow) {
                console.log(`❌ ${module.name} - ${container}[${i}]: overflow horizontal detectado`);
                results.overflow.errors.push(`${module.name} - ${container}[${i}]: overflow horizontal`);
                results.failed++;
              }
              if (overflow.hasVerticalOverflow) {
                console.log(`⚠️  ${module.name} - ${container}[${i}]: overflow vertical detectado`);
                results.overflow.warnings.push(`${module.name} - ${container}[${i}]: overflow vertical`);
                results.warnings++;
              }
            }
          }
        }
      }
    }

    if (results.overflow.errors.length === 0) {
      console.log('✅ No se detectó overflow horizontal crítico');
      results.overflow.details.push('✅ Sin overflow horizontal crítico');
    }

    results.overflow.success = results.overflow.errors.length === 0;
    if (results.overflow.success) {
      results.passed++;
    }

    // ============================================
    // TEST 5: RESPONSIVIDAD AVANZADA
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 5: RESPONSIVIDAD AVANZADA (9 VIEWPORTS)');
    console.log('='.repeat(70));
    results.totalTests++;

    for (const viewport of ADVANCED_VIEWPORTS) {
      console.log(`\n🔸 Probando viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${baseUrl}/?tab=dashboard`);
      await page.waitForTimeout(2000);

      // Verificar que no haya overflow horizontal
      const bodyOverflow = await detectOverflow(page, 'body');
      if (bodyOverflow && bodyOverflow.hasHorizontalOverflow) {
        console.log(`   ❌ Overflow horizontal en ${viewport.name}`);
        results.responsiveAdvanced.errors.push(`${viewport.name}: overflow horizontal`);
        results.failed++;
      } else {
        console.log(`   ✅ Sin overflow horizontal en ${viewport.name}`);
        results.responsiveAdvanced.details.push(`✅ ${viewport.name}: sin overflow horizontal`);
      }

      // Verificar que el contenido sea visible
      const mainContent = page.locator('main').first();
      if (await mainContent.count() > 0) {
        const isVisible = await mainContent.isVisible();
        if (isVisible) {
          console.log(`   ✅ Contenido visible en ${viewport.name}`);
        } else {
          console.log(`   ❌ Contenido no visible en ${viewport.name}`);
          results.responsiveAdvanced.errors.push(`${viewport.name}: contenido no visible`);
          results.failed++;
        }
      }

      // Verificar adaptación de navegación en móviles
      if (viewport.width <= 768) {
        const mobileNav = page.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first();
        if (await mobileNav.count() > 0) {
          console.log(`   ✅ Navegación móvil adaptada en ${viewport.name}`);
        } else {
          console.log(`   ⚠️  Navegación móvil no encontrada en ${viewport.name}`);
          results.responsiveAdvanced.warnings.push(`${viewport.name}: navegación móvil ausente`);
          results.warnings++;
        }
      }
    }

    // Restaurar viewport original
    await page.setViewportSize({ width: 1920, height: 1080 });

    results.responsiveAdvanced.success = results.responsiveAdvanced.errors.length === 0;
    if (results.responsiveAdvanced.success) {
      results.passed++;
    }

    // ============================================
    // TEST 6: ANÁLISIS DE ESTILO Y REFINADO
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 6: ANÁLISIS DE ESTILO Y REFINADO');
    console.log('='.repeat(70));
    results.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    // Analizar consistencia de bordes y radios
    const styledElements = ['.glass-card', '.glass-panel', 'button'];
    const styleSamples = {};

    for (const selector of styledElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        const styling = await analyzeStyling(page, selector);
        if (styling) {
          styleSamples[selector] = styling;
          console.log(`📊 ${selector}:`);
          console.log(`   Border Radius: ${styling.borderRadius}`);
          console.log(`   Box Shadow: ${styling.boxShadow}`);
          console.log(`   Backdrop Filter: ${styling.backdropFilter}`);
        }
      }
    }

    // Verificar consistencia de border-radius
    const cardRadius = styleSamples['.glass-card']?.borderRadius;
    const panelRadius = styleSamples['.glass-panel']?.borderRadius;

    if (cardRadius && panelRadius && cardRadius === panelRadius) {
      console.log('✅ Border-radius consistente entre tarjetas y paneles');
      results.styling.details.push('✅ Border-radius consistente');
    } else if (cardRadius && panelRadius) {
      console.log('⚠️  Border-radius inconsistente');
      results.styling.warnings.push('Border-radius inconsistente');
      results.warnings++;
    }

    // Verificar efectos de glassmorphism
    const hasBackdropFilter = Object.values(styleSamples).some(s => s.backdropFilter && s.backdropFilter !== 'none');
    if (hasBackdropFilter) {
      console.log('✅ Efectos de glassmorphism aplicados');
      results.styling.details.push('✅ Glassmorphism aplicado');
    } else {
      console.log('⚠️  No se detectaron efectos de glassmorphism');
      results.styling.warnings.push('Glassmorphism no detectado');
      results.warnings++;
    }

    results.styling.success = results.styling.errors.length === 0;
    if (results.styling.success) {
      results.passed++;
    }

    // ============================================
    // TEST 7: INCONSISTENCIAS VISUALES DETALLADAS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 7: AUDITORÍA DE INCONSISTENCIAS VISUALES');
    console.log('='.repeat(70));
    results.totalTests++;

    // Verificar alineación de elementos similares
    await page.goto(`${baseUrl}/?tab=finances`);
    await page.waitForTimeout(2000);

    const summaryCards = page.locator('.glass-card');
    const summaryCardCount = await summaryCards.count();
    
    if (summaryCardCount >= 3) {
      const firstCardPos = await summaryCards.nth(0).evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, left: rect.left };
      });

      const secondCardPos = await summaryCards.nth(1).evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, left: rect.left };
      });

      const thirdCardPos = await summaryCards.nth(2).evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, left: rect.left };
      });

      // Verificar alineación horizontal (mismo top)
      const alignedHorizontally = Math.abs(firstCardPos.top - secondCardPos.top) < 2 && 
                                Math.abs(secondCardPos.top - thirdCardPos.top) < 2;

      if (alignedHorizontally) {
        console.log('✅ Tarjetas de resumen alineadas horizontalmente');
        results.visualInconsistencies.details.push('✅ Tarjetas: alineación horizontal correcta');
      } else {
        console.log('⚠️  Tarjetas de resumen no alineadas horizontalmente');
        results.visualInconsistencies.warnings.push('Tarjetas: desalineación horizontal');
        results.warnings++;
      }

      // Verificar espaciado uniforme
      const spacing1 = secondCardPos.left - (firstCardPos.left + 300); // Asumiendo ancho ~300px
      const spacing2 = thirdCardPos.left - (secondCardPos.left + 300);

      if (Math.abs(spacing1 - spacing2) < 5) {
        console.log('✅ Espaciado uniforme entre tarjetas');
        results.visualInconsistencies.details.push('✅ Tarjetas: espaciado uniforme');
      } else {
        console.log('⚠️  Espaciado no uniforme entre tarjetas');
        results.visualInconsistencies.warnings.push('Tarjetas: espaciado no uniforme');
        results.warnings++;
      }
    }

    results.visualInconsistencies.success = results.visualInconsistencies.errors.length === 0;
    if (results.visualInconsistencies.success) {
      results.passed++;
    }

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // ============================================
  // RESUMEN DETALLADO
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE PRUEBAS VISUALES DETALLADAS Y AVANZADAS');
  console.log('='.repeat(70));
  console.log(`Total de tests: ${results.totalTests}`);
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`⚠️  Advertencias: ${results.warnings}`);
  
  console.log('\n📝 TEST 1: TIPOGRAFÍA');
  console.log(`   Estado: ${results.typography.success ? '✅ OK' : '❌ FAIL'}`);
  results.typography.details.forEach(detail => console.log(`   ${detail}`));
  results.typography.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.typography.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 2: ESPACIADO');
  console.log(`   Estado: ${results.spacing.success ? '✅ OK' : '❌ FAIL'}`);
  results.spacing.details.forEach(detail => console.log(`   ${detail}`));
  results.spacing.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.spacing.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 3: CENTRADO');
  console.log(`   Estado: ${results.centering.success ? '✅ OK' : '❌ FAIL'}`);
  results.centering.details.forEach(detail => console.log(`   ${detail}`));
  results.centering.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.centering.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 4: OVERFLOW');
  console.log(`   Estado: ${results.overflow.success ? '✅ OK' : '❌ FAIL'}`);
  results.overflow.details.forEach(detail => console.log(`   ${detail}`));
  results.overflow.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.overflow.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 5: RESPONSIVIDAD AVANZADA');
  console.log(`   Estado: ${results.responsiveAdvanced.success ? '✅ OK' : '❌ FAIL'}`);
  console.log(`   Viewports probados: ${ADVANCED_VIEWPORTS.length}`);
  results.responsiveAdvanced.details.forEach(detail => console.log(`   ${detail}`));
  results.responsiveAdvanced.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.responsiveAdvanced.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 6: ESTILO Y REFINADO');
  console.log(`   Estado: ${results.styling.success ? '✅ OK' : '❌ FAIL'}`);
  results.styling.details.forEach(detail => console.log(`   ${detail}`));
  results.styling.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.styling.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 7: INCONSISTENCIAS VISUALES');
  console.log(`   Estado: ${results.visualInconsistencies.success ? '✅ OK' : '❌ FAIL'}`);
  results.visualInconsistencies.details.forEach(detail => console.log(`   ${detail}`));
  results.visualInconsistencies.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  results.visualInconsistencies.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('='.repeat(70));

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 ¡Todas las pruebas avanzadas pasaron exitosamente! Sin inconsistencias visuales.');
  } else if (results.failed === 0) {
    console.log(`\n⚠️  ${results.warnings} advertencias encontradas. Revisar detalles arriba.`);
  } else {
    console.log(`\n❌ ${results.failed} pruebas fallaron y ${results.warnings} advertencias. Revisar errores arriba.`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

runDetailedVisualTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});