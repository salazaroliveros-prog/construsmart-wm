import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { APP_CONFIG } from '@/lib/config/app.config';
import ServiceWorkerRegistration from '@/components/ui/ServiceWorkerRegistration';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Sistema de Control de Seguimiento`,
  description: APP_CONFIG.description,
  keywords: APP_CONFIG.keywords,
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  publisher: APP_CONFIG.name,
  openGraph: {
    type: 'website',
    locale: 'es_GT',
    url: APP_CONFIG.url,
    title: `${APP_CONFIG.name} - Sistema de Control de Seguimiento`,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.name} - Sistema de Control de Seguimiento`,
    description: APP_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="Sistema de Gestión de Construcción - CONSTRUCTORA WM/M&S - CONSTRUYENDO EL FUTURO" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <ServiceWorkerRegistration />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}