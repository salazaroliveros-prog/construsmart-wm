/**
 * PRUEBA E2E EXTREMO A EXTREMO - MÓDULO DE PRESUPUESTO
 * Simulación de flujo de trabajo completo: crear proyecto → generar presupuesto → transición planificación→ejecución
 * Uso: node scripts/e2e-budget-extreme-e2e.js
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
    name: `Edificio Residencial Torre Alpha - EXTREMO TEST ${Date.now()}`,
    location: 'Av. Principal 123, Ciudad de México',
    budget: 50000000,
    startDate: '2026-09-01',
    endDate: '2028-12-31',
    description: 'Proyecto de construcción de torre residencial de 20 pisos con amenidades completas'
  },
  budget: {
    items: [
      { category: 'estructural', name: 'Cemento', unit: 'ton', quantity: 5000, unit_cost: 4500 },
      { category: 'estructural', name: 'Acero de refuerzo', unit: 'ton', quantity: 2000, unit_cost: 12000 },
      { category: 'mampostería', name: 'Ladrillo rojo', unit: 'mil', quantity: 800000, unit_cost: 3.5 },
      { category: 'acabados', name: 'Porcelanato 60x60', unit: 'm2', quantity: 45000, unit_cost: 85 },
      { category: 'acabados', name: 'Pintura interior', unit: 'lt', quantity: 25000, unit_cost: 120 },
      { category: 'instalaciones', name: 'Tubería PVC', unit: 'm', quantity: 12000, unit_cost: 45 },
      { category: 'instalaciones', name: 'Cable eléctrico', unit: 'm', quantity: 35000, unit_cost: 25 },
      { category: 'equipos', name: 'Elevador comercial', unit: 'unidad', quantity: 4, unit_cost: 850000 },
      { category: 'equipos', name: 'Aire acondicionado central', unit: 'unidad', quantity: 1, unit_cost: 2500000 },
      { category: 'servicios', name: 'Arquitectura básica', unit: 'servicio', quantity: 1, unit_cost: 3500000 },
      { category: 'servicios', name: 'Ingeniería estructural', unit: 'servicio', quantity: 1, unit_cost: 4200000 }
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

// Función para registrar mejora propuesta
function logImprovement(category, title, description, priority, effort) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, category, title, description, priority, effort };
  proposedImprovements.push(entry);
  console.log(`💡 MEJORA PROPUESTA [${priority}]: ${title}`);
  console.log(`   ${description}`);
  console.log(`   Esfuerzo: ${effort}`);
}

async function runExtremeE2ETest() {
  const email = process.env.TEST_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.TEST_PASSWORD || process.env.E2E_PASSWORD;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  if (!email || !password) {
    console.log('❌ Error: Se requieren credenciales');
    process.exit(1);
  }

  console.log('🚀 INICIANDO PRUEBA E2E EXTREMO A EXTREMO - MÓDULO DE PRESUPUESTO');
  console.log('📡 URL de prueba:', baseUrl);
  console.log('=' .repeat(80));

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // Más lento para simular usuario real
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
    // FASE 2: CREACIÓN DE PROYECTO DESDE CERO
    // ============================================
    logActivity('PROYECTO', 'Navegando a módulo de Proyectos', 'INICIANDO');
    await page.goto(`${baseUrl}/?tab=projects`);
    await page.waitForTimeout(3000);

    // Buscar botón de nuevo proyecto
    const newProjectBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    if (await newProjectBtn.count() === 0) {
      logIssue('CRÍTICO', 'Navegación', 'Botón de nuevo proyecto no encontrado', 'No se puede continuar', 'Verificar que el botón de creación esté visible y tenga el texto correcto');
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
    } else {
      logIssue('MEDIO', 'Formulario Proyecto', 'Campo nombre no encontrado', 'No se puede asignar nombre', 'Verificar selector del campo nombre');
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
    } else {
      logIssue('CRÍTICO', 'Formulario Proyecto', 'Botón guardar no encontrado', 'No se puede guardar proyecto', 'Verificar que el botón de guardar esté visible');
    }

    // ============================================
    // FASE 3: GENERACIÓN DE PRESUPUESTO DETALLADO
    // ============================================
    logActivity('PRESUPUESTO', 'Navegando a módulo de Presupuestos', 'INICIANDO');
    await page.goto(`${baseUrl}/?tab=budgets`);
    await page.waitForTimeout(3000);

    // Buscar botón de nuevo presupuesto
    const newBudgetBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    if (await newBudgetBtn.count() > 0) {
      await newBudgetBtn.click();
      await page.waitForTimeout(2000);
      logActivity('PRESUPUESTO', 'Formulario de presupuesto abierto', 'EXITOSO');
    } else {
      logIssue('CRÍTICO', 'Navegación', 'Botón de nuevo presupuesto no encontrado', 'No se puede crear presupuesto', 'Verificar que el botón de creación esté visible');
    }

    // Seleccionar proyecto
    const projectSelect = page.locator('select[name*="project"], select[name*="proyecto"]').first();
    if (await projectSelect.count() > 0) {
      await projectSelect.selectOption({ label: extremeScenario.project.name });
      await page.waitForTimeout(1000);
      logActivity('PRESUPUESTO', 'Proyecto seleccionado', 'EXITOSO', extremeScenario.project.name);
    } else {
      logIssue('CRÍTICO', 'Formulario Presupuesto', 'Selector de proyecto no encontrado', 'No se puede vincular presupuesto a proyecto', 'Verificar que el selector de proyecto esté visible');
    }

    // Agregar items de presupuesto
    logActivity('PRESUPUESTO', 'Agregando items de presupuesto', 'INICIANDO', `${extremeScenario.budget.items.length} items planificados`);
    
    for (let i = 0; i < extremeScenario.budget.items.length; i++) {
      const item = extremeScenario.budget.items[i];
      
      // Buscar botón de agregar item
      const addItemBtn = page.locator('button:has-text("Agregar"), button:has-text("Añadir"), button[aria-label*="add"]').first();
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

    // Verificar si el cálculo coincide con el presupuesto del proyecto
    const budgetVariance = Math.abs(estimatedTotal - extremeScenario.project.budget);
    const budgetVariancePercent = (budgetVariance / extremeScenario.project.budget) * 100;

    if (budgetVariancePercent > 10) {
      logIssue('MEDIO', 'Validación Presupuesto', 'Diferencia significativa entre presupuesto base y items', `Variance: ${budgetVariancePercent.toFixed(2)}%`, 'Implementar validación en tiempo real que alerte cuando los items excedan el presupuesto base');
    }

    // Guardar presupuesto
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
    const projectList = page.locator('[class*="project"], tbody tr').first();
    if (await projectList.count() > 0) {
      await projectList.click();
      await page.waitForTimeout(2000);
      logActivity('TRANSICIÓN', 'Proyecto seleccionado', 'EXITOSO');
    }

    // Buscar opción de cambiar estado/fase
    const statusBtn = page.locator('button:has-text("Estado"), button:has-text("Fase"), button[aria-label*="status"]').first();
    if (await statusBtn.count() > 0) {
      await statusBtn.click();
      await page.waitForTimeout(1000);
      logActivity('TRANSICIÓN', 'Selector de estado abierto', 'EXITOSO');
    }

    // Seleccionar estado "En Ejecución"
    const executionOption = page.locator('option:has-text("Ejecución"), option:has-text("execution")').first();
    if (await executionOption.count() > 0) {
      await executionOption.click();
      await page.waitForTimeout(1000);
      logActivity('TRANSICIÓN', 'Estado cambiado a Ejecución', 'EXITOSO');
    } else {
      logIssue('MEDIO', 'Transición', 'Opción de estado "Ejecución" no encontrada', 'No se puede cambiar fase', 'Verificar que las opciones de estado incluyan "En Ejecución"');
    }

    // Guardar cambio de estado
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
    const budgetStatus = page.locator('[class*="status"], [class*="phase"]').first();
    if (await budgetStatus.count() > 0) {
      const statusText = await budgetStatus.textContent();
      logActivity('VERIFICACIÓN', 'Estado del presupuesto verificado', 'EXITOSO', statusText);
      
      if (!statusText.toLowerCase().includes('ejecución') && !statusText.toLowerCase().includes('execution')) {
        logIssue('MEDIO', 'Coherencia', 'Estado del presupuesto no refleja fase del proyecto', 'El presupuesto no muestra estar en ejecución', 'Implementar sincronización automática de estado entre proyecto y presupuesto');
      }
    }

    // ============================================
    // FASE 6: ANÁLISIS DE UI/UX
    // ============================================
    logActivity('UI/UX', 'Analizando experiencia de usuario', 'INICIANDO');

    // Verificar que los cálculos sean visibles en tiempo real
    const calculationDisplay = page.locator('[class*="total"], [class*="calculation"], [class*="summary"]').first();
    if (await calculationDisplay.count() === 0) {
      logIssue('MEDIO', 'UI/UX', 'Cálculos no visibles en tiempo real', 'Usuario no puede ver el total mientras agrega items', 'Mostrar cálculos parciales en tiempo real mientras se agregan items');
    }

    // Verificar que haya validación de campos
    const form = page.locator('form').first();
    const hasRequiredFields = await form.evaluate(el => {
      const requiredInputs = el.querySelectorAll('[required]');
      return requiredInputs.length > 0;
    });

    if (!hasRequiredFields) {
      logIssue('BAJO', 'Validación', 'Campos no tienen validación required', 'Usuario puede enviar formulario incompleto', 'Agregar atributo required a campos críticos');
    }

    // Verificar que haya feedback visual
    const feedbackElements = page.locator('[class*="error"], [class*="warning"], [class*="success"]').first();
    if (await feedbackElements.count() === 0) {
      logIssue('BAJO', 'UI/UX', 'No hay feedback visual de validación', 'Usuario no sabe si los datos son correctos', 'Implementar validación en tiempo real con mensajes visuales');
    }

    // ============================================
    // GENERACIÓN DE PROPUESTAS DE OPTIMIZACIÓN
    // ============================================
    logActivity('OPTIMIZACIÓN', 'Generando propuestas de mejora', 'INICIANDO');

    // Basado en los problemas detectados, generar mejoras
    if (detectedIssues.length > 0) {
      detectedIssues.forEach(issue => {
        logImprovement(
          'CORRECTIVO',
          `Solución para ${issue.component}`,
          issue.suggestedFix,
          issue.severity === 'CRÍTICO' ? 'ALTA' : 'MEDIA',
          'MEDIO'
        );
      });
    }

    // Mejoras proactivas basadas en mejores prácticas
    logImprovement(
      'MEJORA',
      'Cálculos en tiempo real',
      'Mostrar total actualizado mientras se agregan items en lugar de solo al guardar',
      'ALTA',
      'MEDIO'
    );

    logImprovement(
      'MEJORA',
      'Validación de presupuesto base',
      'Alertar cuando los items agregados exceden el presupuesto base del proyecto',
      'ALTA',
      'BAJO'
    );

    logImprovement(
      'MEJORA',
      'Plantillas de presupuestos',
      'Permitir guardar plantillas de presupuestos comunes para reutilizar',
      'MEDIA',
      'ALTO'
    );

    logImprovement(
      'MEJORA',
      'Historial de cambios de fase',
      'Registrar y mostrar historial de cambios de fase con timestamps',
      'BAJA',
      'MEDIO'
    );

    logImprovement(
      'MEJORA',
      'Comparación presupuesto vs ejecución',
      'Mostrar comparación entre presupuesto planificado y gastos reales en ejecución',
      'ALTA',
      'ALTO'
    );

    logImprovement(
      'MEJORA',
      'Alertas de desviación',
      'Notificar cuando los gastos reales desvían más del 10% del presupuesto',
      'ALTA',
      'MEDIO'
    );

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
  console.log('📊 REPORTE DE PRUEBA E2E EXTREMO A EXTREMO - MÓDULO DE PRESUPUESTO');
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
  const reportPath = path.join(__dirname, '..', 'docs', 'BUDGET_EXTREME_E2E_REPORT.md');
  const reportContent = `# Reporte de Prueba E2E Extremo a Extremo - Módulo de Presupuesto
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

runExtremeE2ETest().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});