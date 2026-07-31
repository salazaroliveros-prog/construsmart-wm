# Instrucciones para Limpiar Datos Locales de Dexie

Dado que Dexie.js usa IndexedDB (que solo funciona en el navegador), la limpieza de datos debe hacerse desde el navegador directamente.

## Método 1: DevTools (Recomendado)

1. Abra la aplicación en: http://localhost:3000
2. Presione F12 para abrir DevTools
3. Vaya a la pestaña "Application" (o "Aplicación")
4. En el panel izquierdo, expanda "Storage" y luego "IndexedDB"
5. Busque "ConstructoraWM_OfflineDB"
6. Haga clic derecho sobre la base de datos y seleccione "Delete database"
7. Recargue la página (F5)

## Método 2: Console

1. Abra la aplicación en: http://localhost:3000
2. Presione F12 para abrir DevTools
3. Vaya a la pestaña "Console"
4. Ejecute el siguiente comando:

```javascript
indexedDB.deleteDatabase('ConstructoraWM_OfflineDB').onsuccess = () => {
  console.log('✅ Base de datos eliminada. Recargue la página.');
  location.reload();
};
```

## Método 3: Configuración del Navegador

1. Abra Chrome/Edge
2. Vaya a: chrome://settings/content/all (o edge://settings/content/all)
3. Busque "Cookies and other site data"
4. Busque "localhost:3000"
5. Haga clic en el ícono de basura para limpiar todos los datos
6. Recargue la aplicación

## Qué Sucede Después de Limpiar

Al recargar la página:
- La base de datos se recreará automáticamente con el nuevo schema (versión 2)
- Todas las tablas estarán vacías
- La aplicación empezará a sincronizar datos desde Supabase cuando esté conectada
- La aplicación funcionará en modo offline hasta que se conecte a Supabase

## Schema Actualizado (Versión 2)

El nuevo schema incluye:
- Campo `updated_at` en todas las tablas
- `sync_status` corregido para usar siempre 'synced', 'created_offline', 'updated_offline'
- Índices mejorados para rendimiento
