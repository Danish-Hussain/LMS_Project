import type { AppProps } from 'next/app'
import ClientProviders from '@/app/ClientProviders'
import '@/app/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <Component {...pageProps} />
    </ClientProviders>
  )
}
