/**
 * Script para limpiar todos los datos locales de Dexie (IndexedDB)
 * Esto prepara la aplicación para empezar con datos reales desde Supabase
 */

import Dexie from 'dexie';

const DB_NAME = 'ConstructoraWM_OfflineDB';

async function clearLocalDatabase() {
  console.log('🗑️  Limpiando base de datos local...');

  try {
    // Borrar la base de datos completamente
    await Dexie.delete(DB_NAME);
    console.log('✅ Base de datos local eliminada exitosamente');
    console.log('📊 La base de datos se recreará automáticamente con el nuevo schema (versión 2)');
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  }
}

clearLocalDatabase().then(() => {
  console.log('✨ Limpieza completada. La aplicación está lista para datos reales.');
  process.exit(0);
});
