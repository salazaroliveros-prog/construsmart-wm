/**
 * CONSTRUCTORA WM/M&S - MIGRACIÓN DE DATOS LEGACY
 * Slogan: "CONSTRUYENDO EL FUTURO"
 *
 * Script para migrar datos sin user_id (legacy) al modelo de tenant actual
 * Este script permite asignar user_id a datos antiguos o eliminarlos
 *
 * USO:
 * 1. Ejecutar en ambiente de desarrollo: npx tsx scripts/migrate-legacy-data.ts
 * 2. Revisar el reporte generado
 * 3. Decidir: asignar user_id o eliminar datos
 */

import { offlineDB } from '../lib/db/offlineStore';
import { getUserScope } from '../lib/utils/userScope';

interface LegacyDataReport {
  table: string;
  count: number;
  sampleIds: string[];
}

interface MigrationResult {
  tables: LegacyDataReport[];
  totalRecords: number;
  currentUserId?: string;
}

async function scanLegacyData(): Promise<MigrationResult> {
  console.log('🔍 Escaneando datos legacy sin user_id...\n');

  const currentUserId = await getUserScope();
  const report: MigrationResult = {
    tables: [],
    totalRecords: 0,
    currentUserId: currentUserId || undefined,
  };

  // Tablas a escanear
  const tables = [
    { name: 'projects', table: offlineDB.projects },
    { name: 'budgets', table: offlineDB.budgets },
    { name: 'budgetItems', table: offlineDB.budgetItems },
    { name: 'financialTransactions', table: offlineDB.financialTransactions },
    { name: 'payrollEmployees', table: offlineDB.payrollEmployees },
    { name: 'payrollRecords', table: offlineDB.payrollRecords },
    { name: 'warehouseStock', table: offlineDB.warehouseStock },
    { name: 'clients', table: offlineDB.clients },
    { name: 'suppliers', table: offlineDB.suppliers },
    { name: 'purchaseOrders', table: offlineDB.purchaseOrders },
    { name: 'projectLogs', table: offlineDB.projectLogs },
  ];

  for (const { name, table } of tables) {
    const allRecords = await table.toArray();
    const legacyRecords = allRecords.filter((r: any) => !r.user_id);

    if (legacyRecords.length > 0) {
      const sampleIds = legacyRecords.slice(0, 5).map((r: any) => r.id || r.code || 'N/A');
      report.tables.push({
        table: name,
        count: legacyRecords.length,
        sampleIds,
      });
      report.totalRecords += legacyRecords.length;
    }
  }

  return report;
}

async function assignUserIdToLegacy(userId: string): Promise<void> {
  console.log(`\n🔄 Asignando user_id "${userId}" a datos legacy...\n`);

  const tables = [
    offlineDB.projects,
    offlineDB.budgets,
    offlineDB.budgetItems,
    offlineDB.financialTransactions,
    offlineDB.payrollEmployees,
    offlineDB.payrollRecords,
    offlineDB.warehouseStock,
    offlineDB.clients,
    offlineDB.suppliers,
    offlineDB.purchaseOrders,
    offlineDB.projectLogs,
  ];

  let totalUpdated = 0;

  for (const table of tables) {
    const allRecords = await table.toArray();
    const legacyRecords = allRecords.filter((r: any) => !r.user_id);

    for (const record of legacyRecords) {
      if (record.id) {
        await table.update(record.id, { user_id: userId, updated_at: new Date().toISOString() });
        totalUpdated++;
      }
    }
  }

  console.log(`✅ ${totalUpdated} registros actualizados con user_id\n`);
}

async function deleteLegacyData(): Promise<void> {
  console.log('\n🗑️  Eliminando datos legacy sin user_id...\n');

  const tables = [
    offlineDB.projects,
    offlineDB.budgets,
    offlineDB.budgetItems,
    offlineDB.financialTransactions,
    offlineDB.payrollEmployees,
    offlineDB.payrollRecords,
    offlineDB.warehouseStock,
    offlineDB.clients,
    offlineDB.suppliers,
    offlineDB.purchaseOrders,
    offlineDB.projectLogs,
  ];

  let totalDeleted = 0;

  for (const table of tables) {
    const allRecords = await table.toArray();
    const legacyRecords = allRecords.filter((r: any) => !r.user_id);

    for (const record of legacyRecords) {
      if (record.id) {
        await table.delete(record.id);
        totalDeleted++;
      }
    }
  }

  console.log(`✅ ${totalDeleted} registros eliminados\n`);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  CONSTRUCTORA WM/M&S - MIGRACIÓN DE DATOS LEGACY           ║');
  console.log('║  "CONSTRUYENDO EL FUTURO"                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Paso 1: Escanear datos
    const report = await scanLegacyData();

    if (report.totalRecords === 0) {
      console.log('✅ No se encontraron datos legacy sin user_id');
      return;
    }

    // Mostrar reporte
    console.log('📊 REPORTE DE DATOS LEGACY:');
    console.log('═════════════════════════════════════════════════════════');
    console.log(`Usuario actual: ${report.currentUserId || 'No autenticado'}`);
    console.log(`Total de registros: ${report.totalRecords}\n`);

    for (const tableReport of report.tables) {
      console.log(`📁 ${tableReport.table}:`);
      console.log(`   Registros: ${tableReport.count}`);
      console.log(`   IDs de muestra: ${tableReport.sampleIds.join(', ')}\n`);
    }

    console.log('═════════════════════════════════════════════════════════\n');

    // Paso 2: Preguntar acción
    console.log('⚠️  Opciones disponibles:');
    console.log('   1. Asignar user_id actual a todos los datos legacy');
    console.log('   2. Asignar un user_id específico (requerirás el UUID)');
    console.log('   3. Eliminar todos los datos legacy (PERMANENTE)');
    console.log('   4. Cancelar y revisar manualmente\n');

    // Como esto es un script automatizado, solo mostramos las opciones
    // Para automatizar, el usuario puede modificar este script o pasar argumentos
    console.log('📝 Para ejecutar una acción específica, modifica este script con:');
    console.log('   - await assignUserIdToLegacy(userId)  // para asignar user_id');
    console.log('   - await deleteLegacyData()            // para eliminar datos\n');

    console.log('💡 Recomendación:');
    if (report.currentUserId) {
      console.log(`   Usa: await assignUserIdToLegacy("${report.currentUserId}")`);
      console.log("   Esto asignará tu user_id actual a todos los datos legacy\n");
    } else {
      console.log('   Primero inicia sesión para obtener tu user_id\n');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Descomenta la línea correspondiente para ejecutar la acción deseada:
main()
  // .then(() => assignUserIdToLegacy('TU_USER_ID_AQUI'))
  // .then(() => deleteLegacyData())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
