'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle, Circle, Clock, Users, BookOpen, Layers, X, CalendarDays } from 'lucide-react'
import VideoPlayer from '@/components/VideoPlayer'
import VimeoPlayer from '@/components/VimeoPlayer'
import useToast from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Session {
  id: string
  title: string
  description: string | null
  videoUrl: string
  duration: number | null
  order: number
  isPublished: boolean
  sectionId?: string | null
  progress?: {
    completed: boolean
  }
}

interface Batch {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isActive: boolean
  _count: {
    students: number
  }
}

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number | null
  isPublished: boolean
  creator: {
    name: string
  }
  sessions: Session[]
  batches: Batch[]
  _count: {
    enrollments: number
  }
}

type CourseContentProps = {
  course: Course
  user: { id: string; role: string }
  selectedSession: Session | null
  setSelectedSession: (session: Session) => void
  isEnrolled: boolean
  handleSessionComplete: (sessionId: string) => Promise<void>
  handleEnroll: (batchId: string) => Promise<void>
  handleRecordedCourseEnroll: (recordedCourseId: string) => Promise<void>
  enrolledBatchIds: string[]
  enrolledRecordedCourseIds: string[]
  openLoginPrompt: () => void
}

function CourseContent({ 
  course, 
  user, 
  selectedSession, 
  setSelectedSession, 
  isEnrolled, 
  handleSessionComplete,
  handleEnroll,
  handleRecordedCourseEnroll,
  enrolledBatchIds,
  enrolledRecordedCourseIds,
  openLoginPrompt
}: CourseContentProps) {
  const isGuest = !user?.id
  const [sections, setSections] = useState<{ id: string; title: string; order: number; description?: string | null }[]>([])
  const enrolledBatchId = enrolledBatchIds && enrolledBatchIds.length > 0 ? enrolledBatchIds[0] : null
  const [liveProgressMap, setLiveProgressMap] = useState<Record<string, number>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [recordedCourses, setRecordedCourses] = useState<any[]>([])
  const [loadingRecordedCourses, setLoadingRecordedCourses] = useState(false)
  const [previewSections, setPreviewSections] = useState<Array<{ id: string; title: string; order: number; sessions?: Array<{ id: string; title: string; order: number; sectionId?: string | null; videoUrl?: string | null; isPreview?: boolean }> }>>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  // Tracks whether preview endpoint returned via fallback (no explicit preview sessions marked)
  const [previewUsedFallback, setPreviewUsedFallback] = useState(false)
  const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'
  const hasRecordedCourseEnrollment = enrolledRecordedCourseIds && enrolledRecordedCourseIds.length > 0
  const [descExpanded, setDescExpanded] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<{ id: string; title: string; videoUrl: string } | null>(null)

  // Lightweight trailer player (CSR only)
  const ReactPlayer = useMemo(() => dynamic(() => import('react-player'), { ssr: false }), [])

  // Type guard: section object may or may not embed sessions
  const hasSessionsArray = (obj: any): obj is { sessions: Array<{ id: string; title: string; order: number; sectionId?: string | null; videoUrl?: string | null }> } => {
    return Array.isArray(obj?.sessions)
  }


  // Derive short description and bullets for "What you'll learn"
  const shortDescription = useMemo(() => {
    // Use full text; visual truncation handled via CSS line clamp
    return course.description || ''
  }, [course.description])


  // Choose a preview video URL
  const previewVideoUrl = useMemo(() => {
    // Prefer only explicitly preview-marked sessions
    for (const sec of previewSections || []) {
      if (hasSessionsArray(sec)) {
        for (const sess of sec.sessions) {
          if ((sess as any).isPreview && sess.videoUrl) return sess.videoUrl
        }
      }
    }
    // No explicit preview video
    return null
  }, [previewSections])

  const firstPreviewVimeo = useMemo(() => {
    for (const sec of previewSections || []) {
      if (hasSessionsArray(sec)) {
        for (const sess of sec.sessions) {
          const url = (sess as any).videoUrl as string | undefined
          if ((sess as any).isPreview && url && /vimeo\.com/.test(url)) {
            return { id: sess.id, title: sess.title, videoUrl: url }
          }
        }
      }
    }
    return null
  }, [previewSections])

  // Helpers for enrollment panel
  const previewSectionsCount = useMemo(() => (previewSections?.length || 0), [previewSections])
  const previewSessionsCount = useMemo(
    () => (previewSections?.reduce((sum, s) => sum + ((hasSessionsArray(s) ? s.sessions.length : 0)), 0) || 0),
    [previewSections]
  )
  const formatPrice = (p?: number | null) => {
    if (!p || p <= 0) return 'Free'
    try { return `$${p.toFixed(2)}` } catch { return `$${p}` }
  }

  // fetch sections for the enrolled batch when available
  useEffect(() => {
    const fetchSections = async () => {
      if (!enrolledBatchId) return
      try {
        const res = await fetch(`/api/batches/${enrolledBatchId}/sections`, { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          setSections(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch sections for batch:', err)
      }
    }
    fetchSections()
  }, [enrolledBatchId])

  // Fetch sections for the enrolled recorded course when available
  useEffect(() => {
    const fetchRecordedCourseSections = async () => {
      if (!hasRecordedCourseEnrollment || !enrolledRecordedCourseIds || enrolledRecordedCourseIds.length === 0) return
      try {
        // Get the first enrolled recorded course
        const recordedCourseId = enrolledRecordedCourseIds[0]
        // First fetch the recorded course to get courseId
        const recordedCourseRes = await fetch(`/api/recorded-courses/${recordedCourseId}`, { credentials: 'same-origin' })
        if (!recordedCourseRes.ok) throw new Error('Failed to fetch recorded course')
        const recordedCourseData = await recordedCourseRes.json()
        const courseId = recordedCourseData.courseId
        
        // Then fetch sections using courseId
        const res = await fetch(`/api/recorded-courses/${courseId}/sections`, { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          setSections(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch sections for recorded course:', err)
      }
    }
    fetchRecordedCourseSections()
  }, [hasRecordedCourseEnrollment, enrolledRecordedCourseIds])

  // Fetch recorded courses for this course
  useEffect(() => {
    const fetchRecordedCourses = async () => {
      try {
        setLoadingRecordedCourses(true)
        const res = await fetch(`/api/recorded-courses?courseId=${course.id}`, { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          setRecordedCourses(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch recorded courses:', err)
      } finally {
        setLoadingRecordedCourses(false)
      }
    }
    if (course.id) {
      fetchRecordedCourses()
    }
  }, [course.id])

  // Build preview of course content (for students before enrollment)
  useEffect(() => {
    const fetchPreview = async () => {
      if (isAdmin) return
      if (isEnrolled || hasRecordedCourseEnrollment) return
      try {
        setLoadingPreview(true)
        // Prefer recorded-course sections to show complete curriculum
        const rcRes = await fetch(`/api/recorded-courses/${course.id}/sections`, { credentials: 'same-origin' })
        if (rcRes.ok) {
          const data = await rcRes.json()
          if (Array.isArray(data) && data.length > 0) {
            // Determine if any sessions are explicitly marked as preview
            let anyExplicitPreview = false
            for (const s of data) {
              if (Array.isArray(s.sessions)) {
                for (const sess of s.sessions) {
                  if ((sess as any).isPreview) { anyExplicitPreview = true; break }
                }
              }
              if (anyExplicitPreview) break
            }
            setPreviewUsedFallback(!anyExplicitPreview)
            setPreviewSections(data)
            return
          }
        }

        // Fallback: use first batch sections if available
        if (course.batches && course.batches.length > 0) {
          const firstBatchId = course.batches[0].id
          const res = await fetch(`/api/batches/${firstBatchId}/sections`, { credentials: 'same-origin' })
          if (res.ok) {
            const data = await res.json()
            setPreviewUsedFallback(false)
            setPreviewSections(data || [])
            return
          }
        }

        // Nothing available
        setPreviewUsedFallback(false)
        setPreviewSections([])
      } catch (e) {
        console.error('Failed to fetch preview sections', e)
        setPreviewUsedFallback(false)
        setPreviewSections([])
      } finally {
        setLoadingPreview(false)
      }
    }
    if (course?.id) fetchPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, isEnrolled, hasRecordedCourseEnrollment])

  // For admins/instructors: fetch sections for this course (recorded/self-paced sections)
  useEffect(() => {
    const fetchAdminSections = async () => {
      if (!isAdmin || !course.id) return
      try {
        const res = await fetch(`/api/recorded-courses/${course.id}/sections`, { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          setSections(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch sections for admin:', err)
      }
    }
    fetchAdminSections()
  }, [isAdmin, course.id])

  const canAccess = isAdmin || isEnrolled || hasRecordedCourseEnrollment

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Preview Modal */}
      {showPreviewModal && selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowPreviewModal(false); setSelectedPreview(null) }} />
          <div className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedPreview.title}</h3>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => { setShowPreviewModal(false); setSelectedPreview(null) }}
                aria-label="Close preview"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-0">
              {/* Strictly Vimeo-only preview in modal */}
              { /vimeo\.com/.test(selectedPreview.videoUrl) ? (
                <VimeoPlayer videoUrl={selectedPreview.videoUrl} />
              ) : null }
            </div>
          </div>
        </div>
      )}
      {/* Breadcrumbs */}
      <nav className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-[13px] sm:text-sm">
          <li>
            <Link href="/" className="hover:underline" style={{ color: 'var(--foreground)' }}>Home</Link>
          </li>
          <li className="opacity-60" style={{ color: 'var(--session-subtext)' }}>›</li>
          <li>
            <Link href="/courses" className="hover:underline" style={{ color: 'var(--foreground)' }}>Courses</Link>
          </li>
          <li className="opacity-60" style={{ color: 'var(--session-subtext)' }}>›</li>
          <li className="truncate" aria-current="page" style={{ color: 'var(--session-subtext)' }}>
            {course.title}
          </li>
        </ol>
      </nav>
      {/* Header: title + description + counts */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-6">
        <div className="rounded-lg shadow-md p-6 mb-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>{course.title}</h1>
          {course.description && (
            <>
              <p
                className="text-sm sm:text-base mb-2"
                style={{
                  color: 'var(--session-text)',
                  display: descExpanded ? undefined : '-webkit-box',
                  WebkitLineClamp: descExpanded ? (undefined as any) : 3,
                  WebkitBoxOrient: descExpanded ? (undefined as any) : 'vertical',
                  overflow: descExpanded ? undefined : 'hidden'
                }}
              >
                {shortDescription}
              </p>
              {course.description.length > 220 && (
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold mb-2"
                  onClick={() => setDescExpanded((v) => !v)}
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </>
          )}
          {/* Sections/sessions counts and "What you'll learn" intentionally removed for a cleaner header */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6">
        {/* Batch Management for Instructors */}
        {isAdmin && (
          <div className="rounded-lg shadow-md p-6 mb-8" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Batches</h2>
                <p className="text-gray-600">Create and manage batches for this course.</p>
              </div>
              <Link
                href={`/batches/new?courseId=${course.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Create Batch
              </Link>
            </div>

            <div className="space-y-3">
              {course.batches.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
                  No batches created yet.
                </div>
              ) : (
                course.batches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/batches/${batch.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{batch.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Starts: {new Date(batch.startDate).toLocaleDateString()}</p>
                      {batch.endDate && <p>Ends: {new Date(batch.endDate).toLocaleDateString()}</p>}
                      <p>{batch._count.students} students enrolled</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Course Content and Recorded Courses Side by Side */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 mb-8">
            {/* Recorded Courses Section - 30% */}
            <div className="lg:col-span-3 rounded-lg shadow-md p-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recorded Courses</h2>
                  <p className="text-gray-600 text-xs">Create and manage recorded courses for this course.</p>
                </div>
              </div>
              <div className="mb-4">
                <Link
                  href={`/recorded-courses/new?courseId=${course.id}`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-center block"
                >
                  Create Course
                </Link>
              </div>

              <div className="space-y-3">
                {loadingRecordedCourses ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading...
                  </div>
                ) : recordedCourses.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <p className="mb-3 text-sm">No recorded courses created yet.</p>
                    <p className="text-xs">Create recorded courses for students who prefer self-paced learning without live sessions.</p>
                  </div>
                ) : (
                  recordedCourses.map((course) => (
                    <div key={course.id} className="p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all" style={{ borderColor: 'var(--section-border)' }}>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{course.name}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{course.description || 'No description'}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold text-blue-600">
                          {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Course Content - 70% */}
            <div className="lg:col-span-7 rounded-lg shadow-md p-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
                  <p className="text-gray-600 text-sm">
                    {course.sessions.length} lectures • {course.sessions.reduce((sum, s) => sum + (s.duration || 0), 0)} min total length
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedSections(new Set(sections.map(s => s.id)))}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                  >
                    Expand all
                  </button>
                  <button
                    onClick={() => setExpandedSections(new Set())}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                  >
                    Collapse all
                  </button>
                </div>
              </div>

              <div className="space-y-0 border border-gray-200 rounded-lg divide-y max-h[600px] overflow-y-auto">
                {sections && sections.length > 0 ? (
                  // Render grouped by section when sections exist
                  sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, sIdx) => (
                      <div key={section.id} className="border-b last:border-b-0">
                        <div className="px-4 py-3 border-b" style={{ background: 'var(--background)', borderColor: 'var(--section-border)' }}>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-3 font-semibold text-sm" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)' }}>
                              {sIdx + 1}
                            </div>
                            <div>
                              <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                                {section.title}
                              </h3>
                            </div>
                            <div className="ml-auto">
                              <button
                                onClick={() => {
                                  const next = new Set(expandedSections)
                                  if (next.has(section.id)) next.delete(section.id); else next.add(section.id)
                                  setExpandedSections(next)
                                }}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                              >
                                {expandedSections.has(section.id) ? 'Collapse' : 'Expand'}
                              </button>
                            </div>
                          </div>
                        </div>
                        {expandedSections.has(section.id) && (
                          <div className="p-3 space-y-2">
                          {course.sessions
                            .filter((s) => s.sectionId === section.id)
                            .sort((a, b) => a.order - b.order)
                            .map((session, idx) => (
                              <div key={session.id} className="border rounded-lg" style={{ borderColor: 'var(--section-border)' }}>
                                <div 
                                  className="p-4 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedSession(session)}
                                >
                                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500">
                                    <span className="text-sm font-semibold">{idx + 1}</span>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                                    <p className="text-sm text-gray-600">{session.duration ? `${session.duration} min` : 'Duration not set'}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    {session.isPublished ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                                        Published
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                        Draft
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedSession(session) }}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap"
                                    >
                                      Preview
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {course.sessions.filter((s) => s.sectionId === section.id).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500">No sessions in this section.</div>
                          )}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  // Fallback: flat list of sessions when no sections are present
                  <>
                    {course.sessions.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">No lectures added yet. Add lectures through batch sessions.</div>
                    ) : (
                      course.sessions.map((session, idx) => (
                        <div key={session.id} className="border-b last:border-b-0">
                          <div 
                            className="p-4 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500">
                              <span className="text-sm font-semibold">{idx + 1}</span>
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                              <p className="text-sm text-gray-600">{session.duration ? `${session.duration} min` : 'Duration not set'}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {session.isPublished ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                                  Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                  Draft
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedSession(session) }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap"
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Options for Students */}
        {!isAdmin && !isEnrolled && !hasRecordedCourseEnrollment && (course.batches.length > 0 || recordedCourses.length > 0) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
              {/* Preview Tile - 70% width on large screens (left) */}
              <div className="lg:col-span-7 rounded-lg shadow-md p-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Course Content Preview</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--session-subtext)' }}>
                  {previewSections.length} sections • {previewSections.reduce((sum, s) => sum + (s.sessions?.length || 0), 0)} sessions
                </p>
                {loadingPreview ? (
                  <div className="text-sm text-gray-500">Loading content…</div>
                ) : previewSections.length === 0 ? (
                  <div className="text-sm text-gray-500">Content not available yet.</div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                    {previewSections.sort((a,b) => a.order - b.order).map((sec, idx) => (
                      <div key={sec.id} className="border rounded-lg" style={{ borderColor: 'var(--section-border)' }}>
                        <div className="px-3 py-2 flex items-center" style={{ background: 'var(--background)' }}>
                          <div className="w-6 h-6 flex items-center justify-center rounded-full mr-2 text-sm font-semibold" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)' }}>{idx + 1}</div>
                          <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{sec.title}</div>
                        </div>
                        {(sec.sessions && sec.sessions.length > 0) ? (
                          <ul className="px-3 py-2 space-y-1">
                            {sec.sessions.sort((a,b) => a.order - b.order).map(sess => {
                              const isPreview = (sess as any).isPreview === true
                              const url = (sess as any).videoUrl as string | undefined
                              const isVimeo = !!url && /vimeo\.com/.test(url)
                              const clickable = isPreview && !!url && isVimeo
                              return (
                                <li
                                  key={sess.id}
                                  className={`text-sm flex items-center gap-2 ${clickable ? 'cursor-pointer hover:underline' : ''}`}
                                  style={{ color: 'var(--session-text)' }}
                                  onClick={() => {
                                    if (!clickable) return
                                    // Defer opening slightly to avoid play() on a soon-removed DOM
                                    const next = { id: sess.id, title: sess.title, videoUrl: url! }
                                    setSelectedPreview(next)
                                    setTimeout(() => setShowPreviewModal(true), 0)
                                  }}
                                  title={clickable ? 'Play preview' : undefined}
                                >
                                  <span>• {sess.title}</span>
                                  {isPreview && isVimeo && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                                      Preview
                                    </span>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">No sessions in this section.</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enroll Tile - 30% width on large screens (right) */}
              <div className="lg:col-span-3 lg:sticky lg:top-6 rounded-lg shadow-md p-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
                {/* Trailer Preview */}
                <div
                  className={`mb-4 ${firstPreviewVimeo ? 'cursor-pointer' : ''}`}
                  onClick={firstPreviewVimeo ? () => { setSelectedPreview(firstPreviewVimeo); setTimeout(() => setShowPreviewModal(true), 0) } : undefined}
                >
                  <div className="relative w-full group" style={{ paddingTop: '56.25%' }}>
                    <div className="absolute inset-0 rounded-md overflow-hidden border" style={{ borderColor: 'var(--section-border)' }}>
                      {course.thumbnail ? (
                        <Image src={course.thumbnail} alt={`${course.title} thumbnail`} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--session-subtext)' }}>
                          <span className="text-sm">{previewVideoUrl ? 'Preview available' : 'Preview video not available'}</span>
                        </div>
                      )}
                      {/* Overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-colors ${firstPreviewVimeo ? 'bg-black/30 opacity-100 group-hover:bg-black/50' : 'bg-black/10'}`}>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: firstPreviewVimeo ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' }}>
                          <Play className={`h-4 w-4 ${firstPreviewVimeo ? 'text-white' : 'text-gray-200'}`} />
                          <span className={`text-xs font-semibold ${firstPreviewVimeo ? 'text-white' : 'text-gray-200'}`}>{firstPreviewVimeo ? 'Preview this course' : 'No preview'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Enroll in This Course</h2>
                <p className="mb-6" style={{ color: 'var(--session-subtext)' }}>Choose how you'd like to learn this course.</p>

                {/* Live Batch Enrollment */}
                {course.batches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>📅 Live Sessions</h3>
                    <div className={`grid grid-cols-1 gap-5 mt-3 ${course.batches.length > 1 ? 'md:grid-cols-2 lg:grid-cols-2' : ''}`}>
                      {course.batches.map((batch) => (
                        <div
                          key={batch.id}
                          className={`border rounded-lg hover:border-blue-300 hover:shadow-sm transition-all relative overflow-hidden ${course.batches.length === 1 ? 'p-6 md:p-7 ring-1 ring-blue-600/10' : 'p-4'}`}
                          style={{ borderColor: 'var(--section-border)', background: 'var(--background)' }}
                        >
                          {course.batches.length === 1 && (
                            <div
                              aria-hidden
                              className="absolute inset-0 pointer-events-none"
                              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.00) 45%)' }}
                            />
                          )}
                          {(() => {
                            const start = new Date(batch.startDate)
                            const now = new Date()
                            const ms = start.getTime() - now.getTime()
                            const daysUntil = Math.ceil(ms / (1000 * 60 * 60 * 24))
                            const students = batch._count?.students ?? 0
                            const fillingFast = daysUntil <= 7 && students >= 5
                            const limitedSeats = daysUntil <= 14 && students <= 2
                            return (
                              <div className="relative z-10 flex items-center justify-between mb-3">
                                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{batch.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${batch.isActive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {batch.isActive ? 'Active' : 'Upcoming'}
                                  </span>
                                  {fillingFast && (
                                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap bg-amber-100 text-amber-800">Filling fast</span>
                                  )}
                                  {!fillingFast && limitedSeats && (
                                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap bg-yellow-100 text-yellow-800">Limited seats</span>
                                  )}
                                </div>
                              </div>
                            )
                          })()}
                          <div className="relative z-10 mt-2 space-y-2 text-sm" style={{ color: 'var(--session-subtext)' }}>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              <span>Starts: {new Date(batch.startDate).toLocaleDateString()}</span>
                              {(() => {
                                const start = new Date(batch.startDate)
                                const now = new Date()
                                const ms = start.getTime() - now.getTime()
                                const daysUntil = Math.ceil(ms / (1000 * 60 * 60 * 24))
                                return (
                                  <span className="ml-2 text-xs opacity-80">(
                                    {daysUntil > 0 ? `${daysUntil} day${daysUntil === 1 ? '' : 's'} left` : 'Started'}
                                  )</span>
                                )
                              })()}
                            </div>
                            {batch.endDate && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Ends: {new Date(batch.endDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{batch._count.students} students enrolled</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { if (isGuest) { openLoginPrompt(); } else { handleEnroll(batch.id) } }}
                            disabled={enrolledBatchIds.includes(batch.id)}
                            className={`mt-4 md:mt-5 w-full px-4 ${course.batches.length === 1 ? 'py-3 text-base' : 'py-2 text-sm'} rounded-lg font-semibold transition-colors ${
                              enrolledBatchIds.includes(batch.id)
                                ? 'bg-gray-300 cursor-not-allowed text-gray-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {enrolledBatchIds.includes(batch.id)
                              ? 'Already Enrolled'
                              : course.price && course.price > 0
                                ? `Enroll - $${course.price}`
                                : 'Enroll Free'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recorded Course Enrollment */}
                {recordedCourses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>🎥 On-Demand (Self-Paced)</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">Best for self learners</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {recordedCourses.map((rc) => {
                        const isEnrolledRc = enrolledRecordedCourseIds.includes(rc.id)
                        const isAvailable = !!rc.isPublished
                        const priceLabel = formatPrice(rc.price)
                        return (
                          <div key={rc.id} className="rounded-lg p-4 hover:shadow-sm transition-all border" style={{ borderColor: 'var(--section-border)', background: 'var(--background)' }}>
                            {/* Top row: price + status */}
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col">
                                <div className={`text-lg font-bold ${priceLabel === 'Free' ? 'text-green-600' : 'text-blue-600'}`}>{priceLabel}</div>
                                <p className="text-xs mt-1" style={{ color: 'var(--session-subtext)' }}>Self-paced version of this course.</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {isAvailable ? 'Available' : 'Coming Soon'}
                              </span>
                            </div>
                            {/* Meta: sections • sessions */}
                            <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: 'var(--session-subtext)' }}>
                              <div className="flex items-center gap-1">
                                <Layers className="h-4 w-4" />
                                <span>{previewSectionsCount} {previewSectionsCount === 1 ? 'section' : 'sections'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Play className="h-4 w-4" />
                                <span>{previewSessionsCount} {previewSessionsCount === 1 ? 'session' : 'sessions'}</span>
                              </div>
                            </div>
                            {/* Features */}
                            <ul className="mt-3 text-xs space-y-1" style={{ color: 'var(--session-subtext)' }}>
                              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Learn at your own pace</li>
                              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Immediate access on enrollment</li>
                              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Course content preview available</li>
                            </ul>
                            <button
                              onClick={() => { if (isGuest) { openLoginPrompt(); } else { handleRecordedCourseEnroll(rc.id) } }}
                              disabled={!isAvailable || isEnrolledRc}
                              className={`mt-4 w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                                isEnrolledRc
                                  ? 'bg-gray-300 cursor-not-allowed text-gray-700'
                                  : !isAvailable
                                  ? 'bg-gray-300 cursor-not-allowed text-gray-700'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {isEnrolledRc
                                ? 'Already Enrolled'
                                : !isAvailable
                                ? 'Coming Soon'
                                : priceLabel === 'Free'
                                  ? 'Enroll Free'
                                  : `Enroll - ${priceLabel}`}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* No Options Available */}
                {course.batches.length === 0 && recordedCourses.length === 0 && (
                  <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <p>No enrollment options available yet. Please check back soon.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}


        {/* Course Layout Grid */}
        {canAccess && !isAdmin && (course.sessions.length > 0 || sections.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto">
          {/* Sessions List */}
          <div className="lg:col-span-3 lg:min-h-[calc(100vh-6rem)]">
            <div className="rounded-xl shadow-sm h-full sticky top-4 border" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
              <div className="p-4">
                <div className="space-y-6">
                  {/* Show course info for students when sections are available (batch or recorded) */}
                  {sections && sections.length > 0 && !isAdmin && (
                    <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--section-border)' }}>
                      <h2 className="text-base font-bold mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }}>{course.title}</h2>
                      <p className="text-xs" style={{ color: 'var(--session-subtext)' }}>
                        <span className="font-semibold text-blue-600">{sections.length}</span> sections • 
                        <span className="font-semibold text-blue-600"> {sections.reduce((sum, s) => {
                          const sessionCount = course.sessions.filter(session => session.sectionId === s.id).length
                          return sum + sessionCount
                        }, 0)}</span> sessions
                      </p>
                    </div>
                  )}
                  {sections && sections.length > 0 ? (
                    // Render grouped by section for enrolled batch
                    sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, idx) => (
                        <div key={section.id} className="rounded-lg border overflow-hidden transition-colors duration-200" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
                          <div className="px-4 py-3 border-b" style={{ background: 'var(--background)', borderColor: 'var(--section-border)' }}>
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-3 font-semibold text-sm" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)' }}>
                                {idx + 1}
                              </div>
                              <div>
                                <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                                  {section.title}
                                </h3>
                                {section.description && (
                                  <p className="mt-1 text-sm" style={{ color: 'var(--session-subtext)' }}>{section.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            {course.sessions
                              .filter((s) => s.sectionId === section.id)
                              .sort((a, b) => a.order - b.order)
                              .map((session) => (
                                <div
                                  key={session.id}
                                  onClick={() => setSelectedSession(session)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') setSelectedSession(session)
                                  }}
                                  className="w-full text-left p-4 rounded-lg transition-all cursor-pointer border"
                                  style={{
                                    background: selectedSession?.id === session.id 
                                      ? 'rgba(37, 99, 235, 0.1)' 
                                      : session.progress?.completed 
                                      ? 'rgba(16, 185, 129, 0.1)' 
                                      : 'var(--section-bg)',
                                    borderColor: selectedSession?.id === session.id 
                                      ? 'var(--accent)' 
                                      : session.progress?.completed 
                                      ? 'rgba(16, 185, 129, 0.3)' 
                                      : 'var(--section-border)'
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-grow">
                                      <div className="mr-3">
                                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{session.title}</span>
                                        {liveProgressMap[session.id] && !session.progress?.completed && (
                                          <div className="h-1 rounded-full mt-2" style={{ background: 'var(--section-border)' }}>
                                            <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${liveProgressMap[session.id]}%` }} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleSessionComplete(session.id); }} className="ml-2 p-1 rounded-full transition-colors" style={{ background: session.progress?.completed ? 'rgba(16, 185, 129, 0.2)' : 'var(--section-border)' }}>
                                        {session.progress?.completed ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <Circle className="h-5 w-5" style={{ color: 'var(--session-subtext)' }} />
                                        )}
                                    </button>
                                  </div>
                                  {session.duration && (
                                    <div className="flex items-center mt-2 text-sm ml-0" style={{ color: 'var(--session-subtext)' }}>
                                      <Clock className="h-4 w-4 mr-1.5" />
                                      <span>{Math.floor(session.duration)} min</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    // Fallback to flat list if no sections
                    course.sessions
                      .sort((a, b) => a.order - b.order)
                      .map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedSession(session);
                            }
                          }}
                          className="w-full text-left p-4 rounded-lg transition-all cursor-pointer border"
                          style={{
                            background: selectedSession?.id === session.id 
                              ? 'rgba(37, 99, 235, 0.1)' 
                              : session.progress?.completed 
                              ? 'rgba(16, 185, 129, 0.1)' 
                              : 'var(--section-bg)',
                            borderColor: selectedSession?.id === session.id 
                              ? 'var(--accent)' 
                              : session.progress?.completed 
                              ? 'rgba(16, 185, 129, 0.3)' 
                              : 'var(--section-border)'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-grow">
                              <div className="mr-3">
                                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{session.title}</span>
                                        {liveProgressMap[session.id] && !session.progress?.completed && (
                                          <div className="h-1 rounded-full mt-2" style={{ background: 'var(--section-border)' }}>
                                            <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${liveProgressMap[session.id]}%` }} />
                                          </div>
                                        )}
                              </div>
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleSessionComplete(session.id); }} className="ml-2 p-1 rounded-full transition-colors" style={{ background: session.progress?.completed ? 'rgba(16, 185, 129, 0.2)' : 'var(--section-border)' }}>
                                {session.progress?.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className="h-5 w-5" style={{ color: 'var(--session-subtext)' }} />
                                )}
                            </button>
                          </div>
                          {session.duration && (
                            <div className="flex items-center mt-2 text-sm ml-0" style={{ color: 'var(--session-subtext)' }}>
                              <Clock className="h-4 w-4 mr-1.5" />
                              <span>{Math.floor(session.duration)} min</span>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="lg:col-span-9">
            {selectedSession && canAccess ? (
              <div className="rounded-xl shadow-sm border" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--section-border)' }}>
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                    {selectedSession.title}
                  </h2>
                  <div className="text-sm flex items-center space-x-3" style={{ color: 'var(--session-subtext)' }}>
                    <div className="text-xs" style={{ color: 'var(--session-subtext)' }}>Progress</div>
                    {(() => {
                      // derive course-level progress from current `course` object (will reflect optimistic updates)
                      const total = course?.sessions?.length || 0
                      const completedCount = course?.sessions?.filter((s: any) => s.progress?.completed).length || 0
                      const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0
                      const bgColor = percent >= 80 ? 'rgba(16, 185, 129, 0.15)' : percent >= 30 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(107, 114, 128, 0.15)'
                      const textColor = percent >= 80 ? 'rgb(16, 185, 129)' : percent >= 30 ? 'rgb(234, 179, 8)' : 'var(--session-subtext)'
                      return (
                        <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: bgColor, color: textColor }}>{percent}%</div>
                      )
                    })()}
                  </div>
                </div>
                <div className="p-6">
                  <VideoPlayer
                    videoUrl={selectedSession.videoUrl}
                    sessionId={selectedSession.id}
                    userId={user.id}
                    playbackDebug={true}
                    onProgressUpdate={(playedSeconds) => {
                      if (!selectedSession || !selectedSession.duration) return
                      const pct = Math.min(100, Math.round((playedSeconds / selectedSession.duration) * 100))
                      setLiveProgressMap((prev) => ({ ...prev, [selectedSession.id]: pct }))
                    }}
                    onComplete={(sessionId) => handleSessionComplete(sessionId)}
                  />
                  {selectedSession.description && (
                    <div className="mt-6">
                      <p style={{ color: 'var(--session-subtext)' }}>{selectedSession.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default function CourseDetailPage() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<string[]>([])
  const [enrolledRecordedCourseIds, setEnrolledRecordedCourseIds] = useState<string[]>([])
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  useEffect(() => {
    const initializeCourse = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await fetchCourseData();
      setIsLoading(false);
    };

    initializeCourse();
  }, [courseId, user]);

  const fetchCourseData = async () => {
    if (!courseId) {
      console.log('Skipping course fetch - no courseId');
      return;
    }
    const isGuest = !user
    try {
      setIsLoading(true);
  console.log('Initiating course fetch:', { courseId, userId: user ? user.id : 'guest' });

      const url = isGuest ? `/api/courses/${courseId}?public=1` : `/api/courses/${courseId}`
      const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      let responseData: any = null;
      let responseText: string | null = null;
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (parseError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('JSON Parse Error:', parseError);
          }
        }
      } else {
        try {
          responseText = await response.text();
        } catch (textError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Text Read Error:', textError);
          }
        }
      }

      if (response.ok) {
        console.log('Response successful:', {
          status: response.status,
          contentType,
          hasData: !!responseData
        });

        if (!responseData || !responseData.course) {
          const friendly = 'Course data missing from response';
          if (process.env.NODE_ENV === 'development') {
            console.error('Course API shape error:', {
              status: response.status,
              contentType,
              dataKeys: responseData ? Object.keys(responseData) : null,
            });
          }
          toast.error(friendly);
          return;
        }

        // Success path
        setCourse(responseData.course);
  setIsEnrolled(responseData.isEnrolled ?? false);
  setEnrolledBatchIds(responseData.enrolledBatchIds || []);
  setEnrolledRecordedCourseIds(responseData.enrolledRecordedCourseIds || []);

        if (responseData.course?.sessions?.length > 0 && !selectedSession) {
          setSelectedSession(responseData.course.sessions[0]);
        }

      } else {
        // Error path (single dev log, friendly toast, then return)
        const status = response.status;
        const statusText = response.statusText;
        const bodySummary = responseData || responseText || null;
        const rawMsg = (responseData && (responseData.error || responseData.message))
          || (typeof bodySummary === 'string' ? bodySummary.slice(0, 200) : null)
          || `${status} ${statusText}`;

        const friendly =
          status === 404 ? 'Course not found'
          : status === 401 || status === 403 ? 'You do not have access to this course'
          : status >= 500 ? 'Server error while loading the course'
          : 'Failed to fetch course';

        if (process.env.NODE_ENV === 'development') {
          // Avoid undefined so dev consoles that JSON.stringify args don't collapse to {}
          const debug = {
            status: Number.isFinite(status as any) ? status : null,
            statusText: statusText || null,
            contentType: contentType || null,
            url, // actual request URL (may include public=1)
            body: typeof bodySummary === 'string' ? bodySummary : (bodySummary ?? null),
          } as const;
          try {
            // Prefer object logging for easy expansion; fallback to string if needed
            console.error('Course API error:', debug);
          } catch {
            try {
              console.error('Course API error:', JSON.stringify(debug));
            } catch {
              console.error('Course API error');
            }
          }
        }
        toast.error(rawMsg || friendly);
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (process.env.NODE_ENV === 'development') {
        console.error('Course Fetch Error (network/unknown):', { error, message, courseId });
      }
      toast.error(message || 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (batchId: string) => {
    try {
      if (course?.price && course.price > 0) {
        window.location.href = `/payment?courseId=${courseId}&batchId=${batchId}`;
        return;
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId, batchId })
      });

      if (response.ok) {
        await fetchCourseData();
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  const handleRecordedCourseEnroll = async (recordedCourseId: string) => {
    try {
      const response = await fetch('/api/recorded-courses/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recordedCourseId })
      });

      if (response.ok) {
        toast.success('Successfully enrolled in course!');
        await fetchCourseData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Failed to enroll in recorded course:', error);
      toast.error('Failed to enroll');
    }
  };

  const handleSessionComplete = async (sessionId: string) => {
    // Find the current session status
    const sessionObj = course?.sessions?.find((s) => s.id === sessionId)
    const currentCompleted = !!sessionObj?.progress?.completed
    const newStatus = !currentCompleted

    try {

      // Optimistic UI update
      setCourse((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          sessions: prev.sessions.map((s) => 
            s.id === sessionId 
              ? { ...s, progress: { ...(s.progress || {}), completed: newStatus } }
              : s
          )
        }
      })

      // Send API request
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          completed: newStatus
        })
      });

      if (response.ok) {
        toast.success(newStatus ? 'Session marked complete' : 'Session marked incomplete')
      } else {
        // If request fails, revert the optimistic update
        setCourse((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            sessions: prev.sessions.map((s) => 
              s.id === sessionId 
                ? { ...s, progress: { ...(s.progress || {}), completed: currentCompleted } }
                : s
            )
          }
        })
        const errText = await response.text().catch(() => 'Failed to update session status')
        toast.error(errText)
      }
    } catch (error) {
      console.error('Failed to mark session as complete:', error);
      toast.error(String(error))
      // Revert optimistic update on error
      setCourse((prev) => {
        if (!prev) return prev
        const sessions = prev.sessions.map(s => 
          s.id === sessionId 
            ? { ...s, progress: { ...(s.progress || {}), completed: currentCompleted } }
            : s
        )
        return { ...prev, sessions }
      })
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Guests can view course detail in preview mode

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-8">The course you're looking for doesn't exist.</p>
          <Link href="/courses" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <CourseContent
        course={course}
        user={(user as any) || ({} as any)}
        selectedSession={selectedSession}
        setSelectedSession={setSelectedSession}
        isEnrolled={isEnrolled}
        handleSessionComplete={handleSessionComplete}
        handleEnroll={handleEnroll}
        handleRecordedCourseEnroll={handleRecordedCourseEnroll}
        enrolledBatchIds={enrolledBatchIds}
        enrolledRecordedCourseIds={enrolledRecordedCourseIds}
        openLoginPrompt={() => setLoginPromptOpen(true)}
      />
      <ConfirmDialog
        open={loginPromptOpen}
        title="Sign in required"
        message="Please sign in to enroll."
        cancelLabel="Cancel"
        confirmLabel="Login"
        onCancel={() => setLoginPromptOpen(false)}
        onConfirm={() => { setLoginPromptOpen(false); router.push('/login') }}
      />
    </>
  )
}