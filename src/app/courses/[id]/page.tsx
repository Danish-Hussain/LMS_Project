'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle, Clock, Users, BookOpen } from 'lucide-react'
import VideoPlayer from '@/components/VideoPlayer'
import VimeoPlayer from '@/components/VimeoPlayer'
import useToast from '@/hooks/useToast'

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

type CourseContentProps = {
  course: Course
  user: { id: string; role: string }
  selectedSession: Session | null
  setSelectedSession: (session: Session) => void
  isEnrolled: boolean
  handleSessionComplete: (sessionId: string) => Promise<void>
  handleEnroll: (batchId: string) => Promise<void>
  enrolledBatchIds: string[]
}

function CourseContent({ 
  course, 
  user, 
  selectedSession, 
  setSelectedSession, 
  isEnrolled, 
  handleSessionComplete,
  handleEnroll,
  enrolledBatchIds
}: CourseContentProps) {
  const [sections, setSections] = useState<{ id: string; title: string; order: number; description?: string | null }[]>([])
  const enrolledBatchId = enrolledBatchIds && enrolledBatchIds.length > 0 ? enrolledBatchIds[0] : null
  const [liveProgressMap, setLiveProgressMap] = useState<Record<string, number>>({})

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
  const isAdmin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR'
  const canAccess = isAdmin || isEnrolled

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6">
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
              {course.batches.map((batch) => (
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

        {/* Course Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto">
          {/* Sessions List */}
          <div className="lg:col-span-3 lg:min-h-[calc(100vh-6rem)]">
            <div className="bg-white rounded-xl shadow-sm h-full sticky top-4 border border-gray-100">
              <div className="p-4">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                </div>
                <div className="space-y-2">
                  {sections && sections.length > 0 ? (
                    // Render grouped by section for enrolled batch
                    sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <div key={section.id} className="mb-2">
                          <div className="px-3 py-2 text-sm font-semibold text-gray-800">{section.title}</div>
                          <div className="pl-3">
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
                                  className={`w-full text-left p-4 rounded-lg transition-all cursor-pointer ${
                                    selectedSession?.id === session.id
                                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                                      : session.progress?.completed
                                      ? 'bg-green-50 border border-transparent hover:border-green-200'
                                      : session.progress?.watchedTime
                                      ? 'bg-yellow-50 border border-transparent hover:border-yellow-200'
                                      : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-grow">
                                      <div className={`rounded-full p-1.5 mr-3 ${
                                        selectedSession?.id === session.id
                                          ? 'bg-blue-100 text-blue-600'
                                          : session.progress?.completed
                                          ? 'bg-green-100 text-green-600'
                                          : session.progress?.watchedTime
                                          ? 'bg-yellow-100 text-yellow-600'
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        <span className={`font-medium ${
                                          selectedSession?.id === session.id
                                            ? 'text-blue-900'
                                            : 'text-gray-900'
                                        }`}>{session.title}</span>
                                        {session.progress?.watchedTime && !session.progress.completed && (
                                          <div className="h-1 bg-gray-200 rounded-full mt-2">
                                            <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${(session.progress.watchedTime / (session.duration || 1)) * 100}%` }} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleSessionComplete(session.id); }} className={`ml-2 p-1 rounded-full transition-colors ${ session.progress?.completed ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200' }` }>
                                      <CheckCircle className="h-5 w-5" />
                                    </button>
                                  </div>
                                  {session.duration && (
                                    <div className="flex items-center mt-2 text-sm text-gray-500 ml-8">
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
                          className={`w-full text-left p-4 rounded-lg transition-all cursor-pointer ${
                            selectedSession?.id === session.id
                              ? 'bg-blue-50 border border-blue-200 shadow-sm'
                              : session.progress?.completed
                              ? 'bg-green-50 border border-transparent hover:border-green-200'
                              : session.progress?.watchedTime
                              ? 'bg-yellow-50 border border-transparent hover:border-yellow-200'
                              : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-grow">
                              <div className={`rounded-full p-1.5 mr-3 ${
                                selectedSession?.id === session.id
                                  ? 'bg-blue-100 text-blue-600'
                                  : session.progress?.completed
                                  ? 'bg-green-100 text-green-600'
                                  : session.progress?.watchedTime
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                <span className={`font-medium ${
                                  selectedSession?.id === session.id
                                    ? 'text-blue-900'
                                    : 'text-gray-900'
                                }`}>{session.title}</span>
                                {session.progress?.watchedTime && !session.progress.completed && (
                                  <div className="h-1 bg-gray-200 rounded-full mt-2">
                                    <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${(session.progress.watchedTime / (session.duration || 1)) * 100}%` }} />
                                  </div>
                                )}
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleSessionComplete(session.id); }} className={`ml-2 p-1 rounded-full transition-colors ${ session.progress?.completed ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200' }` }>
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          </div>
                          {session.duration && (
                            <div className="flex items-center mt-2 text-sm text-gray-500 ml-8">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedSession.title}
                  </h2>
                  <div className="text-sm text-gray-600 flex items-center space-x-3">
                    <div className="text-xs text-gray-400">Progress</div>
                    {(() => {
                      const live = selectedSession && liveProgressMap[selectedSession.id]
                      const fromServer = selectedSession?.progress && typeof selectedSession.progress.watchedTime === 'number' && selectedSession.duration
                        ? Math.min(100, Math.round((selectedSession.progress.watchedTime / selectedSession.duration) * 100))
                        : 0
                      const percent = typeof live === 'number' ? live : fromServer
                      const color = percent >= 80 ? 'bg-green-100 text-green-800' : percent >= 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      return (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>{percent}%</div>
                      )
                    })()}
                  </div>
                </div>
                <div className="p-6">
                  <VideoPlayer
                    videoUrl={selectedSession.videoUrl}
                    sessionId={selectedSession.id}
                    userId={user.id}
                    onProgressUpdate={(playedSeconds) => {
                      if (!selectedSession || !selectedSession.duration) return
                      const pct = Math.min(100, Math.round((playedSeconds / selectedSession.duration) * 100))
                      setLiveProgressMap((prev) => ({ ...prev, [selectedSession.id]: pct }))
                    }}
                    onComplete={(sessionId) => handleSessionComplete(sessionId)}
                  />
                  {selectedSession.description && (
                    <div className="mt-6">
                      <p className="text-gray-600">{selectedSession.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {!canAccess ? 'Enroll to Start Learning' : 'Choose a Lesson'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {!canAccess 
                    ? 'Please enroll in this course to access the video lessons and start your learning journey.'
                    : 'Select a lesson from the list to begin watching the video content.'
                  }
                </p>
                {!canAccess && (
                  <div className="mt-6">
                    <button
                      onClick={() => course.batches.length > 0 && handleEnroll(course.batches[0].id)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      {course.price && course.price > 0 ? `Enroll for $${course.price}` : 'Enroll Free'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CourseDetailPage() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<string[]>([])

  useEffect(() => {
    const initializeCourse = async () => {
      if (!user || !courseId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      await fetchCourseData();
      setIsLoading(false);
    };

    initializeCourse();
  }, [user, courseId]);

  const fetchCourseData = async () => {
    if (!user || !courseId) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setIsEnrolled(data.isEnrolled);
        setEnrolledBatchIds(data.enrolledBatchIds || []);
        if (data.course?.sessions?.length > 0 && !selectedSession) {
          setSelectedSession(data.course.sessions[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
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

  const handleSessionComplete = async (sessionId: string) => {
    try {
      // Optimistic UI: mark session completed locally so list updates instantly
      setCourse((prev) => {
        if (!prev) return prev
        const updated = { ...prev }
        updated.sessions = updated.sessions.map((s) => {
          if (s.id === sessionId) {
            return { ...s, progress: { watchedTime: s.duration ?? 0, completed: true } }
          }
          return s
        })
        return updated
      })

      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          completed: true
        })
      });

      if (response.ok) {
        toast.success('Session marked complete')
        await fetchCourseData();
      } else {
        toast.error('Failed to mark session complete')
        // revert by refetching
        await fetchCourseData();
      }
    } catch (error) {
      console.error('Failed to mark session as complete:', error);
      toast.error('Failed to mark session complete')
      await fetchCourseData();
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">Please log in to view this course.</p>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
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
          <Link href="/courses" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CourseContent
      course={course}
      user={user}
      selectedSession={selectedSession}
      setSelectedSession={setSelectedSession}
      isEnrolled={isEnrolled}
      handleSessionComplete={handleSessionComplete}
      handleEnroll={handleEnroll}
      enrolledBatchIds={enrolledBatchIds}
    />
  )
}