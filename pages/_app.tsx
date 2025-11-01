import type { AppProps } from 'next/app'
import ClientProviders from '@/app/ClientProviders'
import Footer from '@/components/Layout/Footer'
import '@/app/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6">
        <Component {...pageProps} />
      </main>
      <Footer />
    </ClientProviders>
  )
}
