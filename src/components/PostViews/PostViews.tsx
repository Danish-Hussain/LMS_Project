"use client"
import React, { useEffect, useState } from 'react'

export default function PostViews({ slug, initial = 0 }: { slug: string; initial?: number }) {
  const [views, setViews] = useState<number>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    // POST to our api to increment views
    async function inc() {
      try {
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/views`, { method: 'POST' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body?.error || `HTTP ${res.status}`)
          return
        }
        const data = await res.json()
        if (mounted && typeof data.views !== 'undefined') setViews(Number(data.views))
      } catch (err: any) {
        if (mounted) setError(err?.message || String(err))
      }
    }

    inc()
    return () => { mounted = false }
  }, [slug])

  return (
    <div className="text-gray-600">
      {views.toLocaleString()} views
    </div>
  )
}
