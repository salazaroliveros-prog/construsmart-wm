// Sistema de Colores de Feedback Unificado
// Basado en estándares de color semántico accesibles

export const feedbackColors = {
  // Success (éxito, confirmación)
  success: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    bgHover: 'hover:bg-emerald-500/30',
    bgActive: 'bg-emerald-500/40',
    icon: 'text-emerald-400',
    ring: 'focus:ring-emerald-500/50',
  },
  
  // Error (error, peligro, alerta crítica)
  error: {
    bg: 'bg-red-500/20',
    text: 'text-red-300',
    border: 'border-red-500/30',
    bgHover: 'hover:bg-red-500/30',
    bgActive: 'bg-red-500/40',
    icon: 'text-red-400',
    ring: 'focus:ring-red-500/50',
  },
  
  // Warning (advertencia, alerta media)
  warning: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    bgHover: 'hover:bg-amber-500/30',
    bgActive: 'bg-amber-500/40',
    icon: 'text-amber-400',
    ring: 'focus:ring-amber-500/50',
  },
  
  // Info (información, neutral)
  info: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    bgHover: 'hover:bg-cyan-500/30',
    bgActive: 'bg-cyan-500/40',
    icon: 'text-cyan-400',
    ring: 'focus:ring-cyan-500/50',
  },
  
  // Primary (acción principal, destacado)
  primary: {
    bg: 'bg-violet-500/20',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
    bgHover: 'hover:bg-violet-500/30',
    bgActive: 'bg-violet-500/40',
    icon: 'text-violet-400',
    ring: 'focus:ring-violet-500/50',
  },
  
  // Secondary (acción secundaria)
  secondary: {
    bg: 'bg-white/10',
    text: 'text-white/70',
    border: 'border-white/20',
    bgHover: 'hover:bg-white/15',
    bgActive: 'bg-white/20',
    icon: 'text-white/60',
    ring: 'focus:ring-white/30',
  },
};

// Clases combinadas por uso específico
export const feedbackColorsByUsage = {
  // Toast notifications
  toastSuccess: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  toastError: 'bg-red-500/10 border-red-500/30 text-red-300',
  toastWarning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  toastInfo: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  
  // Alert banners
  alertSuccess: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  alertError: 'bg-red-500/20 border-red-500/30 text-red-300',
  alertWarning: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  alertInfo: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
  
  // Status badges
  badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  badgeError: 'bg-red-500/20 text-red-300 border-red-500/30',
  badgeWarning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  badgeInfo: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  badgePrimary: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  
  // Buttons
  buttonSuccess: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30',
  buttonError: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30',
  buttonWarning: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30',
  buttonInfo: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30',
  
  // Status indicators
  statusSuccess: 'bg-emerald-500 text-white',
  statusError: 'bg-red-500 text-white',
  statusWarning: 'bg-amber-500 text-white',
  statusInfo: 'bg-cyan-500 text-white',
  
  // Progress bars
  progressSuccess: 'bg-emerald-500',
  progressError: 'bg-red-500',
  progressWarning: 'bg-amber-500',
  progressInfo: 'bg-cyan-500',
};

// Clases para backgrounds
export const backgroundColors = {
  success: 'bg-emerald-500/10',
  error: 'bg-red-500/10',
  warning: 'bg-amber-500/10',
  info: 'bg-cyan-500/10',
  primary: 'bg-violet-500/10',
  secondary: 'bg-white/10',
};

// Clases para borders
export const borderColors = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  warning: 'border-amber-500/30',
  info: 'border-cyan-500/30',
  primary: 'border-violet-500/30',
  secondary: 'border-white/20',
};

// Clases para texto
export const textColors = {
  success: 'text-emerald-300',
  error: 'text-red-300',
  warning: 'text-amber-300',
  info: 'text-cyan-300',
  primary: 'text-violet-300',
  secondary: 'text-white/70',
};