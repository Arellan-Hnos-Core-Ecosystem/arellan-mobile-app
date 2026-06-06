import '@arellan-hnos-core-ecosystem/ui/styles.css'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { RootLayoutClient } from './root-layout-client'

export const metadata: Metadata = {
  title: 'Arellan Hnos - Gerencial',
  description: 'Aplicacion gerencial movil para propietarios y administradores',
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#1B3A6B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-neutral-50 antialiased">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
