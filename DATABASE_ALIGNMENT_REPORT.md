# ALINEACIÓN DE BASE DE DATOS REMOTA (SUPABASE)
## CONSTRUCTORA WM/M&S ERP SUITE - "CONSTRUYENDO EL FUTURO"

**Fecha:** 2026-08-03  
**Versión Suite:** v10  
**Versión DB Remota:** Requiere actualización a alinearse con offlineDB v7

---

## 📊 RESUMEN DE CAMBIOS REQUERIDOS

La auditoría E2E y las correcciones implementadas en la suite requieren los siguientes cambios en la base de datos remota (Supabase):

| # | Cambio | Tabla | Campo | Tipo | Descripción |
|---|--------|-------|-------|------|-------------|
| 1 | Agregar | `budget_items` | `project_id` | UUID (FK) | Referencia a project para integración warehouse |
| 2 | Agregar | `budget_items` | `actual_consumption` | NUMERIC | Consumo real de materiales desde almacén |
| 3 | Agregar | `budget_items` | `consumption_variance` | NUMERIC | Diferencia estimado vs real |
| 4 | Verificar | `financial_transactions` | Estructura existente | - | Soporta integración Payroll → Financial |
| 5 | Verificar | Todas las tablas | Índices sync_status | - | Para offline sync |

---

## 🔧 DETALLE DE CAMBIOS

### 1. CAMBIO: Agregar `project_id` a `budget_items`

**Razón:** Habilitar integración Warehouse → Budget tracking. El almacén necesita saber a qué proyecto pertenece cada item de presupuesto para registrar el consumo de materiales.

**SQL:**
```sql
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON budget_items(project_id);
COMMENT ON COLUMN budget_items.project_id IS 'Project reference for warehouse integration';
```

**Impacto:** Bajo - Campo opcional, no afecta datos existentes.

---

### 2. CAMBIO: Agregar `actual_consumption` a `budget_items`

**Razón:** Registrar la cantidad real de materiales consumidos desde el almacén para cada item de presupuesto.

**SQL:**
```sql
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS actual_consumption NUMERIC DEFAULT 0;
COMMENT ON COLUMN budget_items.actual_consumption IS 'Actual material quantity consumed from warehouse';
```

**Impacto:** Bajo - Campo con valor por defecto 0, no afecta datos existentes.

---

### 3. CAMBIO: Agregar `consumption_variance` a `budget_items`

**Razón:** Calcular la diferencia entre el consumo estimado y el real para identificar sobre-consumo o sub-consumo de materiales.

**SQL:**
```sql
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS consumption_variance NUMERIC DEFAULT 0;
COMMENT ON COLUMN budget_items.consumption_variance IS 'Variance between estimated and actual consumption';
```

**Impacto:** Bajo - Campo con valor por defecto 0, no afecta datos existentes.

---

### 4. VERIFICACIÓN: `financial_transactions` ya soporta integración Payroll

**Razón:** La tabla `financial_transactions` ya tiene todos los campos necesarios para la integración automática Payroll → Financial Transactions.

**Campos existentes requeridos:**
- `category` (TEXT) - Acepta valor 'mano_de_obra'
- `project_id` (UUID) - Referencia al proyecto
- `total_cost` (NUMERIC) - Monto total de la transacción
- `date` (TIMESTAMP) - Fecha de la transacción
- `description` (TEXT) - Descripción de la transacción

