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

    if (shouldInc) inc()

    return () => { mounted = false }
  }, [slug])

  return (
    <div className="text-gray-600">
      {views.toLocaleString()} views
    </div>
  )
}
