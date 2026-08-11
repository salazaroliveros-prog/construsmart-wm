# 🔐 Instrucciones para Habilitar Leaked Password Protection

## ¿Qué es Leaked Password Protection?

Supabase Auth previene el uso de passwords comprometidos verificándolos contra la base de datos de HaveIBeenPwned.org. Si un usuario intenta usar un password que ha sido filtrado en una brecha de seguridad, el sistema lo rechazará y pedirá que elija uno más seguro.

## Pasos para Habilitarlo (Manual)

### 1. Acceder al Dashboard de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: `yibjsruoxjlgdnkgylld` (CONTROL_SEGUIMIENTO_APP_VoL_10)
3. Navega a **Authentication** en el menú lateral izquierdo

### 2. Configurar Password Security

1. En la sección de Authentication, busca la pestaña **Policies** o **Password**
2. Busca la sección **Password Strength & Leaked Password Protection**
3. Habilita la opción **Leaked Password Protection** o **Prevent use of leaked passwords**

### 3. Configurar Opciones Adicionales (Opcional)

Puedes configurar:
- **Minimum password length**: Recomendado 8-12 caracteres
- **Require uppercase letters**: Recomendado
- **Require lowercase letters**: Recomendado
- **Require numbers**: Recomendado
- **Require special characters**: Recomendado

### 4. Guardar Cambios

1. Haz clic en **Save** o **Apply**
2. Los cambios se aplican inmediatamente a nuevas sesiones

## Beneficios

✅ **Seguridad mejorada**: Los usuarios no pueden usar passwords comprometidos
✅ **Protección contra brechas**: Mitiga el riesgo de credenciales reutilizadas
✅ **Cumplimiento**: Mejora el cumplimiento de estándares de seguridad

## Impacto en Usuarios

- **Usuarios existentes**: No se ven afectados (solo aplica a nuevos passwords o cambios)
- **Nuevos registros**: Si intentan usar un password comprometido, recibirán un error amigable
- **Cambio de password**: Si intentan cambiar a un password comprometido, será rechazado

## Mensaje de Error (Ejemplo)

Si un usuario intenta usar un password comprometido:
```
This password has been leaked in a data breach. Please choose a different password.
```

## Verificación

Después de habilitar:
1. Intenta registrar un nuevo usuario con un password conocido comprometido (ej: "password123")
2. Verifica que el sistema rechaza el password
3. El usuario verá un mensaje indicando que el password ha sido filtrado

## Documentación Oficial

Para más información, visita:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Estado Actual

⚠️ **Pendiente**: Leaked password protection está deshabilitado
📝 **Acción requerida**: Habilitar manualmente en el dashboard de Supabase Auth
