import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CONSTRUCTORA WM/M&S - Sistema de Control de Seguimiento',
  description: 'Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera. "CONSTRUYENDO EL FUTURO"',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CONSTRUCTORA WM/M&S',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/assets/branding/logo-constructora-wm.jpg" />
        <link rel="apple-touch-icon" href="/assets/branding/logo-constructora-wm.jpg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        {children}
        {/* ServiceWorkerRegistration deshabilitado temporalmente para evitar errores de PWA en producción */}
      </body>
    </html>
  );
}
