import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { APP_CONFIG } from '@/lib/config/app.config';
import ServiceWorkerRegistration from '@/components/ui/ServiceWorkerRegistration';
import SyncProvider from '@/components/ui/SyncProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth/auth-context';
import { UISettingsProvider } from '@/lib/hooks/useUISettings';
import AuthGuard from '@/components/auth/AuthGuard';
import { MaterialAlertProvider } from '@/context/MaterialAlertContext';
import { OfflineSyncIndicator } from '@/components/common/OfflineSyncIndicator';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from "@/lib/utils/index";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Sistema de Control de Seguimiento`,
  description: APP_CONFIG.description,
  keywords: APP_CONFIG.keywords,
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  publisher: APP_CONFIG.name,
  applicationName: APP_CONFIG.name,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_CONFIG.name,
  },
  formatDetection: {
    telephone: false,
  },
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/logo-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/logo-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/logo-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="Sistema ERP de Construcción - CONSTRUCTORA WM/M&S - CONSTRUYENDO EL FUTURO" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Constructora WM" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/logo-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-lg">
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <UISettingsProvider>
            <ToastProvider>
              <MaterialAlertProvider>
                <ServiceWorkerRegistration />
                <SyncProvider />
                <AuthGuard>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </AuthGuard>
                <OfflineSyncIndicator />
              </MaterialAlertProvider>
            </ToastProvider>
          </UISettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}