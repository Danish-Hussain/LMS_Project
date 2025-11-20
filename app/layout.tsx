import React from 'react'
import '../src/app/globals.css'

// Minimal root layout for the top-level `app/` Studio route.
// This ensures Next.js has the required <html> and <body> tags when
// rendering the embedded Sanity Studio at `/studio`.
export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  )
}
