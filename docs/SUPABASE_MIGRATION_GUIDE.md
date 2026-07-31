# Guía de Migración de Supabase - Lógica de Negocio Interconectada

## Resumen de Cambios

Se han agregado nuevos campos a la base de datos local (IndexedDB) para implementar la lógica de negocio interconectada entre módulos. Estos cambios requieren una migración correspondiente en Supabase.

## Campos Nuevos Agregados

### 1. Tabla `projects`
- `budget_total` (DECIMAL) - Total del presupuesto calculado por el módulo de presupuestos
- `calculated_duration` (INTEGER) - Duración en días calculada por el módulo de presupuestos

### 2. Tabla `warehouse_stock`
- `project_id` (UUID, nullable) - ID del proyecto al que pertenece el material (para filtrado por proyecto)

### 3. Tabla `payroll_records`
- `project_id` (UUID, nullable) - ID del proyecto al que pertenece el registro de nómina (para filtrado por proyecto)

### 4. Tabla `budget_items`
- `is_custom` (BOOLEAN) - Indica si el item fue creado manualmente (true) o viene de la base de datos (false)
- `length_m` (DECIMAL) - Longitud en metros (para cálculos de losas)
- `width_m` (DECIMAL) - Ancho en metros (para cálculos de losas)
- `depth_m` (DECIMAL) - Profundidad en metros (para cálculos de losas)
- `height_m` (DECIMAL) - Altura en metros (para cálculos de losas)
- `slab_type` (TEXT) - Tipo de losa (solid, ribbed, waffle, etc.)

## Archivo de Migración

`supabase/migrations/20240730000004_add_business_logic_fields.sql`

## Cómo Aplicar la Migración en Supabase

### Opción 1: Supabase Dashboard (Recomendado)

1. **Vaya al Dashboard de Supabase:**
   - https://supabase.com/dashboard
   - Seleccione su proyecto

2. **Navegue al SQL Editor:**
   - Sidebar → SQL Editor
   - Haga clic en "New Query"

3. **Ejecute la migración:**
   - Copie el contenido del archivo `supabase/migrations/20240730000004_add_business_logic_fields.sql`
   - Péguelo en el SQL Editor
   - Haga clic en "Run"

4. **Verifique los cambios:**
   - Vaya a Table Editor
   - Revise cada tabla para confirmar que los nuevos campos fueron agregados

### Opción 2: Supabase CLI

Si tiene el Supabase CLI instalado:

```bash
# Asegúrese de estar en el directorio del proyecto
cd C:\Users\wilso\Documents\APPS\CONTROL_SEGUIMIENTO_APP_VoL_10

# Aplicar la migración
supabase db push
```

### Opción 3: psql (Línea de Comandos)

```bash
# Conéctese a su base de datos de Supabase
psql -h db.project-id.supabase.co -U postgres -d postgres

# Pegue el contenido de la migración
# Presione Ctrl+D para salir
```

## Verificación de la Migración

Después de aplicar la migración, verifique que los campos existen:

```sql
-- Verificar campos en projects
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('budget_total', 'calculated_duration');

-- Verificar campos en warehouse_stock
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'warehouse_stock' 
AND column_name = 'project_id';

-- Verificar campos en payroll_records
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
AND column_name = 'project_id';

-- Verificar campos en budget_items
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'budget_items' 
AND column_name IN ('is_custom', 'length_m', 'width_m', 'depth_m', 'height_m', 'slab_type');
```

## Índices Creados

La migración también crea los siguientes índices para optimizar el rendimiento:

- `idx_projects_budget_total` - En `projects.budget_total`
- `idx_projects_calculated_duration` - En `projects.calculated_duration`
- `idx_warehouse_stock_project_id` - En `warehouse_stock.project_id`
- `idx_payroll_records_project_id` - En `payroll_records.project_id`
- `idx_budget_items_is_custom` - En `budget_items.is_custom`

## Notas Importantes

1. **La migración usa `IF NOT EXISTS`**: Esto significa que es seguro ejecutarla múltiples veces. Si los campos ya existen, no se crearán de nuevo.

2. **Datos existentes**: Los campos nuevos pueden ser NULL inicialmente. Se llenarán cuando:
   - Se calcule un presupuesto (para `budget_total` y `calculated_duration`)
   - Se cree un material (para `warehouse_stock.project_id`)
   - Se cree un registro de nómina (para `payroll_records.project_id`)
   - Se use la calculadora de losas (para los campos de `budget_items`)

3. **Base de datos local**: La versión de IndexedDB se incrementó de 3 a 4. Esto limpiará los datos locales existentes. Los usuarios deberán recrear sus datos después de esta actualización.

## Pruebas Después de la Migración

1. **Crear un proyecto** con estado "Planificación"
2. **Calcular un presupuesto** para ese proyecto
3. **Verificar** que `budget_total` y `calculated_duration` se guardan en el proyecto
4. **Verificar** que los materiales del presupuesto se agregan al almacén
5. **Cambiar el proyecto a "Ejecución"**
6. **Verificar** que el proyecto aparece en el filtro de Finanzas
7. **Verificar** que Analytics muestra datos reales vs planificados

## Soporte

Si tiene problemas aplicando la migración, contacte al equipo de desarrollo o revise la documentación de Supabase:
- https://supabase.com/docs/guides/database/migrations
