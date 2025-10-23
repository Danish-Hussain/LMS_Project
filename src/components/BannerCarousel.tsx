"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Megaphone, GraduationCap, Rocket, Image as ImageIcon, Link2, Save, Trash, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface BannerItem {
  id: number
  title: string
  description: string
  cta?: { label: string; href: string }
  className?: string
  imageUrl?: string
  linkUrl?: string
}

async function fetchBanners(): Promise<BannerItem[]> {
  try {
    const res = await fetch('/api/banners', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  } catch {
    // fallback defaults
    return [
      {
        id: 1,
        title: 'Join our new cohort',
        description: 'Fresh batches opening this month. Reserve your seat now.',
        cta: { label: 'View Batches', href: '/batches' },
        className: 'from-blue-600/90 to-indigo-600/90',
      },
      {
        id: 2,
        title: 'On-demand courses',
        description: 'Learn at your own pace with recorded sessions and quizzes.',
        cta: { label: 'Explore Courses', href: '/on-demand-courses' },
        className: 'from-emerald-600/90 to-teal-600/90',
      },
      {
        id: 3,
        title: 'Career mentorship',
        description: 'Book 1:1 time with instructors for guidance and mock interviews.',
        cta: { label: 'Book a Session', href: '/contact' },
        className: 'from-rose-600/90 to-orange-600/90',
      },
    ]
  }
}

export default function BannerCarousel() {
  const { user } = useAuth()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [banners, setBanners] = useState<BannerItem[]>([])

  // icons map to avoid re-render churn
  const icons = useMemo(() => [
    <Megaphone key="i1" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-white" />, 
    <GraduationCap key="i2" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-white" />, 
    <Rocket key="i3" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-white" />
  ], [])

  useEffect(() => {
    fetchBanners().then(setBanners)
  }, [])

  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        const len = banners.length || 1
        return (i + 1) % len
      })
    }, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, banners.length])

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow"
      style={{ border: '1px solid var(--section-border)', background: 'var(--background)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
  <div className="relative h-40 sm:h-48 md:h-56 lg:h-60">
        {(banners.length ? banners : []).map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'} `}
            aria-hidden={i !== index}
          >
            {b.linkUrl ? (
              <Link href={b.linkUrl} className="w-full h-full block">
                <BannerContent banner={b} icon={icons[i % icons.length]} />
              </Link>
            ) : (
              <BannerContent banner={b} icon={icons[i % icons.length]} />
            )}
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
        {(banners.length ? banners : []).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-3 w-3 md:h-3.5 md:w-3.5 rounded-full transition-all ${i === index ? 'bg-white scale-110' : 'bg-white/50'}`}
            onClick={() => setIndex(i)}
            type="button"
          />
        ))}
      </div>

      {/* Admin inline editor */}
      {user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') && banners[index] && (
        <EditorBar
          banner={banners[index]}
          onChange={(updated) => {
            setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
          }}
          onSave={async () => {
            await fetch('/api/banners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(banners),
            })
          }}
        />
      )}
    </div>
  )
}

function BannerContent({ banner, icon }: { banner: BannerItem; icon: React.ReactNode }) {
  const hasImage = banner.imageUrl && banner.imageUrl.trim().length > 0
  return (
    <div
      className={`w-full h-full ${hasImage ? '' : `bg-gradient-to-r ${banner.className || 'from-blue-600/90 to-indigo-600/90'}`} flex items-center justify-between px-6 relative`}
      style={hasImage ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${banner.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <div className="text-white text-xl sm:text-2xl md:text-3xl font-semibold">{banner.title}</div>
          <div className="text-white/90 text-base sm:text-lg">{banner.description}</div>
        </div>
      </div>
      {banner.cta && (
        <Link href={banner.cta.href} className="px-4 py-2.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-white/20 hover:bg-white/30 text-white rounded-md text-sm sm:text-base font-medium backdrop-blur">
          {banner.cta.label}
        </Link>
      )}
    </div>
  )
}

function EditorBar({ banner, onChange, onSave }: { banner: BannerItem; onChange: (b: BannerItem) => void; onSave: () => Promise<void> }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [editing, setEditing] = useState(false)

  async function handleFile(file?: File) {
    if (!file) return
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentBase64: base64 }),
    })
    const json = await res.json()
    if (json.url) onChange({ ...banner, imageUrl: json.url })
  }

  return (
    <div className="absolute top-2 right-2 left-2 mx-2 rounded-md px-3 py-2 space-y-2"
      style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-white text-sm px-2 py-1 rounded hover:bg-white/10"
          aria-label="Upload banner image"
        >
          <ImageIcon size={16} /> Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || undefined)} />
        <div className="flex items-center gap-1 text-white/90 text-sm">
          <Link2 size={14} />
          <input
            className="bg-transparent border-b border-white/50 focus:outline-none text-white placeholder-white/60 text-sm px-1 w-56"
            placeholder="https://destination.link"
            value={banner.linkUrl || ''}
            onChange={(e) => onChange({ ...banner, linkUrl: e.target.value })}
          />
        </div>
        <div className="flex-1" />
        {/* Clear link button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window === 'undefined' || window.confirm('Remove the link from this slide?')) {
              onChange({ ...banner, linkUrl: '' })
            }
          }}
          className="flex items-center gap-1 text-white text-sm px-2 py-1 rounded hover:bg-white/10"
          aria-label="Remove banner link"
          title="Remove the link from this slide"
        >
          <X size={16} /> Clear link
        </button>
        {/* Delete image button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window === 'undefined' || window.confirm('Remove the image from this slide?')) {
              onChange({ ...banner, imageUrl: '' })
            }
          }}
          className="flex items-center gap-1 text-white text-sm px-2 py-1 rounded hover:bg-white/10"
          aria-label="Delete banner image"
          title="Delete the image from this slide"
        >
          <Trash size={16} /> Delete image
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1 text-white text-sm px-2 py-1 rounded hover:bg-white/10"
          aria-label="Edit banner content"
        >
          {editing ? 'Hide content' : 'Edit content'}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1 text-white text-sm px-2 py-1 rounded hover:bg-white/10"
          aria-label="Save banners"
        >
          <Save size={16} /> Save
        </button>
      </div>
      {editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <label className="text-white/80 flex flex-col">
            <span className="mb-1">Title</span>
            <input
              className="px-2 py-1 rounded bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none"
              placeholder="Banner title"
              value={banner.title || ''}
              onChange={(e) => onChange({ ...banner, title: e.target.value })}
            />
          </label>
          <label className="text-white/80 flex flex-col">
            <span className="mb-1">Description</span>
            <input
              className="px-2 py-1 rounded bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none"
              placeholder="Banner description"
              value={banner.description || ''}
              onChange={(e) => onChange({ ...banner, description: e.target.value })}
            />
          </label>
          <label className="text-white/80 flex flex-col">
            <span className="mb-1">CTA Label</span>
            <input
              className="px-2 py-1 rounded bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none"
              placeholder="e.g., Learn more"
              value={banner.cta?.label || ''}
              onChange={(e) => onChange({ ...banner, cta: { label: e.target.value, href: banner.cta?.href || '' } })}
            />
          </label>
          <label className="text-white/80 flex flex-col">
            <span className="mb-1">CTA Link</span>
            <input
              className="px-2 py-1 rounded bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none"
              placeholder="https://... or /path"
              value={banner.cta?.href || ''}
              onChange={(e) => onChange({ ...banner, cta: { label: banner.cta?.label || '', href: e.target.value } })}
            />
          </label>
          <label className="text-white/80 flex flex-col md:col-span-2">
            <span className="mb-1">Theme class (gradient)</span>
            <input
              className="px-2 py-1 rounded bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none"
              placeholder="from-blue-600/90 to-indigo-600/90"
              value={banner.className || ''}
              onChange={(e) => onChange({ ...banner, className: e.target.value })}
            />
          </label>
          <div className="flex items-center gap-2 md:col-span-2">
            <button
              type="button"
              className="text-white/80 text-xs px-2 py-1 rounded hover:bg-white/10 border border-white/20"
              onClick={() => onChange({ ...banner, cta: undefined })}
              title="Remove CTA button"
            >
              Clear CTA
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
