# PWA & 100% OFFLINE SYNCHRONIZATION GUIDE
## CONSTRUCTORA WM/M&S - SYSTEM ARCHITECTURE

Arquitectura offline-first con `Dexie.js` (IndexedDB) como fuente local y `Supabase`
(PostgreSQL) como remoto. La app usa la anon key sin login (las políticas RLS son
"all access" para anon en todas las tablas).

---

## 1. MODELO DE SYNC

- **Lectura:** la UI siempre lee primero de Dexie (local) para velocidad.
- **Escritura:** se guarda local primero con un `sync_status`; el motor empuja a Supabase.
- **Motor:** `lib/utils/offlineSync.ts` (`syncOfflineData`) sincroniza las 12 tablas en
  orden de dependencias (padres antes que hijos) y luego procesa borrados pendientes.
- **Disparo:** `components/ui/SyncProvider.tsx` corre sync al montar la app, al volver
  online (`online`), al recuperar el foco (`visibilitychange`) y cada 60 segundos.

### Estados `sync_status`
| Estado | Significado |
|--------|-------------|
| `synced` | Coincide con el servidor. |
| `created_offline` | Creado sin conexión; el motor hará INSERT (id local). |
| `updated_offline` | Editado sin conexión; el motor hará UPDATE si tiene server id, si no INSERT. |
| `pending` | Pendiente de empujar (insert). |
| `deleted` | (tombstone local) No se envía al servidor; la fila local se borra. |

Regla clave: una fila con id **numérico** nunca se ha subido → siempre INSERT;
una fila con **UUID** del servidor → UPDATE.

### Remapeo de FKs (cascada)
Cuando un padre se inserta en el servidor, el motor remapea las FKs de los hijos
locales al nuevo server id (`project_id`, `supplier_id`, `employee_id`, `budget_id`,
`parent_id`, `purchase_order_id`) para mantener la consistencia local.

---

## 2. BORRADOS (TOMBSTONES / DELETE DEFERRED)

Al eliminar un registro ya sincronizado, el handler del módulo llama a `queueDelete()`
(`lib/utils/offlineSync.ts`):

- Encola un registro en la tabla Dexie `pendingDeletes` (`{ table, serverId }`).
- Borra la fila local de inmediato (desaparece al instante de la UI).
- Si hay conexión, dispara `syncOfflineData()` → propagación inmediata al servidor.
- Sin conexión, queda encolado; el motor lo procesa al reconectarse:
  1. `DELETE` en Supabase por server id (idempotente).
  2. Limpieza local de la entrada `pendingDeletes`.

Detalles de FK:
- `suppliers` usa `ON DELETE RESTRICT` hacia `purchase_orders` → el motor borra
  primero las OC del proveedor antes de eliminar al proveedor.
- El resto de FKs usan `CASCADE`/`SET NULL` del lado del servidor.

---

## 3. REALTIME (CAMBIOS EN VIVO)

`components/ui/RealtimeProvider.tsx` (montado en `app/layout.tsx`) se suscribe a
`postgres_changes` de las 12 tablas (`supabase_realtime` habilitado por la migración
`20250131000006_enable_realtime_and_anon_access.sql`).

- INSERT/UPDATE del servidor → `put` en Dexie con `sync_status: 'synced'`.
- DELETE del servidor → elimina la fila local y limpia su `pendingDeletes`.
- **No sobrescribe** filas locales con cambios pendientes
  (`created_offline`/`updated_offline`/`pending`): gana lo local y el motor empuja después.
- Solo funciona con conexión; los cambios de otros dispositivos se reflejan en vivo.

---

## 4. SEGURIDAD / RLS

Las políticas RLS permiten acceso total a la anon key en las 12 tablas
(`USING (true)`), requerido para que el motor de sync y Realtime funcionen sin login.
La migración 00006 agregó estas políticas a `clients`, `project_logs`, `suppliers`,
`purchase_orders` y `purchase_order_items`.
