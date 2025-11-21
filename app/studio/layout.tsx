import React from 'react'
import '../../src/app/globals.css'

// Nested layout for /studio. Do NOT render <html> or <body> here — the root
// `app/layout.tsx` already provides those. Rendering html/body in a nested
// layout causes hydration mismatches.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