**SQL de verificación:**
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'financial_transactions'
AND column_name IN ('category', 'project_id', 'total_cost', 'date', 'description')
ORDER BY column_name;
```

**Impacto:** Ninguno - Solo verificación, no se requieren cambios.

---

### 5. VERIFICACIÓN: Índices de sync_status

**Razón:** Asegurar que todas las tablas tengan índices en `sync_status` para optimizar las consultas de offline sync.

**SQL de verificación:**
```sql
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN (
    'projects', 'budgets', 'budget_items', 'financial_transactions',
    'payroll_employees', 'payroll_records', 'warehouse_stock',
    'clients', 'project_logs', 'suppliers', 'purchase_orders', 'purchase_order_items'
)
AND indexname LIKE '%sync_status%'
ORDER BY tablename, indexname;
```

**Impacto:** Ninguno - Solo verificación.

---

## 📁 ARCHIVOS DE MIGRACIÓN

Se han creado los siguientes archivos SQL para ejecutar en Supabase:

### 1. `supabase/migrations/20260803000001_add_warehouse_consumption_tracking.sql`
- Agrega los campos de tracking de consumo a `budget_items`
- Crea índices para optimizar consultas
- Actualiza comentarios documentales

### 2. `supabase/migrations/20260803000002_verify_payroll_financial_integration.sql`
- Verifica que `financial_transactions` soporte la integración
- Documenta la integración Payroll → Financial
- No requiere cambios de esquema

### 3. `scripts/align-remote-db-with-suite.sql`
- Script completo de alineación
- Ejecuta todas las migraciones necesarias
- Incluye verificaciones de consistencia

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### Opción 1: Ejecutar migraciones individuales

1. Ir a Supabase SQL Editor
2. Ejecutar `20260803000001_add_warehouse_consumption_tracking.sql`
3. Ejecutar `20260803000002_verify_payroll_financial_integration.sql`

### Opción 2: Ejecutar script completo

1. Ir a Supabase SQL Editor
2. Ejecutar `scripts/align-remote-db-with-suite.sql`
3. Revisar el resultado de las verificaciones

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Después de ejecutar las migraciones, verificar:

1. **Campos agregados a budget_items:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'budget_items'
AND column_name IN ('project_id', 'actual_consumption', 'consumption_variance');
```

2. **Índices creados:**
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'budget_items' 
AND indexname LIKE '%project_id%' OR indexname LIKE '%consumption%';
```

3. **RLS Policies activas:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'budget_items';
```

---

## 🔄 COMPATIBILIDAD CON OFFLINE DB v7

La base de datos remota debe ser compatible con la versión 7 de offlineDB (Dexie):

**Dexie Schema v7:**
```typescript
this.version(7).stores({
  projects: 'id, code, name, sync_status, status, typology, created_at, updated_at, budget_total, calculated_duration',
  budgets: 'id, project_id, version, sync_status, created_at, updated_at',
  budgetItems: 'id, budget_id, project_id, parent_id, code, sync_status, item_order, created_at, updated_at, actual_consumption, consumption_variance',
  financialTransactions: 'id, project_id, type, category, date, sync_status, created_at, updated_at',
  // ... otras tablas
});
```

**Supabase Schema debe incluir:**
- `budget_items.project_id` (FK a projects)
- `budget_items.actual_consumption` (NUMERIC)
- `budget_items.consumption_variance` (NUMERIC)
- Índices en estos campos para optimización

---

## 📝 NOTAS ADICIONALES

### Integración Warehouse → Budget
- La función `recordMaterialConsumption()` en `lib/integrations/budgetToWarehouse.ts` actualizará estos campos
- El consumo se registra cuando se usa material del almacén
- La varianza se calcula automáticamente: `estimated - actual`

### Integración Payroll → Financial
- No requiere cambios de esquema
- La integración se maneja en el cliente (`PayrollManager.tsx`)
- Las transacciones se crean automáticamente con `category='mano_de_obra'`

### Offline Sync
- Los nuevos campos se sincronizan automáticamente
- Los índices optimizan las consultas de sync
- RLS policies protegen los datos

---

## 🎯 ESTADO FINAL

Después de ejecutar estas migraciones, la base de datos remota estará completamente alineada con:

- ✅ offlineDB v7 (Dexie schema)
- ✅ Integración Warehouse → Budget tracking
- ✅ Integración Payroll → Financial Transactions
- ✅ Correcciones de auditoría E2E aplicadas
- ✅ Consistencia de datos garantizada

---

**Generado:** 2026-08-03  
**Suite Version:** v10  
**DB Version:** Post-migration aligned with v7
