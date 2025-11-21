import React from 'react'
import '../src/app/globals.css'
import ClientProviders from '../src/app/ClientProviders'
import Footer from '@/components/Layout/Footer'
import PWARegister from '../src/app/PWARegister'

// Use a full root layout here so routes under `app/` (legacy studio app) also
// render the site's ClientProviders (Navbar, providers) and Footer. This keeps
// the site consistent across both `app/` and `src/app/` route roots.
export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col" suppressHydrationWarning={true}>
        <ClientProviders>
          <PWARegister />
          <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6">{children}</main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  )
}
