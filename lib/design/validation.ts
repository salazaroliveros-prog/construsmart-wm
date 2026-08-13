// Sistema de Validación de Formularios Unificado
// Basado en estándares de validación accesibles y consistentes

export const validationRules = {
  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Por favor ingresa un correo electrónico válido',
  },
  
  // Password validation
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  },
  
  // Phone validation
  phone: {
    pattern: /^\+?[\d\s-()]+$/,
    message: 'Por favor ingresa un número de teléfono válido',
  },
  
  // URL validation
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Por favor ingresa una URL válida (https://...)',
  },
  
  // Number validation
  number: {
    pattern: /^\d+$/,
    message: 'Por favor ingresa solo números',
  },
  
  // Required validation
  required: {
    message: 'Este campo es obligatorio',
  },
  
  // Min length validation
  minLength: (min: number) => ({
    message: `Mínimo ${min} caracteres requeridos`,
  }),
  
  // Max length validation
  maxLength: (max: number) => ({
    message: `Máximo ${max} caracteres permitidos`,
  }),
  
  // Min value validation
  minValue: (min: number) => ({
    message: `El valor debe ser al menos ${min}`,
  }),
  
  // Max value validation
  maxValue: (max: number) => ({
    message: `El valor debe ser como máximo ${max}`,
  }),
};

export const validationStates = {
  // Pristine - no ha sido tocado
  pristine: {
    status: 'pristine',
    message: '',
    isValid: true,
  },
  
  // Valid - campo válido
  valid: {
    status: 'valid',
    message: '',
    isValid: true,
  },
  
  // Invalid - campo inválido
  invalid: {
    status: 'invalid',
    message: '',
    isValid: false,
  },
  
  // Loading - validando
  loading: {
    status: 'loading',
    message: 'Validando...',
    isValid: false,
  },
};

export const validationTiming = {
  // Validar al cambiar el valor
  onChange: 'onChange',
  
  // Validar al perder el foco
  onBlur: 'onBlur',
  
  // Validar al enviar el formulario
  onSubmit: 'onSubmit',
  
  // Validación inmediata
  immediate: 'immediate',
};

export const validationStyles = {
  // Input states
  input: {
    pristine: 'border-white/10',
    valid: 'border-emerald-500/30 focus:border-emerald-500/50',
    invalid: 'border-red-500/30 focus:border-red-500/50',
    loading: 'border-cyan-500/30',
  },
  
  // Helper text
  helper: {
    pristine: 'text-white/40',
    valid: 'text-emerald-400',
    invalid: 'text-red-400',
    loading: 'text-cyan-400',
  },
  
  // Icon indicators
  icon: {
    valid: 'text-emerald-400',
    invalid: 'text-red-400',
    loading: 'text-cyan-400 animate-spin',
  },
};

// Clases combinadas por uso específico
export const validationClasses = {
  // Input estándar con validación
  inputStandard: 'px-4 py-3 min-h-[44px] rounded-md text-sm transition-all duration-300 ease-in-out',
  
  // Input con error
  inputError: 'border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20',
  
  // Input con éxito
  inputSuccess: 'border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20',
  
  // Mensaje de error
  errorMessage: 'text-red-400 text-xs mt-1',
  
  // Mensaje de éxito
  successMessage: 'text-emerald-400 text-xs mt-1',
  
  // Mensaje de ayuda
  helperMessage: 'text-white/40 text-xs mt-1',
  
  // Indicador de validación
  validationIcon: 'absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5',
};