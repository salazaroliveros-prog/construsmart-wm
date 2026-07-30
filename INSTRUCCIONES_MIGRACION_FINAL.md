# ⚠️ INSTRUCCIONES CRÍTICAS - Migración de Base de Datos Requerida

## 🚨 Situación Detectada

El análisis de la base de datos remota de Supabase reveló que **faltan campos críticos** en la tabla `financial_transactions` que son necesarios para el funcionamiento correcto del módulo de finanzas.

## 📊 Campos Faltantes Detectados

### Tabla: `financial_transactions`
- ❌ `quantity` (DECIMAL) - Necesario para el cálculo de cantidades
- ❌ `unit` (TEXT) - Necesario para unidad de medida  
- ❌ `unit_cost` (DECIMAL) - Necesario para costos unitarios

## ✅ Estado Actual del Esquema

**Correcto:**
- ✅ Todas las tablas existen
- ✅ Categorías de financial_transactions correctas
- ✅ Campos de budgets renombrados correctamente (direct_cost, etc.)
- ✅ Campos de budget_items renombrados correctamente (unit_cost, total_cost)
- ✅ resource_type incluye 'subcontract'

**Pendiente:**
- ⚠️ Campos quantity, unit, unit_cost en financial_transactions

## 🔧 Solución - Ejecución Manual Requerida

La API REST de Supabase no permite ejecutar `ALTER TABLE` directamente, por lo que se requiere ejecución manual en el SQL Editor.

### SQL a Ejecutar

Copiar y ejecutar este SQL en el **SQL Editor** de Supabase:

```sql
-- AGREGAR CAMPOS FALTANTES A FINANCIAL_TRANSACTIONS
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unid',
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15, 2) DEFAULT 0;
```

### Pasos Detallados

1. **Ir al dashboard de Supabase**: https://supabase.com/dashboard
2. **Seleccionar el proyecto**: `yibjsruoxjlgdnkgylld` (Constructora WM/M&S)
3. **Navegar a SQL Editor** en el menú izquierdo
4. **Copiar el SQL** proporcionado arriba
5. **Pegar en el editor**
6. **Hacer clic en "Run"** para ejecutar
7. **Verificar que no haya errores** en la consola

## ✅ Verificación Post-Migración

Después de ejecutar la migración, verificar ejecutando:

```bash
node scripts/detailed-schema-check.js
```

**Resultado esperado:**
```
📊 Verificando tabla financial_transactions (quantity, unit, unit_cost):
  ✅ Campos quantity, unit, unit_cost presentes
```

## 🚨 Impacto Sin Migración

**Si no se ejecuta esta migración:**
- ❌ El módulo `FinanceManager` fallará al intentar guardar transacciones
- ❌ Los cálculos de costos no funcionarán correctamente
- ❌ La sincronización de datos offline fallará
- ❌ La aplicación no podrá gestionar transacciones financieras

## 📝 Archivos Creados

Se han creado los siguientes archivos para documentar y facilitar el proceso:

1. **`supabase/migrations/20240730000002_add_missing_fields.sql`** - Migración formal
2. **`scripts/detailed-schema-check.js`** - Script de verificación
3. **`scripts/auto-migrate.js`** - Intento de migración automática (no disponible)
4. **`INSTRUCCIONES_MIGRACION_FINAL.md`** - Este documento

## 🔄 Próximos Pasos

1. **Ejecutar la migración manual** siguiendo los pasos anteriores
2. **Verificar la migración** con el script de validación
3. **Probar el módulo de finanzas** en la aplicación
4. **Confirmar que todo funciona correctamente**

## 💡 Nota Adicional

Esta discrepancia ocurrió porque el código local (`offlineStore.ts`) utiliza campos adicionales para mayor precisión en los cálculos financieros, pero la migración original no incluía estos campos. Esta migración corrige esa discrepancia.