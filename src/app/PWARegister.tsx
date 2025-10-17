"use client"

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')

        // Update flow: if there's a waiting SW, prompt the page to reload
        const handleUpdate = (registration: ServiceWorkerRegistration) => {
          if (registration.waiting) {
            // Tell the waiting SW to activate immediately
            registration.waiting.postMessage('SKIP_WAITING')
            // Reload to let the new SW control the page
            window.location.reload()
          }
        }

        // Listen for new updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              handleUpdate(reg)
            }
          })
        })

        // Also handle the case where SW is already waiting after registration
        handleUpdate(reg)
      } catch (err) {
        console.error('SW registration failed', err)
      }
    }

    register()
  }, [])

  return null
}
