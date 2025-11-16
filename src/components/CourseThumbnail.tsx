"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface CourseThumbnailProps {
  thumbnail?: string | null;
  image?: string | null;
  title: string;
  className?: string;
  height?: string;
}

export default function CourseThumbnail({ 
  thumbnail,
  image,
  title, 
  className = "w-full h-48", 
  height = "h-48" 
}: CourseThumbnailProps) {
  const DEFAULT_SRC = '/uploads/CPI_Thumnail.png'
  const [errored, setErrored] = useState(false)
  const initial = (image || thumbnail || DEFAULT_SRC) ?? null
  const sanitize = (val: string | null): string | null => {
    if (!val) return null
    // Allow local assets and uploads
    if (val.startsWith('/') || val.startsWith('./')) return val
    // Validate remote URL – reject obviously placeholder / invalid hosts like "https://a"
    try {
      const u = new URL(val)
      const host = u.hostname.trim()
      // host must contain at least one dot and be length >= 4 (e.g. a.co) to be considered real
      if (host.length < 4 || !host.includes('.')) {
        return DEFAULT_SRC
      }
      return val
    } catch {
      return DEFAULT_SRC
    }
  }
  const [src, setSrc] = useState<string | null>(sanitize(initial))

  useEffect(() => {
    setErrored(false)
    setSrc(sanitize((image || thumbnail || DEFAULT_SRC) ?? null))
  }, [image, thumbnail])
  return (
    <div className={`relative ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover ${height}`}
          onError={() => {
            if (src !== DEFAULT_SRC) {
              setSrc(DEFAULT_SRC)
            } else {
              setErrored(true)
              setSrc(null)
            }
          }}
          priority={false}
        />
      ) : (
        <div className={`w-full ${height} flex items-center justify-center`} style={{ background: 'var(--section-bg)' }}>
          <svg 
            className="h-12 w-12" 
            style={{ color: 'var(--session-subtext)' }}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
        </div>
      )}
    </div>
  )
}