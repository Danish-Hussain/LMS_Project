import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/ToastProvider'
import Navbar from '@/components/Layout/Navbar'

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
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="pt-14 flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6">
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}