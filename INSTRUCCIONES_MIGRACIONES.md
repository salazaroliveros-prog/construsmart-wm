# Instrucciones para Ejecutar Migraciones SQL en Supabase

## Método 1: SQL Editor (Recomendado)

1. Ve al dashboard de Supabase: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld
2. Navega a **SQL Editor** en el menú lateral izquierdo
3. Crea una nueva consulta (New Query)
4. Copia el contenido del archivo `supabase-migrations.sql`
5. Pega el SQL en el editor
6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Verifica que todas las tablas se crearon exitosamente

## Método 2: Via CLI (si hay suficiente memoria)

```bash
# Asegúrate de estar en el directorio del proyecto
cd C:\Users\wilso\Documents\APPS\CONTROL_SEGUIMIENTO_APP_VoL_10

# Verificar conexión
supabase status

# Ejecutar migraciones
supabase db push
```

## Verificación

Después de ejecutar las migraciones, verifica que las tablas existen ejecutando:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver las siguientes tablas:
- projects
- budgets
- budget_items
- budget_item_breakdowns
- financial_transactions
- payroll_employees
- payroll_records
- warehouse_stock

## Variables de Entorno en Vercel

Después de ejecutar las migraciones, configura las variables de entorno en Vercel:

1. Ve a: https://vercel.com/proyectoswm/control-constructora-wm/settings/environment-variables
2. Agrega las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://yibjsruoxjlgdnkgylld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8
```

3. Haz clic en **Save**
4. Re-deploy la aplicación:
```bash
vercel --prod --yes
```

## PWA - Instalación

La aplicación ya está configurada como PWA. Para instalarla:

1. Abre la aplicación en Chrome: https://control-constructora-wm.vercel.app
2. Verás un icono de instalación en la barra de direcciones (o un prompt)
3. Haz clic en "Instalar" o "Add to Home Screen"
4. La aplicación se instalará como una app nativa

El icono de la app es: `/public/logo.png`
