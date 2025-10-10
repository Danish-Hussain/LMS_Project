'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle, Clock, Users, BookOpen } from 'lucide-react'
import VideoPlayer from '@/components/VideoPlayer'
import VimeoPlayer from '@/components/VimeoPlayer'

interface Session {
  id: string
  title: string
  description: string | null
  videoUrl: string
  duration: number | null
  order: number
  isPublished: boolean
  progress?: {
    watchedTime: number
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

export default function CourseDetailPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const courseId = params.id as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<string[]>([])

  useEffect(() => {
    if (user && courseId) {
      fetchCourse()
    }
  }, [user, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data.course)
        setIsEnrolled(data.isEnrolled)
        setEnrolledBatchIds(data.enrolledBatchIds || [])
        
        // Set first session as selected if available
        if (data.course.sessions.length > 0) {
          setSelectedSession(data.course.sessions[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnroll = async (batchId: string) => {
    try {
      // If course has a price, redirect to payment page
      if (course?.price && course.price > 0) {
        window.location.href = `/payment?courseId=${courseId}&batchId=${batchId}`
        return
      }

      // Free course - enroll directly
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId, batchId })
      })

      if (response.ok) {
        setIsEnrolled(true)
        // Refresh course data
        fetchCourse()
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
    }
  }

  const handleSessionComplete = async () => {
    // Refresh course data to update progress
    fetchCourse()
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">Please log in to view this course.</p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-8">The course you're looking for doesn't exist.</p>
          <Link
            href="/courses"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'
  const canAccess = isAdmin || isEnrolled

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-2">{course.description}</p>
              <div className="flex items-center mt-4 space-x-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course._count.enrollments} enrolled</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{course.sessions.length} sessions</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span>by {course.creator.name}</span>
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await fetch(`/api/courses/${courseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPublished: !course.isPublished })
                  })
                  fetchCourse()
                }}
                className="text-right"
              >
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    course.isPublished
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {course.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </form>
            )}
            {isAdmin && (
              <div className="ml-4">
                <Link
                  href={`/courses/${courseId}/edit`}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Edit
                </Link>
              </div>
            )}

            {!isAdmin && !isEnrolled && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  {course.price ? `$${course.price}` : 'Free'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Batch Management for Instructors*/}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.batches.map((batch) => (
                <Link
                  key={batch.id}
                  href={`/batches/${batch.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{batch.name}</h3>
                  <div className="text-sm text-gray-600">
                    <p>Starts: {new Date(batch.startDate).toLocaleDateString()}</p>
                    {batch.endDate && <p>Ends: {new Date(batch.endDate).toLocaleDateString()}</p>}
                    <p>{batch._count.students} students enrolled</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Batch Selection for Students */}
        {!isAdmin && !isEnrolled && course.batches.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Batch</h2>
            <p className="text-gray-600 mb-6">Select a batch to enroll in this course.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.batches
                .filter(batch => batch.isActive)
                .map((batch) => (
                <div key={batch.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2">{batch.name}</h3>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>Starts: {new Date(batch.startDate).toLocaleDateString()}</p>
                    {batch.endDate && (
                      <p>Ends: {new Date(batch.endDate).toLocaleDateString()}</p>
                    )}
                    <p>{batch._count.students} students enrolled</p>
                  </div>
                  <button
                    onClick={() => handleEnroll(batch.id)}
                    disabled={enrolledBatchIds.includes(batch.id)}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {selectedSession && canAccess ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedSession.title}
                </h2>
                {/vimeo\.com|youtube\.com|youtu\.be|dailymotion\.com/.test(
                  selectedSession.videoUrl || ''
                ) ? (
                  <VimeoPlayer
                    videoUrl={selectedSession.videoUrl}
                    sessionId={selectedSession.id}
                    userId={user.id}
                    onComplete={handleSessionComplete}
                  />
                ) : (
                  <VideoPlayer
                    videoUrl={selectedSession.videoUrl}
                    sessionId={selectedSession.id}
                    userId={user.id}
                    onComplete={handleSessionComplete}
                  />
                )}
                {selectedSession.description && (
                  <div className="mt-4">
                    <p className="text-gray-600">{selectedSession.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {!canAccess ? 'Enroll to Access Content' : 'Select a Session'}
                </h3>
                <p className="text-gray-600">
                  {!canAccess 
                    ? 'Please enroll in this course to access the video content.'
                    : 'Choose a session from the list to start watching.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Sessions
                </h3>
                <div className="space-y-2">
                  {course.sessions
                    .sort((a, b) => a.order - b.order)
                    .map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSession?.id === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Play className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {session.title}
                          </span>
                        </div>
                        {session.progress?.completed && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {session.duration && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{Math.floor(session.duration)} min</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
