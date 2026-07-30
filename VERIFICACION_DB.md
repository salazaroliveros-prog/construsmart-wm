# Verificación de Migraciones y Configuración de Variables de Entorno

## Estado Actual

✅ **Migración SQL se ejecutó** - El comando `supabase db push` reportó "Remote database is up to date"
✅ **Archivos creados** - Migraciones en `supabase/migrations/20240730000000_initial_schema.sql`
⚠️ **Verificación pendiente** - Necesitamos confirmar que las tablas existen en la base remota

## Pasos para Verificar Tablas en Supabase

### Método 1: SQL Editor (Más confiable)

1. Ve a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/sql
2. Crea una nueva consulta (New Query)
3. Copia y ejecuta este SQL:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'projects', 
  'budgets', 
  'budget_items', 
  'budget_item_breakdowns', 
  'financial_transactions', 
  'payroll_employees', 
  'payroll_records', 
  'warehouse_stock'
) 
ORDER BY table_name;
```

4. **Resultado esperado**: Deberías ver las 8 tablas listadas

### Si las tablas NO existen:

Ejecuta el archivo completo de migraciones:

1. Ve a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/sql
2. Crea una nueva consulta
3. Copia todo el contenido de `supabase-migrations.sql`
4. Ejecuta (Run)
5. Verifica de nuevo con el query de verificación

## Configurar Variables de Entorno en Vercel

### Método 1: Via Dashboard (Recomendado)

1. Ve a: https://vercel.com/proyectoswm/control-constructora-wm/settings/environment-variables
2. Haz clic en "Add New"
3. Agrega:

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://yibjsruoxjlgdnkgylld.supabase.co`
- Environment: Production, Preview, Development

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8`
- Environment: Production, Preview, Development

4. Guarda (Save)

### Método 2: Via CLI

```bash
cd C:\Users\wilso\Documents\APPS\CONTROL_SEGUIMIENTO_APP_VoL_10

# Agregar NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# When prompted: https://yibjsruoxjlgdnkgylld.supabase.co
# Sensitive: n

# Agregar NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# When prompted: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8
# Sensitive: n
```

## Re-deploy Después de Configurar Variables

```bash
cd C:\Users\wilso\Documents\APPS\CONTROL_SEGUIMIENTO_APP_VoL_10
vercel --prod --yes
```

## Instalar PWA

1. Abre: https://control-constructora-wm.vercel.app
2. Verás un icono de instalación en la barra de direcciones (↓ o +)
3. Haz clic en "Instalar" o "Add to Home Screen"
4. La app se instalará con el icono correcto

## Resumen de Estado

- ✅ Sidebar corregido (navegación funcional)
- ✅ PWA habilitado (icono correcto)
- ✅ Migraciones SQL creadas
- ⚠️ Verificar tablas en Supabase (SQL Editor)
- ⚠️ Configurar variables en Vercel
- ⚠️ Re-deploy después de configurar variables
