'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { ArrowLeft, Play, Download, BookOpen, Clock, User } from 'lucide-react'
import useToast from '../../../hooks/useToast'
import { formatINR } from '@/lib/currency'

interface RecordedCourse {
  id: string
  courseId: string
  name: string
  description: string | null
  price: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  course?: {
    id: string
    title: string
    thumbnail: string | null
    description?: string
    creator?: {
      name: string
    }
  }
}

export default function OnDemandCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  
  const courseId = params?.id ?? ''
  const [course, setCourse] = useState<RecordedCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recorded-courses/${courseId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Course not found')
        }
        throw new Error('Failed to fetch course')
      }
      const data = await response.json()
      setCourse(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setIsEnrolling(true)
      // TODO: Implement enrollment logic
      toast.info('Enrollment feature coming soon!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enrollment failed')
    } finally {
      setIsEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 md:ml-72 mt-14 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ color: 'var(--session-subtext)' }}>
            Loading course...
          </p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex-1 md:ml-72 mt-14 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {error === 'Course not found' ? 'Course Not Found' : 'Error Loading Course'}
          </h2>
          <p className="text-gray-600 mb-6" style={{ color: 'var(--session-subtext)' }}>
            {error}
          </p>
          <Link
            href="/on-demand-courses"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" suppressHydrationWarning style={{ background: 'var(--background)' }}>
      {/* Header with back button */}
      <div className="sticky top-0 z-40 shadow-sm border-b" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <Link
            href="/on-demand-courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="mb-8">
          {/* Thumbnail */}
          <div className="w-full h-96 rounded-lg overflow-hidden mb-6 flex items-center justify-center border" style={{ borderColor: 'var(--section-border)', background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(59,130,246,0.25))' }}>
            {course.course?.thumbnail ? (
              <img
                src={course.course.thumbnail}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <svg className="w-24 h-24 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Title and Meta */}
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {course.name}
          </h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600" style={{ color: 'var(--session-subtext)' }}>
                {course.course?.creator?.name || 'Unknown Instructor'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600" style={{ color: 'var(--session-subtext)' }}>
                Created {new Date(course.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {course.price > 0 ? formatINR(course.price) : 'Free'}
              </span>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                About this course
              </h2>
              <p className="text-gray-700 leading-relaxed" style={{ color: 'var(--session-text)' }}>
                {course.description}
              </p>
            </div>
          )}

          {/* Course Details Card */}
          <div className="rounded-lg border p-6 mb-8" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600" style={{ color: 'var(--session-subtext)' }}>
                  Course ID
                </div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {course.course?.id.slice(0, 8)}...
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600" style={{ color: 'var(--session-subtext)' }}>
                  Status
                </div>
                <div className="font-semibold" style={{ color: course.isPublished ? '#059669' : 'var(--session-subtext)' }}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600" style={{ color: 'var(--session-subtext)' }}>
                  Price
                </div>
                <div className="font-semibold" style={{ color: '#2563eb' }}>
                  {course.price > 0 ? formatINR(course.price) : 'Free'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600" style={{ color: 'var(--session-subtext)' }}>
                  Type
                </div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  On-Demand
                </div>
              </div>
            </div>
          </div>

          {/* Main Course Info */}
          <div className="rounded-lg border p-8" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Course from: {course.course?.title}
              </h2>
              {course.course?.description && (
                <p className="text-gray-700" style={{ color: 'var(--session-text)' }}>
                  {course.course.description}
                </p>
              )}
            </div>

            {/* Enrollment CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" />
                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
              <button className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2" style={{ borderColor: 'var(--section-border)', color: 'var(--foreground)' }}>
                <Download className="h-5 w-5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
