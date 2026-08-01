# INSTRUCCIONES DE DEPLOY - CORRECCIONES CRÍTICAS
**Fecha:** 8 de enero de 2026  
**Versión:** 1.0.0

---

## 📋 PASO 1: Instalar Dependencias Faltantes

Ejecutar en la raíz del proyecto:

```bash
npm install zod @tanstack/react-virtual
```

Esto instalará:
- `zod` - Validación de esquemas
- `@tanstack/react-virtual` - Virtualización de listas (opcional por ahora)

---

## 📋 PASO 2: Aplicar Migración SQL en Supabase

### Opción A: Supabase Dashboard (Recomendado)

1. Ir a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/editor
2. Click en **"SQL Editor"** en el menú lateral
3. Click en **"New query"**
4. Copiar y pegar el contenido de `supabase/migrations/APPLY_MANUAL.sql`
5. Click en **"Run"** para ejecutar
6. Verificar que aparezca el mensaje de éxito

### Opción B: Supabase CLI (si hay problemas de autenticación)

```bash
# Re-autenticar
supabase login

# Aplicar migraciones
supabase db push
```

Si falla, usar la Opción A.

---

## 📋 PASO 3: Verificar Variables de Entorno

Asegurar que el archivo `.env` en la raíz tenga:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yibjsruoxjlgdnkgylld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
NEXT_PUBLIC_APP_URL=https://control-constructora-wm.vercel.app
```

**Nota:** Reemplazar `<tu-anon-key>` con la clave real de Supabase.

---

## 📋 PASO 4: Configurar Supabase Auth

1. Ir a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/auth
2. En **"Email Auth"**, asegurar que esté habilitado
3. En **"URL Configuration"**, agregar:
   - Site URL: `https://control-constructora-wm.vercel.app`
   - Redirect URLs: `https://control-constructora-wm.vercel.app/**`

4. (Opcional) Crear primer usuario de prueba:
   ```sql
   -- Ejecutar en SQL Editor
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('admin@constructora-wm.com', crypt('WM2026admin', gen_salt('bf')), NOW())
   RETURNING id;
   ```

---

## 📋 PASO 5: Verificar Instalación

```bash
# Verificar que no hay errores de compilación
npm run type-check

# Iniciar servidor de desarrollo
npm run dev
```

Verificar en el navegador:
- ✅ Login funciona con Supabase Auth
- ✅ No hay errores en consola
- ✅ La app carga correctamente

---

## 📋 PASO 6: Hacer Commit de Cambios

```bash
# Agregar todos los archivos modificados
git add -A

# Ver estado
git status

# Commit
git commit -m "feat: implementar 26 correcciones críticas y mejoras

- Migrar autenticación a Supabase Auth (CRÍTICO)
- Agregar validación con Zod en formularios (CRÍTICO)
- Implementar validación de variables de entorno (CRÍTICO)
- Agregar manejo de conflictos LWW en sincronización (ALTA)
- Implementar sidebar expandible en desktop (ALTA)
- Agregar gestos táctiles swipe en móvil (MEDIA)
- Implementar logging estructurado (MEDIA)
- Crear sistema de feature flags (MEDIA)
- Agregar hook compartido ProjectLog ↔ ProgressTracker (MEDIA)
- Mejorar manejo de errores en operaciones DB (MEDIA)
- Eliminar URLs hardcodeadas (BAJA)
- Agregar paginación/infinite scroll (BAJA)
- Implementar skip-to-content link (BAJA)
- Crear informe de análisis completo

Ver docs/INFORME_ANALISIS_INCONSISTENCIAS.md para detalles"

# Push
git push origin main
```

---

## 📋 PASO 7: Deploy en Vercel

1. Push a GitHub
2. Vercel detectará el push automáticamente
3. Configurar variables de entorno en Vercel:
   - Ir a Settings → Environment Variables
   - Agregar `NEXT_PUBLIC_SUPABASE_URL`
   - Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Agregar `NEXT_PUBLIC_APP_URL`
4. Esperar deploy automático

---

## 🔍 Verificación Post-Deploy

Verificar que funciona:
- [ ] Login con Supabase Auth
- [ ] CRUD de proyectos
- [ ] Sincronización offline/online
- [ ] Sincronización entre dispositivos
- [ ] Gráficos responsivos
- [ ] Navegación por swipe en móvil
- [ ] Estados de carga en tabs
- [ ] Logs en consola (modo debug)

---

## ⚠️ Notas Importantes

1. **Supabase Auth requiere HTTPS en producción** - Vercel ya lo provee
2. **La tabla `profiles` es OBLIGATORIA** para que funcione la autenticación
3. **Los usuarios existentes en localStorage** deben re-autenticarse
4. **El modo offline funciona sin Supabase** pero con funcionalidad reducida
5. **Feature flags** están desactivadas por defecto

---

## 🆘 Troubleshooting

### Error: "Variables de entorno faltantes"
- Verificar que `.env` existe en la raíz
- Verificar que Vercel tiene las variables configuradas

### Error: "relation 'profiles' does not exist"
- Aplicar la migración SQL (Paso 2)
- Verificar que la tabla se creó en Supabase Dashboard

### Error: "Invalid login credentials"
- Verificar que Supabase Auth está habilitado
- Verificar que el usuario existe en `auth.users`
- Verificar redirect URLs en Supabase Dashboard

### Error: "Unauthorized" en Supabase CLI
- Ejecutar `supabase login` nuevamente
- Verificar que el token no expiró
- Usar Supabase Dashboard directamente (Opción A)

---

## 📞 Soporte

Para más detalles sobre las correcciones implementadas, ver:
- `docs/INFORME_ANALISIS_INCONSISTENCIAS.md`
- `docs/ANALISIS_COMPLETO_SUITE.md`