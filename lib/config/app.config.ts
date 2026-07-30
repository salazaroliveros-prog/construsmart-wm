// App Configuration
// This file centralizes all app-wide configuration constants

export const APP_CONFIG = {
  // The production URL of the application
  // This is set via environment variable NEXT_PUBLIC_APP_URL
  // Falls back to the Vercel default domain
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://control-constructora-ir8cxwljy-proyectoswm.vercel.app',
  
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
