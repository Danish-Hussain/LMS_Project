"use client"
import React, { useEffect, useState } from 'react'

// Track slugs incremented during this page load to avoid double-counting.
// This in-memory Set resets on full page refresh / navigation away, which
// implements "once-per-page-load" behaviour.
const seenThisPage = new Set<string>()

export default function PostViews({ slug, initial = 0 }: { slug: string; initial?: number }) {
  const [views, setViews] = useState<number>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const shouldInc = !seenThisPage.has(slug)

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
          seenThisPage.add(slug)
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

    // Read the current value first so the UI shows the latest count.
    // Then, increment once per page load if we haven't already.
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
