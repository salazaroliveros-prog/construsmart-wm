# CONSTRUCTORA WM/M&S - CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL
# Slogan: "CONSTRUYENDO EL FUTURO"

## Instrucciones para Configurar Variables de Entorno en Vercel

### 1. Acceder al Dashboard de Vercel
- Ve a: https://vercel.com/proyectoswm/control-constructora-wm/settings/environment-variables

### 2. Agregar las siguientes variables de entorno

Crea cada variable haciendo clic en "Add New" y selecciona el entorno:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://yibjsruoxjlgdnkgylld.supabase.co`
- **Environments:** 
  - ✅ Production
  - ✅ Preview
  - ✅ Development

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8`
- **Environments:**
  - ✅ Production
  - ✅ Preview
  - ✅ Development

#### Variable 3: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Value:** `sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri`
- **Environments:**
  - ✅ Production
  - ✅ Preview
  - ✅ Development

#### Variable 4: NEXT_PUBLIC_APP_URL
- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://control-constructora-wm.vercel.app`
- **Environments:**
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### 3. Verificar el Webhook de GitHub

1. **Ve a:** https://vercel.com/proyectoswm/control-constructora-wm/settings/git
2. **Verifica que:**
   - El repositorio de GitHub esté conectado
   - El webhook esté activo
   - Las reglas de despliegue estén configuradas:
     - Branch `main` → Production
     - Branch `*` → Preview

3. **Si el webhook no está activo:**
   - Ve a tu repositorio en GitHub: https://github.com/salazaroliveros-prog/Control_Constructora/settings/hooks
   - Verifica que haya un webhook de Vercel
   - Si no está presente, vuelve a conectar el repositorio desde Vercel

### 4. Forzar un Nuevo Despliegue

Después de configurar las variables de entorno:

1. **Ve a:** https://vercel.com/proyectoswm/control-constructora-wm/deployments
2. **Haz clic en "Redeploy"** en el último deployment
3. **Selecciona "Redeploy to Production"**

### 5. Verificar la Aplicación

1. **Accede a:** https://control-constructora-wm.vercel.app
2. **Verifica que:**
   - La aplicación carga correctamente
   - No hay errores de consola
   - La conexión con Supabase funciona (puedes crear un usuario o proyecto de prueba)

### 6. Probar Despliegue Automático

Para verificar que los despliegues automáticos funcionan:

1. **Haz un cambio pequeño en el código**
2. **Commit y push a GitHub:**
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. **Verifica que Vercel despliegue automáticamente**
4. **Revisa el deployment en:** https://vercel.com/proyectoswm/control-constructora-wm/deployments

---

## Solución de Problemas

### Si el webhook no funciona:
- Reinstala la integración de GitHub en Vercel
- Verifica que tengas permisos de administrador en el repositorio
- Revisa los logs del webhook en GitHub

### Si las variables de entorno no funcionan:
- Verifica que los nombres sean exactamente los especificados
- Asegúrate de que las variables estén configuradas en todos los entornos
- Haz un redeploy después de agregar las variables

### Si la aplicación no se conecta a Supabase:
- Verifica que las credenciales sean correctas
- Revisa que las políticas RLS estén configuradas en Supabase
- Verifica los logs de la aplicación en Vercel
