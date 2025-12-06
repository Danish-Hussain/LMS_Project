"use client"
import React, { useEffect, useState } from 'react'

export default function PostViews({ slug, initial = 0 }: { slug: string; initial?: number }) {
  const [views, setViews] = useState<number>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // avoid counting multiple times per user within a short window
    const key = `viewed-${slug}`
    const last = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    const now = Date.now()
    const ONE_HOUR = 1000 * 60 * 60
    const shouldInc = !last || (now - Number(last) > ONE_HOUR)

    async function inc() {
      try {
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/views`, { method: 'POST' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (mounted) setError(body?.error || `HTTP ${res.status}`)
          return
        }
        const data = await res.json()
        if (mounted && typeof data.views !== 'undefined') {
          setViews(Number(data.views))
          try { window.localStorage.setItem(key, String(Date.now())) } catch (e) {}
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || String(err))
      }
    }

    async function read() {
      try {
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/views`, { method: 'GET' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (mounted) setError(body?.error || `HTTP ${res.status}`)
          return
        }
        const data = await res.json()
        if (mounted && typeof data.views !== 'undefined') {
          setViews(Number(data.views))
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || String(err))
      }
    }

    // Always read the current value first so the UI shows latest count.
    // Then, if we should increment (not viewed recently), POST to increment and update.
    read().then(() => { if (shouldInc) inc() })

    return () => { mounted = false }
  }, [slug])

  const label = views === 1 ? 'view' : 'views'
  return (
    <div className="flex items-center gap-2 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-sky-500" aria-hidden>
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s4.5-7 9.5-7 9.5 7 9.5 7-4.5 7-9.5 7S2.5 12 2.5 12z"></path>
        <circle cx="12" cy="12" r="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
      </svg>
      <span className="font-semibold text-gray-900 dark:text-gray-100">{views.toLocaleString()}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}
