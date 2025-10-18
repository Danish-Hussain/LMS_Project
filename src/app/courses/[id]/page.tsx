'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle, Circle, Clock, Users, BookOpen, Layers } from 'lucide-react'
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6">
        {/* Batch and Recorded Courses Management for Instructors */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Batches Section */}
            <div className="rounded-lg shadow-md p-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
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

            {/* Recorded Courses Section */}
            <div className="rounded-lg shadow-md p-6" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recorded Courses</h2>
                  <p className="text-gray-600">Create and manage recorded courses for this course.</p>
                </div>
                <Link
                  href={`/recorded-courses/new?courseId=${course.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Create Course
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
                  <p className="mb-3">No recorded courses created yet.</p>
                  <p className="text-sm">Create recorded courses for students who prefer self-paced learning without live sessions.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Content for Instructors */}
        {isAdmin && (
          <div className="rounded-lg shadow-md p-6 mb-8" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
                <p className="text-gray-600 text-sm">
                  {course.sessions.length} lectures • {course.sessions.reduce((sum, s) => sum + (s.duration || 0), 0)} min total length
                </p>
              </div>
              <button
                onClick={() => setExpandedSections(new Set(course.sessions.map(s => s.sectionId || '').filter(Boolean)))}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                Expand all sections
              </button>
            </div>

            <div className="space-y-0 border border-gray-200 rounded-lg divide-y">
              {course.sessions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No lectures added yet. Add lectures through batch sessions.
                </div>
              ) : (
                course.sessions.map((session, idx) => (
                  <div key={session.id} className="border-b last:border-b-0">
                    <div 
                      className="p-4 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const sectionId = session.sectionId || ''
                        const newExpanded = new Set(expandedSections)
                        if (newExpanded.has(sectionId)) {
                          newExpanded.delete(sectionId)
                        } else {
                          newExpanded.add(sectionId)
                        }
                        setExpandedSections(newExpanded)
                      }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500">
                        <span className="text-sm font-semibold">{idx + 1}</span>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-600">{session.duration ? `${session.duration} min` : 'Duration not set'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.isPublished ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSession(session)
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Batch Selection for Students */}
        {!isAdmin && !isEnrolled && course.batches.length > 0 && (
          <div className="rounded-lg shadow-md p-6 mb-8" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Choose Your Batch</h2>
            <p className="mb-6" style={{ color: 'var(--session-subtext)' }}>Select a batch to enroll in this course.</p>
            
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
        {canAccess && !isAdmin && course.sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto">
          {/* Sessions List */}
          <div className="lg:col-span-3 lg:min-h-[calc(100vh-6rem)]">
            <div className="rounded-xl shadow-sm h-full sticky top-4 border" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
              <div className="p-4">
                <div className="space-y-6">
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
    if (!user || !courseId) {
      console.log('Skipping course fetch - no user or courseId');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Initiating course fetch:', { courseId, userId: user.id });

      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      let responseData = null;
      const contentType = response.headers.get('content-type');

      try {
        // Always try to parse JSON first
        responseData = await response.json();
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        const text = await response.text();
        console.error('Raw Response:', text);
        responseData = null;
      }

      if (response.ok) {
        console.log('Response successful:', {
          status: response.status,
          contentType,
          hasData: !!responseData
        });

        if (!responseData || !responseData.course) {
          throw new Error('No course data in response');
        }

        // Success path
        setCourse(responseData.course);
        setIsEnrolled(responseData.isEnrolled ?? false);
        setEnrolledBatchIds(responseData.enrolledBatchIds || []);

        if (responseData.course?.sessions?.length > 0 && !selectedSession) {
          setSelectedSession(responseData.course.sessions[0]);
        }

      } else {
        // Error path
        const errorMessage = (responseData && (responseData.error || responseData.message)) || 'Failed to fetch course';
        console.error('API Error Response:', {
          status: response.status,
          data: responseData || 'No response data'
        });

        if (process.env.NODE_ENV === 'development') {
          console.error('Detailed Error:', {
            ...(responseData || {}),
            status: response.status
          });
        }

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ?
        error.message :
        'An unexpected error occurred';

      console.error('Course Fetch Error:', {
        error,
        message,
        courseId
      });

      toast.error(message);
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