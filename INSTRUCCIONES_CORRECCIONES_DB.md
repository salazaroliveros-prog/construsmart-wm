# Instrucciones para Corregir Schema de Base de Datos

## ⚠️ IMPORTANTE
Debido a problemas de memoria con el CLI de Supabase, estas correcciones deben ejecutarse **manualmente** en el SQL Editor de Supabase.

## 📋 Pasos para Ejecutar las Correcciones

### 1. Acceder al SQL Editor de Supabase

Ve a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/sql

### 2. Ejecutar las Correcciones

Copia y ejecuta el siguiente SQL **una sección a la vez** en el SQL Editor:

---

### SECCIÓN 1: Actualizar financial_transactions - Categorías

```sql
-- Primero eliminar la restricción CHECK existente
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_check;

-- Agregar nueva restricción con categorías locales
ALTER TABLE financial_transactions 
ADD CONSTRAINT financial_transactions_category_check 
CHECK (category IN ('materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 
                    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'));
```

**Ejecuta y verifica que no haya errores.**

---

### SECCIÓN 2: Actualizar budgets - Renombrar campos

```sql
-- Renombrar campos para coincidir con local
ALTER TABLE budgets 
RENAME COLUMN base_budget TO direct_cost,
RENAME COLUMN indirects TO indirect_percentage,
RENAME COLUMN contingencies TO contingency_percentage,
RENAME COLUMN utility TO profit_percentage,
RENAME COLUMN total_budget TO total_amount;

-- Actualizar tipos de datos de porcentajes
ALTER TABLE budgets 
ALTER COLUMN indirect_percentage TYPE DECIMAL(5,2),
ALTER COLUMN contingency_percentage TYPE DECIMAL(5,2),
ALTER COLUMN profit_percentage TYPE DECIMAL(5,2);
```

**Ejecuta y verifica que no haya errores.**

---

### SECCIÓN 3: Actualizar budget_items - Renombrar campos

```sql
-- Renombrar campos para coincidir con local
ALTER TABLE budget_items 
RENAME COLUMN unit_price TO unit_cost,
RENAME COLUMN total_price TO total_cost;
```

**Ejecuta y verifica que no haya errores.**

---

### SECCIÓN 4: Actualizar budget_item_breakdowns - Renombrar campos

```sql
-- Renombrar campos para coincidir con local
ALTER TABLE budget_item_breakdowns 
RENAME COLUMN unit_price TO unit_cost,
RENAME COLUMN total_price TO total_cost;
```

**Ejecuta y verifica que no haya errores.**

---

### SECCIÓN 5: Actualizar financial_transactions - Renombrar amount

```sql
-- Cambiar amount a total_cost para coincidir con local
ALTER TABLE financial_transactions 
RENAME COLUMN amount TO total_cost;
```

**Ejecuta y verifica que no haya errores.**

---

### SECCIÓN 6: Verificar los Cambios

```sql
-- Verificar financial_transactions
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'financial_transactions' 
AND column_name IN ('category', 'total_cost')
ORDER BY ordinal_position;

-- Verificar budgets
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

-- Verificar budget_items
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'budget_items' 
AND column_name IN ('unit_cost', 'total_cost')
ORDER BY ordinal_position;
```

**Los resultados deben mostrar los nuevos nombres de campos.**

---

## ✅ Verificación Final

Después de ejecutar todas las secciones, verifica que:

1. ✅ `financial_transactions.category` tiene las nuevas categorías locales
2. ✅ `budgets` tiene los campos renombrados (`direct_cost`, `indirect_percentage`, etc.)
3. ✅ `budget_items` tiene `unit_cost` y `total_cost`
4. ✅ `budget_item_breakdowns` tiene `unit_cost` y `total_cost`
5. ✅ `financial_transactions` tiene `total_cost` en lugar de `amount`

---

## 🔄 Prueba de Sincronización

Después de aplicar las correcciones:

1. Inicia la aplicación localmente
2. Crea un proyecto en modo offline
3. Crea transacciones financieras con las categorías locales
4. Conecta a internet
5. Verifica que la sincronización funcione correctamente

Si hay errores de sincronización, revisa la consola del navegador para mensajes específicos.
