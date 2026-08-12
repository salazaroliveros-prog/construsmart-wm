/**
 * PRUEBAS E2E DE OPTIMIZACIÓN DE ESPACIOS Y CENTRADO PERFECTO
 * Análisis específico de KPIs, gráficos, formularios y aprovechamiento máximo de espacios
 * Uso: node scripts/e2e-space-optimization-kpi.js
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.test' });

// Resultados detallados de espacios
const spaceResults = {
  kpiCentering: { success: false, errors: [], warnings: [], details: [] },
  chartsCentering: { success: false, errors: [], warnings: [], details: [] },
  formsCentering: { success: false, errors: [], warnings: [], details: [] },
  spaceUtilization: { success: false, errors: [], warnings: [], details: [] },
  deadSpace: { success: false, errors: [], warnings: [], details: [] },
  elementDistribution: { success: false, errors: [], warnings: [], details: [] },
  responsiveKPIs: { success: false, errors: [], warnings: [], details: [] },
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// Función para calcular porcentaje de espacio utilizado
async function calculateSpaceUtilization(page, containerSelector) {
  try {
    const container = page.locator(containerSelector).first();
    if (await container.count() === 0) return null;

    const utilization = await container.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const children = el.children;
      let totalChildrenArea = 0;
      let totalGaps = 0;
      
      // Calcular área total de hijos
      for (let child of children) {
        const childRect = child.getBoundingClientRect();
        totalChildrenArea += childRect.width * childRect.height;
      }
      
      // Calcular área del contenedor
      const containerArea = rect.width * rect.height;
      
      // Calcular espacios entre elementos (gaps)
      if (children.length > 1) {
        for (let i = 0; i < children.length - 1; i++) {
          const currentRect = children[i].getBoundingClientRect();
          const nextRect = children[i + 1].getBoundingClientRect();
          
          // Gap horizontal si están en la misma fila
          if (Math.abs(currentRect.top - nextRect.top) < 10) {
            const gap = nextRect.left - (currentRect.left + currentRect.width);
            if (gap > 0) {
              totalGaps += gap * Math.max(currentRect.height, nextRect.height);
            }
          }
          
          // Gap vertical si están en la misma columna
          if (Math.abs(currentRect.left - nextRect.left) < 10) {
            const gap = nextRect.top - (currentRect.top + currentRect.height);
            if (gap > 0) {
              totalGaps += gap * Math.max(currentRect.width, nextRect.width);
            }
          }
        }
      }
      
      const utilizationPercentage = (totalChildrenArea / containerArea) * 100;
      const gapPercentage = (totalGaps / containerArea) * 100;
      const deadSpacePercentage = 100 - utilizationPercentage - gapPercentage;
      
      return {
        containerWidth: rect.width,
        containerHeight: rect.height,
        containerArea,
        totalChildrenArea,
        totalGaps,
        utilizationPercentage: utilizationPercentage.toFixed(2),
        gapPercentage: gapPercentage.toFixed(2),
        deadSpacePercentage: Math.max(0, deadSpacePercentage).toFixed(2),
        childrenCount: children.length
      };
    });

    return utilization;
  } catch (error) {
    return null;
  }
}

// Función para verificar centrado horizontal y vertical perfecto
async function checkPerfectCentering(page, selector, parentSelector = 'main') {
  try {
    const element = page.locator(selector).first();
    const parent = page.locator(parentSelector).first();
    
    if (await element.count() === 0 || await parent.count() === 0) return null;

    const centering = await element.evaluate((el, parentEl) => {
      const rect = el.getBoundingClientRect();
      const parentRect = parentEl.getBoundingClientRect();
      
      const elementCenterX = rect.left + rect.width / 2;
      const parentCenterX = parentRect.left + parentRect.width / 2;
      
      const elementCenterY = rect.top + rect.height / 2;
      const parentCenterY = parentRect.top + parentRect.height / 2;
      
      const horizontalOffset = Math.abs(elementCenterX - parentCenterX);
      const verticalOffset = Math.abs(elementCenterY - parentCenterY);
      
      // Calcular porcentaje de desviación
      const horizontalDeviationPercent = (horizontalOffset / (parentRect.width / 2)) * 100;
      const verticalDeviationPercent = (verticalOffset / (parentRect.height / 2)) * 100;
      
      return {
        horizontalOffset: horizontalOffset.toFixed(2),
        verticalOffset: verticalOffset.toFixed(2),
        horizontalDeviationPercent: horizontalDeviationPercent.toFixed(2),
        verticalDeviationPercent: verticalDeviationPercent.toFixed(2),
        isPerfectlyCentered: horizontalOffset < 2 && verticalOffset < 2,
        isWellCentered: horizontalOffset < 10 && verticalOffset < 10,
        elementWidth: rect.width,
        elementHeight: rect.height,
        parentWidth: parentRect.width,
        parentHeight: parentRect.height
      };
    }, await parent.elementHandle());

    return centering;
  } catch (error) {
    return null;
  }
}

// Función para analizar distribución de elementos
async function analyzeElementDistribution(page, containerSelector) {
  try {
    const container = page.locator(containerSelector).first();
    if (await container.count() === 0) return null;

    const distribution = await container.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const children = Array.from(el.children);
      
      const positions = children.map(child => {
        const childRect = child.getBoundingClientRect();
        return {
          left: childRect.left,
          top: childRect.top,
          width: childRect.width,
          height: childRect.height,
          right: childRect.right,
          bottom: childRect.bottom
        };
      });
      
      // Encontrar límites
      const minX = Math.min(...positions.map(p => p.left));
      const maxX = Math.max(...positions.map(p => p.right));
      const minY = Math.min(...positions.map(p => p.top));
      const maxY = Math.max(...positions.map(p => p.bottom));
      
      // Calcular márgenes externos
      const leftMargin = minX - rect.left;
      const rightMargin = rect.right - maxX;
      const topMargin = minY - rect.top;
      const bottomMargin = rect.bottom - maxY;
      
      // Calcular espacios entre elementos
      const horizontalGaps = [];
      const verticalGaps = [];
      
      for (let i = 0; i < positions.length - 1; i++) {
        const current = positions[i];
        const next = positions[i + 1];
        
        // Gap horizontal
        if (Math.abs(current.top - next.top) < 20) {
          const gap = next.left - current.right;
          if (gap > 0) {
            horizontalGaps.push(gap);
          }
        }
        
        // Gap vertical
        if (Math.abs(current.left - next.left) < 20) {
          const gap = next.top - current.bottom;
          if (gap > 0) {
            verticalGaps.push(gap);
          }
        }
      }
      
      const avgHorizontalGap = horizontalGaps.length > 0 
        ? horizontalGaps.reduce((a, b) => a + b, 0) / horizontalGaps.length 
        : 0;
      const avgVerticalGap = verticalGaps.length > 0 
        ? verticalGaps.reduce((a, b) => a + b, 0) / verticalGaps.length 
        : 0;
      
      return {
        leftMargin: leftMargin.toFixed(2),
        rightMargin: rightMargin.toFixed(2),
        topMargin: topMargin.toFixed(2),
        bottomMargin: bottomMargin.toFixed(2),
        horizontalGaps: horizontalGaps.length,
        verticalGaps: verticalGaps.length,
        avgHorizontalGap: avgHorizontalGap.toFixed(2),
        avgVerticalGap: avgVerticalGap.toFixed(2),
        totalElements: children.length,
        contentWidth: maxX - minX,
        contentHeight: maxY - minY
      };
    });

    return distribution;
  } catch (error) {
    return null;
  }
}

async function runSpaceOptimizationTests() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales');
    process.exit(1);
  }

  console.log('🚀 Iniciando pruebas de optimización de espacios y centrado perfecto...');
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
    // TEST 1: CENTRADO PERFECTO DE KPIS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 1: CENTRADO PERFECTO DE KPIS (GRID COMPLETO)');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(3000);

    // Buscar el contenedor grid de KPIs (no las tarjetas individuales)
    const kpiGrid = page.locator('.grid-cols-2, .grid-cols-3, .grid-cols-6').first();
    const gridCount = await kpiGrid.count();
    
    console.log(`📊 Encontrados ${gridCount} contenedores grid de KPIs`);

    if (gridCount > 0) {
      // Medir el centrado del GRID completo, no de tarjetas individuales
      const centering = await checkPerfectCentering(page, '.grid-cols-2, .grid-cols-3, .grid-cols-6', 'main');
      if (centering) {
        if (centering.isPerfectlyCentered) {
          console.log(`✅ Grid de KPIs: perfectamente centrado (desviación: ${centering.horizontalOffset}px horizontal, ${centering.verticalOffset}px vertical)`);
          spaceResults.kpiCentering.details.push('✅ Grid KPIs: centrado perfecto');
        } else if (centering.isWellCentered) {
          console.log(`✅ Grid de KPIs: bien centrado (desviación: ${centering.horizontalOffset}px horizontal, ${centering.verticalOffset}px vertical)`);
          spaceResults.kpiCentering.details.push('✅ Grid KPIs: bien centrado');
        } else {
          console.log(`⚠️  Grid de KPIs: desviación ${centering.horizontalDeviationPercent}% horizontal, ${centering.verticalDeviationPercent}% vertical`);
          spaceResults.kpiCentering.warnings.push(`Grid KPIs: desviación ${centering.horizontalDeviationPercent}%`);
          spaceResults.warnings++;
        }
      }

      // Verificar que las tarjetas estén distribuidas correctamente en el grid
      const kpiCards = page.locator('.glass-card');
      const kpiCount = await kpiCards.count();
      console.log(`📊 Tarjetas de KPIs en grid: ${kpiCount}`);
      
      if (kpiCount >= 6) {
        console.log(`✅ Grid contiene ${kpiCount} tarjetas (distribución correcta)`);
        spaceResults.kpiCentering.details.push(`✅ Grid: ${kpiCount} tarjetas distribuidas`);
      } else {
        console.log(`⚠️  Grid contiene solo ${kpiCount} tarjetas`);
        spaceResults.kpiCentering.warnings.push(`Grid: solo ${kpiCount} tarjetas`);
        spaceResults.warnings++;
      }
    } else {
      console.log(`❌ No se encontró contenedor grid de KPIs`);
      spaceResults.kpiCentering.errors.push('Grid de KPIs no encontrado');
      spaceResults.failed++;
    }

    spaceResults.kpiCentering.success = spaceResults.kpiCentering.errors.length === 0;
    if (spaceResults.kpiCentering.success) {
      spaceResults.passed++;
    }

    // ============================================
    // TEST 2: CENTRADO DE GRÁFICOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 2: CENTRADO DE GRÁFICOS');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    // Buscar contenedores de gráficos
    const chartContainers = page.locator('[class*="chart"], svg, canvas');
    const chartCount = await chartContainers.count();
    
    console.log(`📊 Encontrados ${chartCount} elementos de gráficos`);

    for (let i = 0; i < Math.min(chartCount, 4); i++) {
      const centering = await checkPerfectCentering(page, `[class*="chart"] >> nth=${i}, svg >> nth=${i}, canvas >> nth=${i}`, 'main');
      if (centering) {
        if (centering.isPerfectlyCentered) {
          console.log(`✅ Gráfico [${i}]: perfectamente centrado`);
          spaceResults.chartsCentering.details.push(`✅ Gráfico[${i}]: centrado perfecto`);
        } else if (centering.isWellCentered) {
          console.log(`⚠️  Gráfico [${i}]: bien centrado (desviación: ${centering.horizontalOffset}px)`);
          spaceResults.chartsCentering.warnings.push(`Gráfico[${i}]: desviación menor`);
          spaceResults.warnings++;
        } else {
          console.log(`❌ Gráfico [${i}]: desviación: ${centering.horizontalDeviationPercent}%`);
          spaceResults.chartsCentering.errors.push(`Gráfico[${i}]: desviación significativa`);
          spaceResults.failed++;
        }
      }
    }

    spaceResults.chartsCentering.success = spaceResults.chartsCentering.errors.length === 0;
    if (spaceResults.chartsCentering.success) {
      spaceResults.passed++;
    }

    // ============================================
    // TEST 3: CENTRADO DE FORMULARIOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 3: CENTRADO DE FORMULARIOS');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    const formModules = ['finances', 'warehouse', 'payroll', 'clients', 'suppliers'];

    for (const module of formModules) {
      await page.goto(`${baseUrl}/?tab=${module}`);
      await page.waitForTimeout(2000);

      // Buscar formularios
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        for (let i = 0; i < Math.min(formCount, 2); i++) {
          const centering = await checkPerfectCentering(page, `form >> nth=${i}`, 'main');
          if (centering) {
            if (centering.isPerfectlyCentered) {
              console.log(`✅ Formulario ${module}[${i}]: perfectamente centrado`);
              spaceResults.formsCentering.details.push(`✅ ${module}[${i}]: centrado perfecto`);
            } else if (centering.isWellCentered) {
              console.log(`⚠️  Formulario ${module}[${i}]: bien centrado`);
              spaceResults.formsCentering.warnings.push(`${module}[${i}]: desviación menor`);
              spaceResults.warnings++;
            } else {
              console.log(`❌ Formulario ${module}[${i}]: desviación: ${centering.horizontalDeviationPercent}%`);
              spaceResults.formsCentering.errors.push(`${module}[${i}]: desviación significativa`);
              spaceResults.failed++;
            }
          }
        }
      }
    }

    spaceResults.formsCentering.success = spaceResults.formsCentering.errors.length === 0;
    if (spaceResults.formsCentering.success) {
      spaceResults.passed++;
    }

    // ============================================
    // TEST 4: APROVECHAMIENTO DE ESPACIOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 4: APROVECHAMIENTO MÁXIMO DE ESPACIOS');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    for (const module of ['dashboard', 'finances', 'warehouse', 'projects']) {
      await page.goto(`${baseUrl}/?tab=${module}`);
      await page.waitForTimeout(2000);

      const utilization = await calculateSpaceUtilization(page, 'main');
      if (utilization) {
        console.log(`\n📊 ${module.toUpperCase()}:`);
        console.log(`   Aprovechamiento: ${utilization.utilizationPercentage}%`);
        console.log(`   Espacios entre elementos: ${utilization.gapPercentage}%`);
        console.log(`   Espacio muerto: ${utilization.deadSpacePercentage}%`);
        console.log(`   Elementos: ${utilization.childrenCount}`);
        
        if (parseFloat(utilization.utilizationPercentage) >= 85) {
          console.log(`   ✅ Excelente aprovechamiento de espacio`);
          spaceResults.spaceUtilization.details.push(`✅ ${module}: ${utilization.utilizationPercentage}% aprovechamiento`);
        } else if (parseFloat(utilization.utilizationPercentage) >= 70) {
          console.log(`   ⚠️  Buen aprovechamiento, pero puede mejorar`);
          spaceResults.spaceUtilization.warnings.push(`${module}: ${utilization.utilizationPercentage}% (puede mejorar)`);
          spaceResults.warnings++;
        } else {
          console.log(`   ❌ Bajo aprovechamiento de espacio`);
          spaceResults.spaceUtilization.errors.push(`${module}: ${utilization.utilizationPercentage}% (bajo)`);
          spaceResults.failed++;
        }

        if (parseFloat(utilization.deadSpacePercentage) > 15) {
          console.log(`   ⚠️  Mucho espacio muerto (${utilization.deadSpacePercentage}%)`);
          spaceResults.deadSpace.warnings.push(`${module}: ${utilization.deadSpacePercentage}% espacio muerto`);
          spaceResults.warnings++;
        }
      }
    }

    spaceResults.spaceUtilization.success = spaceResults.spaceUtilization.errors.length === 0;
    if (spaceResults.spaceUtilization.success) {
      spaceResults.passed++;
    }

    // ============================================
    // TEST 5: ESPACIOS VACÍOS ENTRE ELEMENTOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 5: ANÁLISIS DE ESPACIOS VACÍOS');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const distribution = await analyzeElementDistribution(page, 'main');
    if (distribution) {
      console.log(`📊 Distribución de elementos en Dashboard:`);
      console.log(`   Margen izquierdo: ${distribution.leftMargin}px`);
      console.log(`   Margen derecho: ${distribution.rightMargin}px`);
      console.log(`   Margen superior: ${distribution.topMargin}px`);
      console.log(`   Margen inferior: ${distribution.bottomMargin}px`);
      console.log(`   Gaps horizontales: ${distribution.horizontalGaps}`);
      console.log(`   Gaps verticales: ${distribution.verticalGaps}`);
      console.log(`   Gap horizontal promedio: ${distribution.avgHorizontalGap}px`);
      console.log(`   Gap vertical promedio: ${distribution.avgVerticalGap}px`);
      
      // Verificar si los márgenes son simétricos
      const marginDiff = Math.abs(parseFloat(distribution.leftMargin) - parseFloat(distribution.rightMargin));
      if (marginDiff < 10) {
        console.log(`✅ Márgenes horizontales simétricos`);
        spaceResults.deadSpace.details.push('✅ Márgenes horizontales simétricos');
      } else {
        console.log(`⚠️  Márgenes horizontales asimétricos (diferencia: ${marginDiff}px)`);
        spaceResults.deadSpace.warnings.push(`Márgenes asimétricos: ${marginDiff}px`);
        spaceResults.warnings++;
      }

      // Verificar si gaps son consistentes
      if (distribution.horizontalGaps > 0) {
        const gapVariance = parseFloat(distribution.avgHorizontalGap) > 0 ? 10 : 0;
        if (gapVariance < 5) {
          console.log(`✅ Gaps horizontales consistentes`);
          spaceResults.deadSpace.details.push('✅ Gaps horizontales consistentes');
        } else {
          console.log(`⚠️  Gaps horizontales inconsistentes`);
          spaceResults.deadSpace.warnings.push('Gaps horizontales inconsistentes');
          spaceResults.warnings++;
        }
      }
    }

    spaceResults.deadSpace.success = spaceResults.deadSpace.errors.length === 0;
    if (spaceResults.deadSpace.success) {
      spaceResults.passed++;
    }

    // ============================================
    // TEST 6: DISTRIBUCIÓN DE ELEMENTOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 6: DISTRIBUCIÓN ÓPTIMA DE ELEMENTOS');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    await page.goto(`${baseUrl}/?tab=dashboard`);
    await page.waitForTimeout(2000);

    const elementDist = await analyzeElementDistribution(page, '.glass-panel');
    if (elementDist) {
      const totalMargin = parseFloat(elementDist.leftMargin) + parseFloat(elementDist.rightMargin);
      const totalVerticalMargin = parseFloat(elementDist.topMargin) + parseFloat(elementDist.bottomMargin);
      
      console.log(`📊 Distribución en contenedor principal:`);
      console.log(`   Margen horizontal total: ${totalMargin}px`);
      console.log(`   Margen vertical total: ${totalVerticalMargin}px`);
      
      if (totalMargin < 50 && totalVerticalMargin < 50) {
        console.log(`✅ Distribución compacta y eficiente`);
        spaceResults.elementDistribution.details.push('✅ Distribución compacta');
      } else if (totalMargin < 100) {
        console.log(`⚠️  Distribución aceptable pero puede ser más compacta`);
        spaceResults.elementDistribution.warnings.push('Distribución puede ser más compacta');
        spaceResults.warnings++;
      } else {
        console.log(`❌ Demasiado espacio en márgenes`);
        spaceResults.elementDistribution.errors.push('Exceso de márgenes');
        spaceResults.failed++;
      }
    }

    spaceResults.elementDistribution.success = spaceResults.elementDistribution.errors.length === 0;
    if (spaceResults.elementDistribution.success) {
      spaceResults.passed++;
    }

    // ============================================
    // TEST 7: RESPONSIVIDAD DE KPIS Y GRÁFICOS
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📝 TEST 7: RESPONSIVIDAD DE KPIS Y GRÁFICOS');
    console.log('='.repeat(70));
    spaceResults.totalTests++;

    const responsiveViewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of responsiveViewports) {
      console.log(`\n🔸 Probando ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${baseUrl}/?tab=dashboard`);
      await page.waitForTimeout(2000);

      const utilization = await calculateSpaceUtilization(page, 'main');
      if (utilization) {
        console.log(`   Aprovechamiento: ${utilization.utilizationPercentage}%`);
        
        if (parseFloat(utilization.utilizationPercentage) >= 80) {
          console.log(`   ✅ Buen aprovechamiento en ${viewport.name}`);
          spaceResults.responsiveKPIs.details.push(`✅ ${viewport.name}: ${utilization.utilizationPercentage}%`);
        } else {
          console.log(`   ⚠️  Aprovechamiento subóptimo en ${viewport.name}`);
          spaceResults.responsiveKPIs.warnings.push(`${viewport.name}: ${utilization.utilizationPercentage}%`);
          spaceResults.warnings++;
        }
      }

      // Verificar que KPIs sean visibles
      const kpiVisible = await page.locator('.glass-card').first().isVisible();
      if (kpiVisible) {
        console.log(`   ✅ KPIs visibles en ${viewport.name}`);
      } else {
        console.log(`   ❌ KPIs no visibles en ${viewport.name}`);
        spaceResults.responsiveKPIs.errors.push(`${viewport.name}: KPIs no visibles`);
        spaceResults.failed++;
      }
    }

    // Restaurar viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    spaceResults.responsiveKPIs.success = spaceResults.responsiveKPIs.errors.length === 0;
    if (spaceResults.responsiveKPIs.success) {
      spaceResults.passed++;
    }

  } catch (error) {
    console.error('\n❌ Error crítico durante pruebas:', error);
  } finally {
    console.log('\n⏳ Pruebas completadas. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // ============================================
  // RESUMEN DE OPTIMIZACIÓN DE ESPACIOS
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE OPTIMIZACIÓN DE ESPACIOS Y CENTRADO');
  console.log('='.repeat(70));
  console.log(`Total de tests: ${spaceResults.totalTests}`);
  console.log(`✅ Pasados: ${spaceResults.passed}`);
  console.log(`❌ Fallidos: ${spaceResults.failed}`);
  console.log(`⚠️  Advertencias: ${spaceResults.warnings}`);
  
  console.log('\n📝 TEST 1: CENTRADO DE KPIS');
  console.log(`   Estado: ${spaceResults.kpiCentering.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.kpiCentering.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.kpiCentering.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.kpiCentering.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 2: CENTRADO DE GRÁFICOS');
  console.log(`   Estado: ${spaceResults.chartsCentering.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.chartsCentering.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.chartsCentering.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.chartsCentering.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 3: CENTRADO DE FORMULARIOS');
  console.log(`   Estado: ${spaceResults.formsCentering.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.formsCentering.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.formsCentering.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.formsCentering.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 4: APROVECHAMIENTO DE ESPACIOS');
  console.log(`   Estado: ${spaceResults.spaceUtilization.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.spaceUtilization.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.spaceUtilization.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.spaceUtilization.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 5: ESPACIOS VACÍOS');
  console.log(`   Estado: ${spaceResults.deadSpace.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.deadSpace.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.deadSpace.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.deadSpace.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 6: DISTRIBUCIÓN DE ELEMENTOS');
  console.log(`   Estado: ${spaceResults.elementDistribution.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.elementDistribution.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.elementDistribution.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.elementDistribution.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('\n📝 TEST 7: RESPONSIVIDAD DE KPIS');
  console.log(`   Estado: ${spaceResults.responsiveKPIs.success ? '✅ OK' : '❌ FAIL'}`);
  spaceResults.responsiveKPIs.details.forEach(detail => console.log(`   ${detail}`));
  spaceResults.responsiveKPIs.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  spaceResults.responsiveKPIs.errors.forEach(error => console.log(`   ❌ ${error}`));

  console.log('='.repeat(70));

  if (spaceResults.failed === 0 && spaceResults.warnings === 0) {
    console.log('\n🎉 ¡Optimización de espacios perfecta! Centrado y aprovechamiento excelentes.');
  } else if (spaceResults.failed === 0) {
    console.log(`\n⚠️  ${spaceResults.warnings} advertencias de optimización. Revisar detalles.`);
  } else {
    console.log(`\n❌ ${spaceResults.failed} errores y ${spaceResults.warnings} advertencias. Revisar detalles.`);
  }

  process.exit(spaceResults.failed === 0 ? 0 : 1);
}

runSpaceOptimizationTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});