# INSTRUCCIONES PARA HABILITAR PROTECCIÓN DE CONTRASEÑAS FILTRADAS
## CONSTRUCTORA WM/M&S ERP SUITE - "CONSTRUYENDO EL FUTURO"

**Fecha:** 2026-08-03  
**Prioridad:** WARN (Advertencia de Seguridad)

---

## 🚨 ADVERTENCIA DE SEGURIDAD

**Problema:** Leaked Password Protection Disabled  
**Nivel:** WARN  
**Descripción:** La protección de contraseñas filtradas está deshabilitada en Supabase Auth. Esta característica previene el uso de contraseñas comprometidas verificando contra HaveIBeenPwned.org.

---

## 📋 INSTRUCCIONES PARA HABILITAR

### Paso 1: Ir al Dashboard de Supabase

1. Navegar a https://supabase.com/dashboard
2. Seleccionar el proyecto: `proyectoswm`
3. Ir a **Authentication** → **Policies**

### Paso 2: Habilitar Leaked Password Protection

1. En la sección **Password Protection**, buscar **"Leaked Password Protection"**
2. Habilitar la opción **"Enable leaked password protection"**
3. Configurar las opciones deseadas:
   - **Block sign-up with leaked passwords:** Habilitar (recomendado)
   - **Notify users on password change:** Habilitar (recomendado)
4. Hacer clic en **Save**

### Paso 3: Verificar

1. Intentar registrarse con una contraseña conocida como comprometida (ej: "password123")
2. Verificar que el sistema rechaza la contraseña
3. Revisar los logs de Auth para confirmar que la protección está activa

---

## 📚 DOCUMENTACIÓN OFICIAL

- [Password Security - Supabase Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned.org](https://haveibeenpwned.com/)

---

## ✅ ESTADO ACTUAL

- **Estado:** ❌ Deshabilitado
- **Acción requerida:** Habilitar manualmente en Dashboard
- **Prioridad:** Alta (recomendado para producción)

---

## 📝 NOTAS

Esta configuración no se puede realizar vía SQL o migraciones de base de datos. Debe hacerse manualmente en el Dashboard de Supabase Auth.

Una vez habilitado, esta advertencia desaparecerá de los Security Advisors.
