# Informe de inconsistencias detectadas en la suite ERP/PMIS

## Resumen ejecutivo

Se revisó la arquitectura real del proyecto y se validó el estado de ejecución con compilación y pruebas. La app compila correctamente y la suite de pruebas actual pasó (7/7), pero existen inconsistencias funcionales y de datos que pueden generar fallos operativos, divergencia entre módulos y corrupción de estado al trabajar con la base remota y el almacenamiento local offline.

## Evidencia verificada

- Compilación: `npm run build` ✅
- Pruebas: `npm test` ✅ (7 tests pasaron)

## Hallazgos priorizados

### 1) Persistencia dual y origen de verdad mezclado

**Problema**
La suite mezcla tres modos de escritura/lectura:
- almacenamiento local Dexie
- sincronización manual con Supabase
- escrituras directas a Supabase desde componentes UI

Esto crea un sistema con más de un origen de verdad.

**Ejemplos**
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) guarda localmente y además invoca server actions.
- [components/warehouse/WarehouseManager.tsx](components/warehouse/WarehouseManager.tsx) escribe directamente a Supabase desde el componente.
- [components/warehouse/SupplierManager.tsx](components/warehouse/SupplierManager.tsx) y [components/warehouse/PurchaseOrderManager.tsx](components/warehouse/PurchaseOrderManager.tsx) usan operaciones locales con estados de sincronización inconsistentes.

**Riesgo**
Un mismo registro puede existir con estado local diferente al remoto, y el módulo que lo lee puede mostrar datos distintos según la fuente consultada.

---

### 2) Inconsistencia de estados de sincronización

**Problema**
No existe una convención única para los estados de sincronización. Se usan valores como `synced`, `created_offline`, `updated_offline`, `pending` y `sync_failed` en diferentes módulos, pero la lógica de negocio no siempre los trata igual.

**Ejemplos**
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) usa `created_offline` para nuevos proyectos.
- [components/warehouse/SupplierManager.tsx](components/warehouse/SupplierManager.tsx) usa `pending` para nuevos proveedores.
- [components/warehouse/WarehouseManager.tsx](components/warehouse/WarehouseManager.tsx) usa `created_offline` y además actualiza Supabase de forma directa.

**Riesgo**
El motor de sincronización puede tomar decisiones erróneas y marcar un registro como ya sincronizado cuando en realidad no está completamente persistido en el servidor.

---

### 3) Eliminaciones no consistentes con la lógica de negocio

**Problema**
Las eliminaciones se manejan de forma dispersa y no siempre con el mismo contrato. Algunas operaciones encolan un borrado remoto, otras eliminan sólo localmente, y otras modifican referencias para evitar errores de integridad.

**Ejemplos**
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) elimina localmente y encola borrado remoto para proyectos.
- [components/warehouse/SupplierManager.tsx](components/warehouse/SupplierManager.tsx) elimina localmente y además limpia órdenes de compra asociadas.
- [components/budgets/BudgetCalculator.tsx](components/budgets/BudgetCalculator.tsx) intenta borrar items del presupuesto con `queueDelete`, pero el ID usado no es un UUID de servidor, por lo que la eliminación remota puede no registrarse correctamente.

**Riesgo**
Se pueden dejar registros huérfanos, objetos remotos sin borrar o referencias rotas entre proyectos, órdenes y presupuestos.

---

### 4) Integración incompleta entre módulos clave

**Problema**
Hay módulos que deberían actualizarse entre sí y no lo hacen de manera consistente.

**Casos detectados**
- Presupuestos → Almacén: existe un puente en [lib/integrations/budgetToWarehouse.ts](lib/integrations/budgetToWarehouse.ts), pero su uso está acoplado a una lógica muy específica y no se garantiza que cada cambio de presupuesto actualice el stock de forma consistente.
- Proyectos → Presupuestos → Avance: [lib/hooks/useProjectProgress.ts](lib/hooks/useProjectProgress.ts) calcula progreso de forma local y no toma en cuenta todos los contextos del presupuesto ni del estado financiero.
- Bitácora → Control de avance: [components/project/ProjectLogManager.tsx](components/project/ProjectLogManager.tsx) y [components/progress/ProgressTracker.tsx](components/progress/ProgressTracker.tsx) operan como módulos separados y no comparten una única fuente de verdad para progresos físicos/financieros.

