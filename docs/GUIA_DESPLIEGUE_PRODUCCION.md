# GUÍA DE DESPLIEGUE A PRODUCCIÓN
## CONSTRUCTORA WM/M&S V10 - "CONSTRUYENDO EL FUTURO"

**Fecha:** 2026-08-12  
**Versión:** 1.0.0  
**Estado:** Listo para despliegue

---

## 📋 PRE-REQUISITOS DE DESPLIEGUE

### 1. Variables de Entorno Requeridas

Configura estas variables en Vercel (Settings → Environment Variables):

```bash
# SUPABASE (OBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publicable
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon
SUPABASE_PUBLISHABLE_KEY=tu-clave-publicable
SUPABASE_SECRET_KEY=tu-clave-secreta
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role

# APP (OBLIGATORIO)
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app

# ADMINISTRADOR (OBLIGATORIO - REEMPLAZAR CON EMAIL REAL)
NEXT_PUBLIC_ADMIN_EMAIL=tu-email-real@example.com
ADMIN_EMAIL=tu-email-real@example.com

# NUEVOS SISTEMAS DE SEGURIDAD (RECOMENDADO)
LOG_LEVEL=1
DEBUG_MODULES=Auth,Sync
DEBUG_SENSITIVE=false
INACTIVITY_TIMEOUT_MINUTES=30
INACTIVITY_WARNING_MINUTES=5
```

### 2. Configuración de Supabase

Asegúrate de que tu proyecto Supabase tenga:

1. **Row Level Security (RLS) activado**
2. **Políticas de RLS configuradas** para todas las tablas
3. **Storage buckets creados** si se usan archivos
4. **Edge Functions configuradas** si se usan
5. **CORS configurado** para tu dominio Vercel

### 3. Configuración de Dominio

1. En Vercel, configura tu dominio personal si tienes uno
2. Actualiza `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_SITE_URL` con el dominio real
3. Configura DNS si usas dominio personal

---

## 🚀 PASOS DE DESPLIEGUE

### Paso 1: Conectar con Vercel

```bash
# Si aún no estás conectado
npx vercel login
```

### Paso 2: Desplegar a Vercel

```bash
# Despliegue inicial
npx vercel

# Despliegue a producción
npx vercel --prod
```

### Paso 3: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega todas las variables listadas arriba
4. Re-deploy la aplicación

### Paso 4: Verificar Despliegue

1. Visita la URL de producción
2. Verifica que la aplicación carga correctamente
3. Prueba el login con el email administrador
4. Verifica que las sincronizaciones funcionan
5. Prueba las funcionalidades principales

---

## ✅ CHECKLIST DE VERIFICACIÓN POST-DESPLIEGUE

### Seguridad
- [ ] Email administrador configurado correctamente
- [ ] Rate limiting funciona en login
- [ ] Cookies httpOnly están activas
- [ ] Dominios de imágenes restringidos funcionan
- [ ] Validación de dispositivo funciona

### Funcionalidad
- [ ] Login funciona correctamente
- [ ] Sincronización offline funciona
- [ ] CRUD de proyectos funciona
- [ ] CRUD de presupuestos funciona
- [ ] CRUD de transacciones funciona

### Performance
- [ ] Lazy loading de imágenes funciona
- [ ] Error boundaries capturan errores
- [ ] Loading states se muestran correctamente
- [ ] Tiempo de carga inicial aceptable

### Logs
- [ ] Logging seguro funciona
- [ ] Logs no exponen datos sensibles
- [ ] Logs estructurados se generan

---

## 🔧 CONFIGURACIÓN ADICIONAL

### Configuración de Supabase para Producción

1. **Activar Database Backups**
   - Dashboard → Database → Backups
   - Configura backups automáticos diarios

2. **Configurar Realtime**
   - Dashboard → Database → Replication
   - Habilita realtime para tablas necesarias

3. **Configurar Edge Functions**
   - Si usas edge functions, despliega desde Supabase CLI

### Configuración de Vercel para Producción

1. **Configurar Environment Variables**
   - Settings → Environment Variables
   - Agrega todas las variables requeridas

2. **Configurar Domains**
   - Settings → Domains
   - Agrega dominio personal si tienes uno

3. **Configurar Analytics**
   - Analytics → Web Vitals
   - Habilita para monitoreo de performance

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Supabase connection failed"
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea correcta
- Verifica que las claves sean válidas
- Verifica que el proyecto Supabase esté activo

### Error: "Authentication failed"
- Verifica que `ADMIN_EMAIL` esté configurado
- Verifica que el email exista en Supabase Auth
- Verifica que las políticas RLS permitan el acceso

### Error: "Rate limit exceeded"
- Esto es normal después de múltiples intentos fallidos
- Espera 10 minutos antes de reintentar
- Configura límites más altos si es necesario

### Error: "Images not loading"
- Verifica que los dominios en `next.config.ts` sean correctos
- Verifica que las URLs de imágenes sean HTTPS
- Verifica que los buckets de Supabase Storage estén configurados

---

## 📊 MONITOREO POST-DESPLIEGUE

### Métricas a Monitorear

1. **Web Vitals** (Vercel Analytics)
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

2. **Supabase Metrics**
   - Conexiones simultáneas
   - Queries por segundo
   - Storage usage

3. **Application Logs**
   - Logs de errores
   - Logs de autenticación
   - Logs de sincronización

### Alertas Recomendadas

1. **Alertas de Error Rate**
   - Configura alertas cuando el error rate > 5%

2. **Alertas de Performance**
   - Configura alertas cuando LCP > 2.5s

3. **Alertas de Seguridad**
   - Configura alertas cuando rate limiting se activa frecuentemente

---

## 🔄 ACTUALIZACIONES FUTURAS

### Proceso de Actualización

1. **Hacer cambios en el código**
2. **Commitear cambios al repositorio**
3. **Push al branch principal**
4. **Vercel hará deploy automático**
5. **Verificar en producción**

### Rollback si es Necesario

```bash
# Ver deploy anteriores
npx vercel list

# Rollback a un deploy específico
npx vercel rollback
```

---

## 📞 SOPORTE

Si encuentras problemas post-despliegue:

1. Revisa los logs en Vercel
2. Revisa los logs en Supabase
3. Consulta la documentación generada en `docs/`
4. Verifica las variables de entorno

---

**Generado por:** Devin AI Assistant  
**Fecha:** 2026-08-12  
**Versión del documento:** 1.0