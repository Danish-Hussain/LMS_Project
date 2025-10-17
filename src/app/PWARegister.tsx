"use client"

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js')
        // Optionally listen for updates
      } catch (err) {
        console.error('SW registration failed', err)
      }
    }

    register()
  }, [])

  return null
}
