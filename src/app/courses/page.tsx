"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Play, Clock } from 'lucide-react'
import CourseThumbnail from '@/components/CourseThumbnail'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  image?: string | null
  price: number | null
  discountPercent?: number | null
  isPublished: boolean
  createdAt: string
  creator: {
    name: string
  }
  sessions: {
    id: string
    title: string
    duration: number | null
  }[]
  recordedCourses?: {
    id: string
    price: number | null
    discountPercent?: number | null
    isPublished: boolean
  }[]
  _count: {
    enrollments: number
  }
}

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // pricing localization (best-effort)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const [usdToInr, setUsdToInr] = useState<number | null>(null)

  useEffect(() => {
    fetchCourses()
    ;(async () => {
      try {
        const geoRes = await fetch('https://ipapi.co/json/')
        if (geoRes.ok) {
          const geo = await geoRes.json().catch(() => null)
          if (geo && (geo.country_code === 'IN' || geo.country === 'India')) {
            setCurrency('INR')
            try {
              const rateRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=INR')
              if (rateRes.ok) {
                const data = await rateRes.json().catch(() => null)
                const r = data?.rates?.INR
                if (typeof r === 'number' && r > 0) setUsdToInr(r)
              }
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
    })()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      }
    } catch (e) {
      console.error('fetch courses', e)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLocalizedPrice = (p?: number | null) => {
    if (!p || p <= 0) return 'Free'
    if (currency === 'INR') {
      const rate = usdToInr || 83
      const inr = p * rate
      try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inr)
      } catch {
        return `₹${Math.round(inr).toLocaleString('en-IN')}`
      }
    }
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p)
    } catch {
      return `$${p}`
    }
  }

  const computePriceParts = (usd?: number | null, d?: number | null) => {
    const price = typeof usd === 'number' ? usd : null
    const pct = typeof d === 'number' ? Math.max(0, Math.min(100, d)) : 0
    if (!price || price <= 0) return { label: 'Free', original: null as string | null, percent: 0 }
    const label = formatLocalizedPrice(price)
    if (!pct) return { label, original: null as string | null, percent: 0 }
    const original = formatLocalizedPrice(price / (1 - pct / 100))
    return { label, original, percent: Math.round(pct) }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // only admins should see manage-specific counts/creator
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Courses</h1>
            <p className="mt-2" style={{ color: 'var(--session-subtext)' }}>{isAdmin ? 'Manage your courses' : 'Browse available courses'}</p>
          </div>
          {isAdmin && (
            <Link href="/courses/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create Course
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No courses found</h3>
            <p style={{ color: 'var(--session-subtext)' }}>{isAdmin ? 'Create your first course to get started.' : 'No courses are available yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {courses.map((course) => {
              // Prefer a published recorded course price (choose lowest price) when available
              const publishedRecorded = (course.recordedCourses || []).filter(rc => rc.isPublished)
              let priceSource = course.price ?? 0
              let discountSource = course.discountPercent ?? 0
              if (publishedRecorded.length > 0) {
                // pick recorded course with minimum price (non-null)
                const withPrice = publishedRecorded.map(rc => ({ ...rc, priceVal: typeof rc.price === 'number' ? rc.price : Infinity }))
                withPrice.sort((a, b) => a.priceVal - b.priceVal)
                const chosen = withPrice[0]
                priceSource = typeof chosen.priceVal === 'number' && chosen.priceVal !== Infinity ? chosen.priceVal : priceSource
                discountSource = typeof chosen.discountPercent === 'number' ? chosen.discountPercent : discountSource
              }
              const parts = computePriceParts(priceSource, discountSource)
              return (
                <div key={course.id} className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all flex flex-col h-full" style={{ background: 'var(--background)' }}>
                  <Link href={`/courses/${course.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <div className="h-48 md:h-56 w-full overflow-hidden bg-gray-50">
                      <CourseThumbnail image={(course as any).image ?? course.thumbnail} thumbnail={course.thumbnail} title={course.title} />
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col min-h-0">
                    <div className="mb-2 min-h-[72px] md:min-h-[84px]">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold line-clamp-2" style={{ color: 'var(--foreground)' }}>{course.title}</h3>
                        {!course.isPublished && <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Draft</span>}
                      </div>

                      {/* price visible to everyone */}
                      <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-extrabold ${parts.label === 'Free' ? 'text-green-600' : 'text-blue-600'} text-lg`}>{parts.label}</span>
                          {parts.original && (
                            <>
                              <span className="text-gray-500 line-through text-sm">{parts.original}</span>
                              <span className="text-green-700 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50">{parts.percent}% off</span>
                            </>
                          )}
                        </div>
                        {parts.original && <div className="mt-0.5 text-[11px]" style={{ color: 'var(--session-subtext)' }}>Actual price: <span className="font-medium">{parts.original}</span> • Discount: <span className="font-medium">{parts.percent}%</span></div>}
                      </div>
                    </div>

                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--session-subtext)' }}>{course.description || 'No description available'}</p>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4" style={{ color: 'var(--session-subtext)' }}>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{course.sessions.length} sessions</span>
                        </div>
                        {isAdmin && (
                          <span className="text-sm" style={{ color: 'var(--session-subtext)' }}>{course._count.enrollments} enrolled</span>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Link href={`/courses/${course.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500">
                          <Play className="h-4 w-4 mr-1" />
                          {isAdmin ? 'Manage' : 'View'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
 