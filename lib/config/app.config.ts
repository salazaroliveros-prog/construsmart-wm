// App Configuration
// This file centralizes all app-wide configuration constants

function getBaseUrl(): string {
  // En el cliente, usar el origen de la ventana
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // En el servidor, usar la variable de entorno (sin fallback hardcodeado)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!envUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL no está configurada. ' +
      'Agrégala en tu archivo .env o en las variables de entorno de Vercel.'
    );
  }
  return envUrl;
}

export const APP_CONFIG = {
  // The production URL of the application
  // This is set via environment variable NEXT_PUBLIC_APP_URL
  url: getBaseUrl(),
  
  // App metadata
  name: 'CONSTRUCTORA WM/M&S',
  shortName: 'WM/M&S ERP',
  description: 'Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera. "CONSTRUYENDO EL FUTURO"',
  
  // SEO keywords
  keywords: ['construcción', 'ERP', 'presupuestos', 'gestión de proyectos', 'control de costos', 'obras', 'constructora'] as string[],
  
  // Contact info (can be expanded)
  email: 'info@constructora-wm.com',
  
  // Social media (can be expanded)
  social: {
    twitter: '@constructora_wm',
    linkedin: 'constructora-wm',
  },
} as const;

// Helper function to get the full URL for a path
export function getFullPath(path: string = ''): string {
  const baseUrl = APP_CONFIG.url;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
