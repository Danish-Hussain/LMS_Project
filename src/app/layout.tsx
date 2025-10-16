import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import ClientProviders from './ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LMS - Learning Management System',
  description: 'Online training platform with video recordings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientProviders>
          <main className="pt-14 flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  )
}