# 🔧 Comandos para Configurar Variables de Entorno en Vercel

**Fecha**: 2025-01-XX
**Estado**: ⚠️ Requiere ejecución manual de comandos

---

## 📊 Auditoría Automática - Resultados

### ✅ Variables Ya Configuradas en Production

Las siguientes variables YA están configuradas en Vercel (verificado con `npx vercel env ls`):

- ✅ `NEXT_PUBLIC_APP_URL` (Encrypted)
- ✅ `NEXT_PUBLIC_SITE_URL` (Encrypted)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Encrypted)
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Encrypted)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (Encrypted)
- ✅ `SUPABASE_URL` (Encrypted)
- ✅ `SUPABASE_PUBLISHABLE_KEY` (Encrypted)

### 🔴 Variable Eliminada (Riesgo de Seguridad)

- ✅ `SUPABASE_SECRET_KEY` - **ELIMINADA** de Production (correcto, no debería estar)

### ⚠️ Variables Faltantes (Opcionales)

- ⚠️ `ALLOWED_ORIGINS` - No configurada (opcional, tiene fallback)
- ⚠️ `NEXT_PUBLIC_ADMIN_EMAIL` - No configurada (opcional, tiene fallback)

---

## 🔧 Comandos para Agregar Variables Faltantes

### 1. Agregar ALLOWED_ORIGINS (Opcional)

```bash
npx vercel env add ALLOWED_ORIGINS production
# Cuando pregunte "Store as sensitive?", responde: n
# Cuando pregunte por el valor, ingresa: https://construsmart-wm.vercel.app,https://construsmart-wm-*.vercel.app
```

### 2. Agregar NEXT_PUBLIC_ADMIN_EMAIL (Opcional)

```bash
npx vercel env add NEXT_PUBLIC_ADMIN_EMAIL production
# Cuando pregunte "Store as sensitive?", responde: n
# Cuando pregunte por el valor, ingresa: salazaroliveros@gmail.com
```

---

## 📋 Comandos para Verificar Variables

### Listar todas las variables

```bash
npx vercel env ls
```

### Ver variables de un entorno específico

```bash
npx vercel env ls production
```

### Descargar variables a archivo local

```bash
npx vercel env pull .env.production
```

---

## 🎯 Conclusión

### Estado Actual: ✅ Variables Críticas Configuradas

**Buenas noticias**:
- ✅ Las 5 variables críticas ya están configuradas en Vercel
- ✅ `SUPABASE_SECRET_KEY` ha sido eliminada de Production (correcto)
- ✅ La aplicación debería funcionar correctamente con las variables actuales

**Acción opcional**:
- ⚠️ Agregar `ALLOWED_ORIGINS` y `NEXT_PUBLIC_ADMIN_EMAIL` para mayor seguridad y flexibilidad

### Nota Importante

No pude automatizar completamente la adición de variables porque el CLI de Vercel requiere confirmación interactiva para cada comando. Los comandos anteriores deben ejecutarse manualmente por el usuario.
