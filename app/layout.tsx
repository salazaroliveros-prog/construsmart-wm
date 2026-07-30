import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ui/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CONSTRUCTORA WM/M&S - Sistema de Control de Seguimiento',
  description: 'Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera. "CONSTRUYENDO EL FUTURO"',
  keywords: ['construcción', 'ERP', 'presupuestos', 'gestión de proyectos', 'control de costos', 'obras', 'constructora'],
  authors: [{ name: 'Constructora WM/M&S' }],
  creator: 'Constructora WM/M&S',
  publisher: 'Constructora WM/M&S',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WM/M&S ERP',
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_GT',
    url: 'https://your-domain.com',
    title: 'CONSTRUCTORA WM/M&S - Sistema de Control de Seguimiento',
    description: 'Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera.',
    siteName: 'CONSTRUCTORA WM/M&S',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONSTRUCTORA WM/M&S - Sistema de Control de Seguimiento',
    description: 'Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera.',
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
      </head>
      <body className={inter.className}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
