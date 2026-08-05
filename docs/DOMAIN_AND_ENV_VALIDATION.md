# REPORTE DE VALIDACIÓN DE DOMINIO Y CONFIGURACIÓN
## CONSTRUCTORA WM/M&S ERP SUITE - "CONSTRUYENDO EL FUTURO"

**Fecha:** 2026-08-03  
**Objetivo:** Validar dominio Vercel, configuración Supabase y variables de entorno

---

## ✅ VERIFICACIÓN DE DOMINIO VERCEL

### Dominio Principal Confirmado

**Dominio Verdadero:** https://construsmart-wm.vercel.app ✅

**Estado del Alias:**
- ✅ El dominio principal `https://construsmart-wm.vercel.app` es un alias permanente
- ✅ Este alias no cambia entre deployments
- ✅ Los deployments individuales tienen URLs temporales pero el alias principal se mantiene

**Aliases Actuales:**
- https://construsmart-wm.vercel.app (DOMINIO PRINCIPAL - PERMANENTE)
- https://construsmart-wm-proyectoswm.vercel.app
- https://construsmart-wm-git-main-proyectoswm.vercel.app

**Deployment Actual:**
- URL del deployment: https://construsmart-wm-kjz4qvj34-proyectoswm.vercel.app
- Alias principal: https://construsmart-wm.vercel.app (redirige al deployment actual)

**Conclusión:** ✅ El dominio principal es correcto y no cambiará en nuevos deployments

---

## 🔍 VERIFICACIÓN DE CONFIGURACIÓN SUPABASE

### URLs que DEBEN estar configuradas en Supabase Auth

**Site URL:**
- ✅ https://construsmart-wm.vercel.app

**Redirect URLs:**
- ✅ http://localhost:3000/
- ✅ https://construsmart-wm.vercel.app/
- ✅ https://construsmart-wm.vercel.app
- ✅ http://localhost:3000
- ✅ https://construsmart-wm.vercel.app/auth/callback
- ✅ https://construsmart-wm-*.vercel.app/auth/callback
- ✅ http://localhost:3000/auth/callback

### Configuración Recomendada para Vercel

Según la documentación de Supabase, para deployments con Vercel se recomienda:

**Site URL:**
- https://construsmart-wm.vercel.app

**Additional Redirect URLs:**
- http://localhost:3000/**
- https://*-proyectoswm.vercel.app/**

**Nota:** El wildcard `https://*-proyectoswm.vercel.app/**` permite preview URLs de Vercel.

---

## 🔧 VERIFICACIÓN DE VARIABLES DE ENTORNO VERCEL

### Variables Requeridas para Supabase

**Variables del .env local:**
```env
SUPABASE_URL=https://yibjsruoxjlgdnkgylld.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri
SUPABASE_SECRET_KEY=[REDACTED]
SUPABASE_JWKS_URL=https://yibjsruoxjlgdnkgylld.supabase.co/auth/v1/.well-known/jwks.json
NEXT_PUBLIC_SUPABASE_URL=https://yibjsruoxjlgdnkgylld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri
```

### Variables que DEBEN estar en Vercel

**Variables Requeridas:**
1. `NEXT_PUBLIC_SUPABASE_URL` - URL del proyecto Supabase
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave pública de Supabase
3. `SUPABASE_SECRET_KEY` - Clave secreta de Supabase (opcional para server-side)
4. `NEXT_PUBLIC_SITE_URL` - URL del sitio en producción (recomendado por Supabase)
5. `NEXT_PUBLIC_VERCEL_URL` - URL del deployment Vercel (automático de Vercel)

### Instrucciones para Verificar Variables en Vercel

**Paso 1: Ir al Dashboard de Vercel**
1. Navegar a https://vercel.com/dashboard
2. Seleccionar el proyecto: "construsmart-wm"

**Paso 2: Verificar Variables de Entorno**
1. Ir a Settings → Environment Variables
2. Verificar que las siguientes variables estén configuradas:

```
NEXT_PUBLIC_SUPABASE_URL=https://yibjsruoxjlgdnkgylld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_i7VPT8T3SSkW3__-ZUlZmw_xiT1Wbri
SUPABASE_SECRET_KEY=[TU_CLAVE_SECRETA]
NEXT_PUBLIC_SITE_URL=https://construsmart-wm.vercel.app
```

