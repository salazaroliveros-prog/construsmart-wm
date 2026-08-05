# CONSTRUCTORA WM/M&S - CONFIGURACIÓN DE URLS EN SUPABASE
# Slogan: "CONSTRUYENDO EL FUTURO"

## Configuración de URLs de Callback en Supabase

Para que la autenticación funcione correctamente, necesitas configurar las URLs de redirección en Supabase.

### 1. Acceder al Dashboard de Supabase

1. Ve a: https://yibjsruoxjlgdnkgylld.supabase.co
2. Inicia sesión con tu cuenta
3. Navega a: **Authentication** > **URL Configuration**

### 2. Configurar Site URL

En la sección **Site URL**, agrega:

```
https://control-constructora-wm.vercel.app
```

### 3. Configurar Redirect URLs

En la sección **Redirect URLs**, agrega las siguientes URLs (una por línea):

#### URLs de Producción:
```
https://control-constructora-wm.vercel.app/**
https://control-constructora-wm.vercel.app/auth/callback
```

#### URLs de Preview Deployments (para branches diferentes de main):
```
https://control-constructora-*.vercel.app/**
https://control-constructora-*.vercel.app/auth/callback
```

#### URLs de Desarrollo Local:
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### 4. Configurar Additional Redirect URLs (Opcional)

Si usas dominios personalizados en el futuro, agrégalos aquí también.

### 5. Guardar Cambios

Haz clic en **Save** para guardar la configuración.

---

## GitHub Repository Secrets

### ¿Necesitas GitHub Secrets?

**En este caso, NO necesitas agregar GitHub Secrets** porque:

1. **Las variables de entorno ya están en Vercel:**
   - Vercel maneja las variables de entorno para el build y runtime
   - Las variables `NEXT_PUBLIC_*` están configuradas en el dashboard de Vercel
   - Vercel hace el despliegue automáticamente desde GitHub

2. **No estás usando GitHub Actions:**
   - El build y despliegue se hace vía Vercel CLI
   - No hay workflows de GitHub Actions configurados
   - Vercel se conecta directamente a GitHub

### ¿Cuándo SÍ necesitarías GitHub Secrets?

Si en el futuro decides usar GitHub Actions para:
- Build personalizados
- Tests automatizados
- Deploy a otros servicios
- Scripts de CI/CD

Entonces necesitarías agregar:

#### GitHub Secrets Requeridos (si usas GitHub Actions):

```
NEXT_PUBLIC_SUPABASE_URL=<tu_url_de_supabase>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu_publishable_key>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key> (opcional, para operaciones de admin, guardalo en secreto)
```

**Para agregar GitHub Secrets:**
1. Ve a: https://github.com/salazaroliveros-prog/Control_Constructora/settings/secrets/actions
2. Haz clic en "New repository secret"
3. Agrega las variables mencionadas arriba

---

## Resumen de Configuración

### ✅ Configuración Actual (Vercel):

**Variables de Entorno en Vercel:**
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- ✅ NEXT_PUBLIC_APP_URL

**Despliegue Automático:**
- ✅ GitHub → Vercel via webhook
- ✅ Branch `main` → Production
- ✅ Branch `*` → Preview

### ⚠️ Pendiente (Supabase):

**URLs de Callback en Supabase:**
- ⚠️ Site URL: https://control-constructora-wm.vercel.app
- ⚠️ Redirect URLs: 
  - https://control-constructora-wm.vercel.app/**
  - https://control-constructora-*.vercel.app/**
  - http://localhost:3000/**

### ❌ No Requerido (GitHub Secrets):

- ❌ No necesitas GitHub Secrets para este proyecto
- ❌ Vercel maneja las variables de entorno
- ❌ GitHub Actions no está configurado

---

## Pasos para Completar la Configuración

### Paso 1: Configurar URLs en Supabase
1. Ve a: https://yibjsruoxjlgdnkgylld.supabase.co
2. Navega a: Authentication > URL Configuration
3. Agrega las URLs mencionadas arriba
4. Guarda los cambios

### Paso 2: Verificar Despliegue Automático
1. Haz un cambio pequeño en el código
2. Commit y push a GitHub
3. Verifica que Vercel despliegue automáticamente
4. Revisa: https://vercel.com/proyectoswm/control-constructora-wm/deployments

### Paso 3: Testear la Aplicación
1. Accede a: https://control-constructora-wm.vercel.app
2. Intenta iniciar sesión (si está implementado)
3. Verifica que no haya errores de conexión con Supabase
4. Revisa la consola del navegador para errores

---

## Solución de Problemas

### Error: "Invalid redirect URL" en Supabase
- Verifica que las URLs de callback estén configuradas correctamente
- Asegúrate de incluir el `/**` al final de cada URL
- Verifica que no haya espacios extra en las URLs

### Error: "Failed to fetch" en la aplicación
- Verifica que las variables de entorno estén configuradas en Vercel
- Revisa que las credenciales de Supabase sean correctas
- Verifica que las políticas RLS permitan el acceso anónimo

### Despliegue automático no funciona
- Verifica el webhook en GitHub: https://github.com/salazaroliveros-prog/Control_Constructora/settings/hooks
- Revisa la integración Git en Vercel: https://vercel.com/proyectoswm/control-constructora-wm/settings/git
- Asegúrate de que el proyecto esté vinculado al repositorio correcto
