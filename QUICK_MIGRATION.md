# 🚀 Migración APU - Ejecución Manual (Recomendado)

## Estado Actual
- ✅ Supabase CLI instalado y login realizado
- ✅ Proyecto vinculado: yibjsruoxjlgdnkgylld
- ❌ Sesión CLI expiró (requiere re-login interactivo)
- ❌ psql no disponible en Windows

## Solución: Usar SQL Editor de Supabase (2 minutos)

Esta es la forma más segura y recomendada de ejecutar migraciones.

### Paso 1: Abrir SQL Editor
1. Ir a: https://app.supabase.com/project/yibjsruoxjlgdnkgylld/sql/new
2. Ya estás autenticado en el navegador

### Paso 2: Copiar y Pegar SQL
Copia este SQL completo:

```sql
-- ============================================================================
-- APU Integration for CONSTRUCTORA WM/M&S
-- Adds support for APU (Análisis de Precios Unitarios) data in budget items
-- ============================================================================

-- Update budget_items table to include APU fields
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS apu_result JSONB,
ADD COLUMN IF NOT EXISTS apu_params JSONB;

-- Add comment to explain APU fields
COMMENT ON COLUMN budget_items.apu_result IS 'APU calculation results including breakdown (materials, labor, machinery)';
COMMENT ON COLUMN budget_items.apu_params IS 'APU input parameters for re-calculation';

-- Add index for budget_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);

-- Add index for project_id via budget for budget queries
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
```

### Paso 3: Ejecutar
1. Click en **"Run"** (botón verde)
2. Esperar mensaje de éxito
3. Verás: "Success. No rows returned"

### Paso 4: Verificar
Ejecutar en tu terminal:
```bash
node scripts/sync-database.js
```

Deberías ver:
```
✅ budget_items.apu_result
✅ budget_items.apu_params
```

## ¿Por qué Manual?

**Seguridad:** Supabase no permite ejecución arbitraria de SQL vía API REST por seguridad.  
**Confiable:** SQL Editor es el método oficial y recomendado.  
**Seguro:** Evita problemas de autenticación de CLI y conexión directa.  
**Auditado:** Todo se registra en el historial del proyecto.

## Resultado Después de Migración

Una vez ejecutado, el sistema tendrá:
- ✅ Persistencia completa de datos APU en base de datos remota
- ✅ Desglose detallado por categoría (materiales, labor, maquinaria)
- ✅ Capacidad de recálculo con parámetros guardados
- ✅ Integración completa con topografía (factores volumétricos)
- ✅ Sincronización offline ↔ online funcional

## Archivos Creados

- `supabase/migrations/add_apu_integration.sql` - SQL de migración
- `scripts/sync-database.js` - Script de verificación
- `DATABASE_MIGRATION.md` - Guía detallada
- `README_MIGRATION.md` - Guía rápida
- `QUICK_MIGRATION.md` - Este archivo

## Ayuda

Si tienes problemas:
1. Verifica que estás en el proyecto correcto: yibjsruoxjlgdnkgylld
2. Verifica el link: https://app.supabase.com/project/yibjsruoxjlgdnkgylld/sql/new
3. Asegúrate de tener permisos de admin en el proyecto