**Riesgo**
El usuario puede ver un presupuesto, un stock y un avance que no reflejan el mismo estado de negocio.

---

### 5) Lectura remota y lectura local no están alineadas

**Problema**
Algunos módulos leen primero la base local y luego intentan complementar con Supabase, mientras que otros leen solo Dexie y otros consultan Supabase directamente.

**Ejemplos**
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) carga proyectos desde Dexie y, si hay conexión, intenta traer desde Supabase.
- [components/warehouse/WarehouseManager.tsx](components/warehouse/WarehouseManager.tsx) hace lecturas tanto locales como de Supabase dentro del mismo componente.
- [lib/utils/offlineSync.ts](lib/utils/offlineSync.ts) realiza pull y push con reglas específicas, pero la UI no siempre sigue ese modelo.

**Riesgo**
Se pueden mostrar listas incompletas, datos viejos o estados temporales inconsistentes dependiendo de la ruta de carga usada.

---

### 6) Escrituras directas a Supabase desde componentes UI

**Problema**
Hay operaciones de CRUD que se ejecutan desde el componente y no pasan por una capa de servicio unificada.

**Ejemplos**
- [components/warehouse/WarehouseManager.tsx](components/warehouse/WarehouseManager.tsx)
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) (server action)
- [components/budgets/BudgetCalculator.tsx](components/budgets/BudgetCalculator.tsx) (escribe localmente y no se ve una capa de sincronización unificada para presupuestos)

**Riesgo**
Se rompe la trazabilidad y la consistencia transaccional. Un fallo intermedio puede dejar el estado local y remoto desalineado.

---

### 7) Riesgo de IDs y mapeo de relaciones

**Problema**
El sistema usa IDs locales y UUIDs de servidor, pero no hay una regla clara de transformación para todas las relaciones FK.

**Ejemplos**
- [lib/utils/offlineSync.ts](lib/utils/offlineSync.ts) remapea relaciones entre tablas al sincronizar.
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) genera un UUID local que puede ser interpretado como servidor por funciones de detección.

**Riesgo**
Un proyecto, presupuesto, detalle, orden o empleado puede terminar con relaciones a un record que no existe en el servidor o que fue actualizado con otro ID.

---

### 8) Inconsistencias de UX y responsividad móvil

**Problema**
Aunque hay mejoras de UI, aún quedan zonas donde la interacción no es completamente estable en móvil o no ofrece feedback consistente.

**Ejemplos**
- [app/page.tsx](app/page.tsx) usa navegación por tabs y swipe, pero la carga y el cambio de tab no siempre garantizan estados de carga claros.
- [components/dashboard/ProjectManager.tsx](components/dashboard/ProjectManager.tsx) y [components/warehouse/WarehouseManager.tsx](components/warehouse/WarehouseManager.tsx) tienen formularios de tamaño razonable, pero no siempre hay validación paralela y feedback de error uniforme.

**Riesgo**
En dispositivos móviles, los usuarios pueden perder contexto de si un registro fue guardado, actualizado o eliminado.

---

## Recomendación de corrección prioritaria

Para que la suite funcione de forma robusta, la corrección debería seguir este orden:

1. Unificar CRUD en una capa de servicio única para local + remoto.
2. Definir un estado de sincronización estándar y obligatorio para cada entidad.
3. Centralizar escrituras y borrados para evitar doble persistencia.
4. Alinear módulos de negocio alrededor de una única fuente de verdad para proyectos, presupuestos, almacén y avance.
5. Añadir validación transaccional y feedback visual claro en formularios y botones.

## Conclusión

El proyecto está funcional en build y pruebas, pero presenta inconsistencias de arquitectura y negocio que pueden afectar gravemente la confiabilidad operativa si se usan datos reales, cambios simultáneos o sincronización intermitente. El principal problema no es la UI, sino la falta de una capa de persistencia unificada y de una política de estados consistente para crear, actualizar, leer y eliminar registros.
