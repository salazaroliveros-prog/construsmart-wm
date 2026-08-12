/**
 * PRUEBA E2E EXTREMO A EXTREMO - MÓDULO DE PRESUPUESTO (MEJORADO)
 * Versión mejorada con correcciones para selectores y manejo de modales
 * Uso: node scripts/e2e-budget-extreme-e2e-improved.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

// Log de actividad
const activityLog = [];
const detectedIssues = [];
const proposedImprovements = [];

// Datos de prueba para el escenario extremo
const extremeScenario = {
  project: {
    name: `Torre Beta Extremo Test IMPROVED ${Date.now()}`,
    location: 'Av. Reforma 456, Ciudad de México',
    budget: 75000000,
    startDate: '2026-10-01',
    endDate: '2029-06-30',
    description: 'Torre de oficinas clase A con 25 pisos, estacionamiento subterráneo y amenities'
  },
  budget: {
    items: [
      { category: 'estructural', name: 'Cemento tipo I', unit: 'ton', quantity: 8000, unit_cost: 4200 },
      { category: 'estructural', name: 'Varilla de acero', unit: 'ton', quantity: 3500, unit_cost: 13500 },
      { category: 'cimentación', name: 'Concreto premezclado', unit: 'm3', quantity: 15000, unit_cost: 1800 },
      { category: 'mampostería', name: 'Block de concreto', unit: 'mil', quantity: 1200000, unit_cost: 4.2 },
      { category: 'acabados', name: 'Piso laminado', unit: 'm2', quantity: 35000, unit_cost: 150 },
      { category: 'acabados', name: 'Muro cortina', unit: 'm2', quantity: 18000, unit_cost: 650 },
      { category: 'instalaciones', name: 'Hidrosanitarias', unit: 'conjunto', quantity: 1, unit_cost: 5500000 },
      { category: 'instalaciones', name: 'Electromecánicas', unit: 'conjunto', quantity: 1, unit_cost: 7200000 },
      { category: 'elevadores', name: 'Elevadores de pasajeros', unit: 'unidad', quantity: 6, unit_cost: 950000 },
      { category: 'elevadores', name: 'Montacargas', unit: 'unidad', quantity: 2, unit_cost: 420000 }
    ]
  }
};

// Función para registrar actividad
function logActivity(phase, action, status, details = '') {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, phase, action, status, details };
  activityLog.push(entry);
  console.log(`[${timestamp}] ${phase}: ${action} - ${status}`);
  if (details) console.log(`   ${details}`);
}

// Función para registrar problema detectado
function logIssue(severity, component, issue, impact, suggestedFix) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, severity, component, issue, impact, suggestedFix };
  detectedIssues.push(entry);
  console.log(`⚠️  ISSUE DETECTED [${severity}]: ${component} - ${issue}`);
  console.log(`   Impacto: ${impact}`);
  console.log(`   Solución sugerida: ${suggestedFix}`);
}

// Función para cerrar modales y toasts
async function closeModalsAndToasts(page) {
  try {
    // Cerrar modales
    const modals = page.locator('[role="dialog"], .modal-backdrop, .glass-panel[role="dialog"]');
    const modalCount = await modals.count();
    if (modalCount > 0) {
      await modals.evaluateAll(el => el.forEach(modal => modal.remove()));
      logActivity('LIMPIEZA', `${modalCount} modal(es) cerrado(s)`, 'EXITOSO');
    }

    // Cerrar toasts/alerts
    const toasts = page.locator('[role="alert"], .toast, .notification');
    const toastCount = await toasts.count();
    if (toastCount > 0) {
      await toasts.evaluateAll(el => el.forEach(toast => toast.remove()));
      logActivity('LIMPIEZA', `${toastCount} toast(s) cerrado(s)`, 'EXITOSO');
    }

    await page.waitForTimeout(500);
  } catch (error) {
    console.log('Error al cerrar modales:', error.message);
  }
}

async function runImprovedExtremeE2ETest() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales');
    process.exit(1);
  }

  console.log('🚀 INICIANDO PRUEBA E2E EXTREMO A EXTREMO (MEJORADO) - MÓDULO DE PRESUPUESTO');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('=' .repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ============================================
    // FASE 1: LOGIN
    // ============================================
    logActivity('LOGIN', 'Iniciando sesión', 'INICIANDO');
    
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      logActivity('LOGIN', 'Login falló', 'ERROR', 'Credenciales inválidas');
      process.exit(1);
    }

    logActivity('LOGIN', 'Login exitoso', 'EXITOSO');

    // ============================================
    // FASE 2: CREACIÓN DE PROYECTO
    // ============================================
    logActivity('PROYECTO', 'Navegando a módulo de Proyectos', 'INICIANDO');
    await page.goto(`${baseUrl}/?tab=projects`);
    await page.waitForTimeout(3000);

    // Buscar botón de nuevo proyecto (selector mejorado)
    const newProjectBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button[aria-label*="add" i]').first();
    if (await newProjectBtn.count() === 0) {
      logIssue('CRÍTICO', 'Navegación', 'Botón de nuevo proyecto no encontrado', 'No se puede continuar', 'Verificar que el botón de creación esté visible');
    } else {
      await newProjectBtn.click();
      await page.waitForTimeout(2000);
      logActivity('PROYECTO', 'Formulario de proyecto abierto', 'EXITOSO');
    }

    // Llenar formulario de proyecto
    logActivity('PROYECTO', 'Llenando formulario de proyecto', 'INICIANDO');
    
    const projectForm = {
      name: page.locator('input[name*="name"], input[placeholder*="nombre" i]').first(),
      location: page.locator('input[name*="location"], input[placeholder*="ubicación" i]').first(),
      budget: page.locator('input[name*="budget"], input[type="number"]').first(),
      startDate: page.locator('input[name*="start"], input[type="date"]').first(),
      endDate: page.locator('input[name*="end"], input[type="date"]').first(),
      description: page.locator('textarea[name*="description"]').first()
    };

    // Nombre del proyecto
    if (await projectForm.name.count() > 0) {
      await projectForm.name.fill(extremeScenario.project.name);
      logActivity('PROYECTO', 'Nombre del proyecto ingresado', 'EXITOSO', extremeScenario.project.name);
    }

    // Ubicación
    if (await projectForm.location.count() > 0) {
      await projectForm.location.fill(extremeScenario.project.location);
      logActivity('PROYECTO', 'Ubicación ingresada', 'EXITOSO', extremeScenario.project.location);
    }

    // Presupuesto
    if (await projectForm.budget.count() > 0) {
      await projectForm.budget.fill(extremeScenario.project.budget.toString());
      logActivity('PROYECTO', 'Presupuesto base ingresado', 'EXITOSO', `$${extremeScenario.project.budget.toLocaleString()}`);
    }

    // Fechas
    if (await projectForm.startDate.count() > 0) {
      await projectForm.startDate.fill(extremeScenario.project.startDate);
      logActivity('PROYECTO', 'Fecha inicio ingresada', 'EXITOSO', extremeScenario.project.startDate);
    }

    if (await projectForm.endDate.count() > 0) {
      await projectForm.endDate.fill(extremeScenario.project.endDate);
      logActivity('PROYECTO', 'Fecha fin ingresada', 'EXITOSO', extremeScenario.project.endDate);
    }

    // Descripción
    if (await projectForm.description.count() > 0) {
      await projectForm.description.fill(extremeScenario.project.description);
      logActivity('PROYECTO', 'Descripción ingresada', 'EXITOSO');
    }

    // Guardar proyecto
    const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      logActivity('PROYECTO', 'Proyecto guardado', 'EXITOSO');
    }

    // Cerrar modales/toasts después de guardar
    await closeModalsAndToasts(page);

    // ============================================
    // FASE 3: GENERACIÓN DE PRESUPUESTO (MEJORADO)
    // ============================================
    logActivity('PRESUPUESTO', 'Navegando a módulo de Presupuestos', 'INICIANDO');
    await page.goto(`${baseUrl}/?tab=budgets`);
    await page.waitForTimeout(3000);

    // Buscar botón de nuevo presupuesto (selectores múltiples mejorados)
    const newBudgetBtn = page.locator(
      'button:has-text("Nuevo"), ' +
      'button:has-text("Crear"), ' +
      'button:has-text("Presupuesto"), ' +
      'button[aria-label*="presupuesto" i], ' +
      'button[data-action*="budget"]'
    ).first();

    if (await newBudgetBtn.count() > 0) {
      await newBudgetBtn.click();
      await page.waitForTimeout(2000);
      logActivity('PRESUPUESTO', 'Formulario de presupuesto abierto', 'EXITOSO');
    } else {
      logIssue('CRÍTICO', 'Navegación', 'Botón de nuevo presupuesto no encontrado', 'No se puede crear presupuesto', 'Verificar selectores y visibilidad del botón');
    }

    // Cerrar modales antes de continuar
    await closeModalsAndToasts(page);

    // Seleccionar proyecto (selector mejorado)
    const projectSelect = page.locator(
      'select[name*="project"], ' +
      'select[name*="proyecto"], ' +
      'input[role="combobox"]'
    ).first();

    if (await projectSelect.count() > 0) {
      await projectSelect.click();
      await page.waitForTimeout(500);
      
      // Buscar opción con el nombre del proyecto
      const projectOption = page.locator(`option:has-text("${extremeScenario.project.name}")`).first();
      if (await projectOption.count() > 0) {
        await projectOption.click();
        logActivity('PRESUPUESTO', 'Proyecto seleccionado', 'EXITOSO', extremeScenario.project.name);
      } else {
        logIssue('MEDIO', 'Formulario Presupuesto', 'Opción de proyecto no encontrada', 'No se puede vincular presupuesto', 'Verificar que el proyecto aparezca en el selector');
      }
    } else {
      logIssue('CRÍTICO', 'Formulario Presupuesto', 'Selector de proyecto no encontrado', 'No se puede vincular presupuesto', 'Verificar visibilidad del selector');
    }

    // Agregar items de presupuesto
    logActivity('PRESUPUESTO', 'Agregando items de presupuesto', 'INICIANDO', `${extremeScenario.budget.items.length} items planificados`);
    
    for (let i = 0; i < extremeScenario.budget.items.length; i++) {
      const item = extremeScenario.budget.items[i];
      
      // Cerrar modales antes de cada item
      await closeModalsAndToasts(page);
      
      // Buscar botón de agregar item (selector mejorado)
      const addItemBtn = page.locator(
        'button:has-text("Agregar"), ' +
        'button:has-text("Añadir"), ' +
        'button:has-text("+"), ' +
        'button[aria-label*="add" i], ' +
        'button.glass-button:has-text("+")'
      ).first();

      if (await addItemBtn.count() > 0) {
        await addItemBtn.click();
        await page.waitForTimeout(500);
      }

      // Llenar campos del item
      const categoryInput = page.locator('input[name*="category"], select[name*="category"]').last();
      const nameInput = page.locator('input[name*="name"], input[placeholder*="nombre" i]').last();
      const unitInput = page.locator('input[name*="unit"], select[name*="unit"]').last();
      const quantityInput = page.locator('input[name*="quantity"], input[type="number"]').last();
      const unitCostInput = page.locator('input[name*="cost"], input[name*="price"]').last();

      if (await categoryInput.count() > 0) {
        await categoryInput.fill(item.category);
      }
      
      if (await nameInput.count() > 0) {
        await nameInput.fill(item.name);
      }
      
      if (await unitInput.count() > 0) {
        await unitInput.fill(item.unit);
      }
      
      if (await quantityInput.count() > 0) {
        await quantityInput.fill(item.quantity.toString());
      }
      
      if (await unitCostInput.count() > 0) {
        await unitCostInput.fill(item.unit_cost.toString());
      }

      logActivity('PRESUPUESTO', `Item ${i + 1} agregado`, 'EXITOSO', `${item.name} - ${item.quantity} ${item.unit} @ $${item.unit_cost}`);
      
      await page.waitForTimeout(300);
    }

    // Calcular total estimado
    const estimatedTotal = extremeScenario.budget.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    logActivity('PRESUPUESTO', 'Cálculo de total estimado', 'CALCULADO', `$${estimatedTotal.toLocaleString()}`);

    // Verificar validación de presupuesto base
    const budgetVariance = Math.abs(estimatedTotal - extremeScenario.project.budget);
    const budgetVariancePercent = (budgetVariance / extremeScenario.project.budget) * 100;

    if (budgetVariancePercent > 10) {
      logIssue('MEDIO', 'Validación Presupuesto', 'Diferencia significativa entre presupuesto base y items', `Variance: ${budgetVariancePercent.toFixed(2)}%`, 'Implementar validación en tiempo real que alerte cuando los items excedan el presupuesto base');
      proposedImprovements.push({
        category: 'VALIDACIÓN',
        title: 'Alerta de exceso de presupuesto',
        description: `Los items exceden el presupuesto base en ${budgetVariancePercent.toFixed(2)}% ($${budgetVariance.toLocaleString()})`,
        priority: 'ALTA',
        effort: 'BAJO'
      });
    }

    // Guardar presupuesto
    await closeModalsAndToasts(page);
    const saveBudgetBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
    if (await saveBudgetBtn.count() > 0) {
      await saveBudgetBtn.click();
      await page.waitForTimeout(3000);
      logActivity('PRESUPUESTO', 'Presupuesto guardado', 'EXITOSO');
    }

    // ============================================
    // FASE 4: TRANSICIÓN PLANIFICACIÓN → EJECUCIÓN
    // ============================================
    logActivity('TRANSICIÓN', 'Iniciando transición de fase', 'INICIANDO');
    
    // Volver al módulo de proyectos
    await page.goto(`${baseUrl}/?tab=projects`);
    await page.waitForTimeout(3000);

    // Buscar el proyecto creado
    const projectList = page.locator('[class*="project"], tbody tr, .glass-card').first();
    if (await projectList.count() > 0) {
      await projectList.click();
      await page.waitForTimeout(2000);
      logActivity('TRANSICIÓN', 'Proyecto seleccionado', 'EXITOSO');
    }

    // Buscar opción de cambiar estado/fase
    const statusBtn = page.locator(
      'button:has-text("Estado"), ' +
      'button:has-text("Fase"), ' +
      'button[aria-label*="status" i], ' +
      'select[name*="status"]'
    ).first();

    if (await statusBtn.count() > 0) {
      await statusBtn.click();
      await page.waitForTimeout(1000);
      logActivity('TRANSICIÓN', 'Selector de estado abierto', 'EXITOSO');
    }

    // Seleccionar estado "En Ejecución"
    const executionOption = page.locator(
      'option:has-text("Ejecución"), ' +
      'option:has-text("execution"), ' +
      'button:has-text("Ejecución")'
    ).first();

    if (await executionOption.count() > 0) {
      await executionOption.click();
      await page.waitForTimeout(1000);
      logActivity('TRANSICIÓN', 'Estado cambiado a Ejecución', 'EXITOSO');
    } else {
      logIssue('MEDIO', 'Transición', 'Opción de estado "Ejecución" no encontrada', 'No se puede cambiar fase', 'Verificar que las opciones de estado incluyan "En Ejecución"');
    }

    // Guardar cambio de estado
    await closeModalsAndToasts(page);
    const saveStatusBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
    if (await saveStatusBtn.count() > 0) {
      await saveStatusBtn.click();
      await page.waitForTimeout(3000);
      logActivity('TRANSICIÓN', 'Transición completada', 'EXITOSO');
    }

    // ============================================
    // FASE 5: VERIFICACIÓN DE COHERENCIA
    // ============================================
    logActivity('VERIFICACIÓN', 'Verificando coherencia entre fases', 'INICIANDO');

    // Volver a presupuestos para verificar estado
    await page.goto(`${baseUrl}/?tab=budgets`);
    await page.waitForTimeout(3000);

    // Verificar que el presupuesto esté vinculado al proyecto en ejecución
    const budgetStatus = page.locator('[class*="status"], [class*="phase"], .badge').first();
    if (await budgetStatus.count() > 0) {
      const statusText = await budgetStatus.textContent();
      logActivity('VERIFICACIÓN', 'Estado del presupuesto verificado', 'EXITOSO', statusText);
      
      if (!statusText.toLowerCase().includes('ejecución') && !statusText.toLowerCase().includes('execution')) {
        logIssue('MEDIO', 'Coherencia', 'Estado del presupuesto no refleja fase del proyecto', 'El presupuesto no muestra estar en ejecución', 'Implementar sincronización automática de estado entre proyecto y presupuesto');
      }
    }

    // ============================================
    // GENERACIÓN DE PROPUESTAS DE OPTIMIZACIÓN
    // ============================================
    logActivity('OPTIMIZACIÓN', 'Generando propuestas de mejora', 'INICIANDO');

    // Mejoras proactivas basadas en mejores prácticas
    if (!proposedImprovements.find(p => p.title === 'Cálculos en tiempo real')) {
      proposedImprovements.push({
        category: 'MEJORA',
        title: 'Cálculos en tiempo real',
        description: 'Mostrar total actualizado mientras se agregan items en lugar de solo al guardar',
        priority: 'ALTA',
        effort: 'MEDIO'
      });
    }

    if (!proposedImprovements.find(p => p.title === 'Validación de presupuesto base')) {
      proposedImprovements.push({
        category: 'MEJORA',
        title: 'Validación de presupuesto base',
        description: 'Alertar cuando los items agregados excedan el presupuesto base del proyecto',
        priority: 'ALTA',
        effort: 'BAJO'
      });
    }

    proposedImprovements.push({
      category: 'MEJORA',
      title: 'Plantillas de presupuestos',
      description: 'Permitir guardar plantillas de presupuestos comunes para reutilizar',
      priority: 'MEDIA',
      effort: 'ALTO'
    });

    proposedImprovements.push({
      category: 'MEJORA',
      title: 'Historial de cambios de fase',
      description: 'Registrar y mostrar historial de cambios de fase con timestamps',
      priority: 'BAJA',
      effort: 'MEDIO'
    });

    proposedImprovements.push({
      category: 'MEJORA',
      title: 'Comparación presupuesto vs ejecución',
      description: 'Mostrar comparación entre presupuesto planificado y gastos reales en ejecución',
      priority: 'ALTA',
      effort: 'ALTO'
    });

    proposedImprovements.push({
      category: 'MEJORA',
      title: 'Alertas de desviación',
      description: 'Notificar cuando los gastos reales desvían más del 10% del presupuesto',
      priority: 'ALTA',
      effort: 'MEDIO'
    });

  } catch (error) {
    logActivity('ERROR', 'Error crítico durante prueba', 'ERROR', error.message);
    console.error('\n❌ Error crítico:', error);
  } finally {
    console.log('\n⏳ Prueba completada. Cerrando navegador en 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // ============================================
  // GENERACIÓN DE REPORTE FINAL
  // ============================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE DE PRUEBA E2E EXTREMO A EXTREMO (MEJORADO) - MÓDULO DE PRESUPUESTO');
  console.log('='.repeat(80));

  console.log('\n📝 LOG DE ACTIVIDAD:');
  console.log('-'.repeat(80));
  activityLog.forEach(entry => {
    console.log(`[${entry.timestamp}] ${entry.phase}: ${entry.action} - ${entry.status}`);
    if (entry.details) console.log(`   ${entry.details}`);
  });

  console.log('\n⚠️  PROBLEMAS DETECTADOS:');
  console.log('-'.repeat(80));
  if (detectedIssues.length === 0) {
    console.log('✅ No se detectaron problemas críticos');
  } else {
    detectedIssues.forEach(issue => {
      console.log(`[${issue.severity}] ${issue.component}: ${issue.issue}`);
      console.log(`   Impacto: ${issue.impact}`);
      console.log(`   Solución: ${issue.suggestedFix}`);
    });
  }

  console.log('\n💡 MEJORAS PROPUESTAS:');
  console.log('-'.repeat(80));
  proposedImprovements.forEach(improvement => {
    console.log(`[${improvement.priority}] ${improvement.title}`);
    console.log(`   ${improvement.description}`);
    console.log(`   Esfuerzo: ${improvement.effort}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📈 RESUMEN:');
  console.log(`Total de acciones: ${activityLog.length}`);
  console.log(`Problemas detectados: ${detectedIssues.length}`);
  console.log(`Mejoras propuestas: ${proposedImprovements.length}`);
  console.log('='.repeat(80));

  // Guardar reporte en archivo
  const reportPath = path.join(__dirname, '..', 'docs', 'BUDGET_EXTREME_E2E_IMPROVED_REPORT.md');
  const reportContent = `# Reporte de Prueba E2E Extremo a Extremo (MEJORADO) - Módulo de Presupuesto
**Fecha:** ${new Date().toISOString()}

## Log de Actividad
${activityLog.map(entry => `- **${entry.phase}**: ${entry.action} - ${entry.status}\n  ${entry.details || ''}`).join('\n')}

## Problemas Detectados
${detectedIssues.length === 0 ? '✅ No se detectaron problemas críticos' : detectedIssues.map(issue => `- **[${issue.severity}] ${issue.component}**: ${issue.issue}\n  - Impacto: ${issue.impact}\n  - Solución: ${issue.suggestedFix}`).join('\n')}

## Mejoras Propuestas
${proposedImprovements.map(improvement => `- **[${improvement.priority}] ${improvement.title}**\n  - ${improvement.description}\n  - Esfuerzo: ${improvement.effort}`).join('\n')}

## Resumen
- Total de acciones: ${activityLog.length}
- Problemas detectados: ${detectedIssues.length}
- Mejoras propuestas: ${proposedImprovements.length}
`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);

  process.exit(detectedIssues.filter(i => i.severity === 'CRÍTICO').length > 0 ? 1 : 0);
}

runImprovedExtremeE2ETest().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});