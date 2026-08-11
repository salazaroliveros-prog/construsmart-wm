# 🔐 Instrucciones para Habilitar Leaked Password Protection

## ⚠️ Limitación Importante

**Leaked Password Protection está disponible solo en planes Pro y superiores de Supabase ($25/mes+)**.

Si estás en el plan Free, recibirás este error:
```
Failed to update auth configuration: Configuring leaked password protection via HaveIBeenPwned.org is available on Pro Plans and up.
```

## ¿Qué es Leaked Password Protection?

Supabase Auth previene el uso de passwords comprometidos verificándolos contra la base de datos de HaveIBeenPwned.org. Si un usuario intenta usar un password que ha sido filtrado en una brecha de seguridad, el sistema lo rechazará y pedirá que elija uno más seguro.

## Alternativas para Plan Free

### Opción 1: Validación de Password en Frontend (Recomendada)
Usa la librería `zxcvbn` para validar passwords client-side:

```bash
npm install zxcvbn @types/zxcvbn
```

**Ejemplo de implementación**:
```typescript
import zxcvbn from 'zxcvbn';

function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  warning?: string;
} {
  const result = zxcvbn(password);
  
  // Score 0-4 (4 = muy fuerte)
  if (result.score < 2) {
    return {
      isValid: false,
      score: result.score,
      warning: result.feedback.warning || 'Password muy débil'
    };
  }
  
  return {
    isValid: true,
    score: result.score
  };
}
```

### Opción 2: Reglas de Password Simples
Implementa validación básica:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Sin passwords comunes (ej: "password123")

### Opción 3: Actualizar a Plan Pro (Pago)
**Costo**: $25 USD/mes
**Beneficios adicionales**:
- Leaked Password Protection
- Más bandwidth y storage
- Soporte prioritario
- Backups diarios
- Database backups (Point-in-Time Recovery)

**Pasos**:
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Billing**
4. Actualiza a **Pro Plan**

## Recomendación

**Para el plan Free actual**:
- ✅ Implementar validación frontend con `zxcvbn`
- ✅ Usar reglas de password básicas
- ✅ No es crítico para aplicaciones de uso interno

**Para proyectos empresariales**:
- ⚠️ Considerar actualizar a Pro por la seguridad adicional

## Documentación Oficial

https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Estado Actual

⚠️ **Limitación**: Leaked password protection requiere plan Pro ($25/mes+)
✅ **Alternativa**: Implementar validación frontend con `zxcvbn` (gratuito)
