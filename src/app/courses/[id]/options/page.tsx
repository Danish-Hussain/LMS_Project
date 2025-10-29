'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Video, Users, ArrowLeft, BookOpen } from 'lucide-react'
import useToast from '@/hooks/useToast'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
}

export default function CourseOptionsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const toast = useToast()
  
   const courseId = params?.id ?? ''
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return
      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          credentials: 'same-origin'
        })
        if (response.ok) {
          const data = await response.json()
          setCourse(data.data || data)
        }
      } catch (err) {
        console.error('Failed to fetch course:', err)
        toast.error('Failed to load course details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  // Check authorization
  if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR'))) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: 'var(--session-subtext)' }}>
            Only instructors and admins can access this page.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--session-subtext)' }}>Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Course Not Found
          </h1>
          <p className="mb-6" style={{ color: 'var(--session-subtext)' }}>
            The course could not be loaded.
          </p>
          <Link
            href="/courses"
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </Link>

          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              {course.title}
            </h1>
            <p className="text-lg" style={{ color: 'var(--session-subtext)' }}>
              {course.description}
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Batch Option */}
          <div
            className="rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
            style={{ background: 'var(--section-bg)', border: '2px solid var(--section-border)' }}
            onClick={() => router.push(`/batches/new?courseId=${courseId}`)}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-6 group-hover:bg-blue-200 transition">
              <Users className="h-7 w-7 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              Live Batch
            </h2>

            <p className="mb-6" style={{ color: 'var(--session-subtext)' }}>
              Create a live batch with scheduled sessions. Students will enroll and attend live classes with fixed dates and times.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Scheduled live sessions</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Real-time interaction</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Fixed start and end dates</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Student progress tracking</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/batches/new?courseId=${courseId}`)
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Create Live Batch
            </button>
          </div>

          {/* On-Demand Option */}
          <div
            className="rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
            style={{ background: 'var(--section-bg)', border: '2px solid var(--section-border)' }}
            onClick={() => router.push(`/recorded-courses/new?courseId=${courseId}`)}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-6 group-hover:bg-green-200 transition">
              <Video className="h-7 w-7 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              On-Demand Course
            </h2>

            <p className="mb-6" style={{ color: 'var(--session-subtext)' }}>
              Create a self-paced pre-recorded course. Students can learn at their own pace without fixed schedules.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Self-paced learning</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Pre-recorded content</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Lifetime access</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span style={{ color: 'var(--session-text)' }}>Flexible enrollment</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/recorded-courses/new?courseId=${courseId}`)
              }}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Create On-Demand Course
            </button>
          </div>
        </div>

        {/* Skip Option */}
        <div className="mt-8 text-center">
          <p className="mb-4" style={{ color: 'var(--session-subtext)' }}>
            You can manage these later from the course dashboard
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="inline-block text-blue-600 hover:text-blue-700 font-semibold"
          >
            Go to Course Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
