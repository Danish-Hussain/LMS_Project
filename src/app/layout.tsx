import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import ClientProviders from './ClientProviders'
import Footer from '@/components/Layout/Footer'
import PWARegister from './PWARegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SAP Integration Expert — SAP CPI Training',
  description: 'Hands-on SAP Cloud Platform Integration (CPI) training, batches, recordings, and progress tracking.',
  applicationName: 'SAP Integration Expert',
  appleWebApp: {
    capable: true,
    title: 'SAP Integration Expert',
    statusBarStyle: 'default'
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/icon.png?v=4' }],
    shortcut: [{ url: '/icon.png?v=4' }],
    apple: [{ url: '/apple-icon.png?v=4' }],
  },
  manifest: '/site.webmanifest?v=4',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning={true} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <ClientProviders>
          <PWARegister />
          <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6">
            {children}
          </main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  )
}