**Paso 3: Verificar Variables del Sistema**
Vercel proporciona automáticamente:
- `NEXT_PUBLIC_VERCEL_URL` - URL del deployment actual
- `VERCEL_URL` - URL del deployment actual

---

## 📋 INSTRUCCIONES PARA CONFIGURAR SUPABASE AUTH

### Paso 1: Ir al Dashboard de Supabase
1. Navegar a https://supabase.com/dashboard
2. Seleccionar el proyecto

### Paso 2: Configurar Site URL
1. Ir a Authentication → URL Configuration
2. En "Site URL", configurar:
   - https://construsmart-wm.vercel.app

### Paso 3: Configurar Redirect URLs
En "Redirect URLs", agregar las siguientes URLs:

```
http://localhost:3000/
https://construsmart-wm.vercel.app/
https://construsmart-wm.vercel.app
http://localhost:3000
https://construsmart-wm.vercel.app/auth/callback
https://construsmart-wm-*.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**Opcional para Preview URLs:**
```
http://localhost:3000/**
https://*-proyectoswm.vercel.app/**
```

### Paso 4: Guardar Configuración
1. Clic en "Save"
2. La configuración se aplicará inmediatamente

---

## 🎯 CONFIGURACIÓN RECOMENDADA PARA EL CÓDIGO

### Uso de Variables de Entorno Dinámicas

Para manejar correctamente los redirects en diferentes entornos, usar el siguiente patrón en el código:

```typescript
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // URL del sitio en producción
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // URL automática de Vercel
    'http://localhost:3000/'
  
  // Asegurar que incluya https:// cuando no sea localhost
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Asegurar que incluya trailing /
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

// Usar en auth callbacks
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: getURL(),
  },
})
```

---

## ✅ ESTADO DE VALIDACIÓN

| Componente | Estado | Detalles |
|------------|--------|----------|
| Dominio Vercel | ✅ Confirmado | https://construsmart-wm.vercel.app es el dominio principal permanente |
| Alias Vercel | ✅ Funcional | El alias principal no cambia entre deployments |
| Configuración Supabase | ⚠️ Requiere verificación manual | No se puede verificar vía MCP, requiere acceso al Dashboard |
| Variables de Entorno Vercel | ⚠️ Requiere verificación manual | No se puede verificar vía CLI, requiere acceso al Dashboard |
| URLs Supabase | ⚠️ Requiere configuración manual | Incluidas en instrucciones para configuración |

---

## 📝 ACCIONES REQUERIDAS

### 1. Verificar Variables de Entorno en Vercel (Recomendado)
- Ir a Vercel Dashboard → Settings → Environment Variables
- Verificar que todas las variables de Supabase estén configuradas
- Agregar `NEXT_PUBLIC_SITE_URL=https://construsmart-wm.vercel.app`

### 2. Verificar Configuración de Supabase Auth (Recomendado)
- Ir a Supabase Dashboard → Authentication → URL Configuration
- Verificar Site URL: https://construsmart-wm.vercel.app
- Verificar Redirect URLs (lista proporcionada arriba)
- Agregar URLs faltantes si es necesario

### 3. Implementar Código Dinámico (Opcional)
- Implementar la función `getURL()` para manejar redirects dinámicos
- Usar variables de entorno para diferentes entornos

---

## 🚀 CONCLUSIÓN

**Dominio Vercel:** ✅ Confirmado y estable  
**Configuración Supabase:** ⚠️ Requiere verificación manual en Dashboard  
**Variables de Entorno:** ⚠️ Requiere verificación manual en Vercel Dashboard  

**El dominio principal https://construsmart-wm.vercel.app es correcto y no cambiará en nuevos deployments.** Los deployments individuales tienen URLs temporales pero el alias principal siempre redirige al deployment más reciente.

**Para garantizar que la configuración de Supabase y las variables de entorno estén correctas, se recomienda verificar manualmente en los Dashboards correspondientes siguiendo las instrucciones proporcionadas.**

---

**Generado:** 2026-08-03  
**Prioridad:** Alta (configuración crítica)  
**Estado:** ⚠️ REQUIERE VERIFICACIÓN MANUAL
